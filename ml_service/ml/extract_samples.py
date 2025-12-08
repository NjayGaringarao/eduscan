"""
Unlabeled Sample Extractor
Extracts user attendance data from database and outputs unlabeled samples in training_data.json format.

Usage:
    python ml/extract_samples.py --output ml/data/unlabeled_samples.json
    python ml/extract_samples.py --output ml/data/unlabeled_samples.json --limit 50 --min-sessions 15
"""

import argparse
import json
import os
import sys
import random
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from collections import defaultdict

# Add parent directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.supabase import get_supabase
from ml.attendance_feature import AttendanceFeature


def get_user_ids_with_min_sessions(min_sessions: int = 10, limit: Optional[int] = None, 
                                   user_ids: Optional[List[str]] = None,
                                   user_type: Optional[str] = None) -> List[str]:
    """
    Get list of user IDs that have at least min_sessions attendance records.
    
    Args:
        min_sessions: Minimum number of sessions required per user
        limit: Maximum number of users to return (None = no limit)
        user_ids: Optional list of specific user IDs to filter
        user_type: Optional filter by user type ('STUDENT' or 'EMPLOYEE')
        
    Returns:
        List of user IDs meeting the criteria
    """
    try:
        supabase = get_supabase()
        
        # Count attendance_state records per user (excluding CANCELLED)
        response = supabase.table("attendance_state") \
            .select("user_id, id") \
            .in_("mark", ["PRESENT", "ABSENT"]) \
            .execute()
        
        records = response.data if response.data else []
        
        # Count sessions per user
        user_counts = defaultdict(int)
        for record in records:
            user_id = record.get('user_id')
            if user_id:
                user_counts[user_id] += 1
        
        # Filter users with enough sessions
        eligible_users = [
            user_id for user_id, count in user_counts.items()
            if count >= min_sessions
        ]
        
        # Filter by user_type if provided
        if user_type:
            if user_type.upper() == 'STUDENT':
                student_response = supabase.table("student") \
                    .select("user_id") \
                    .execute()
                student_ids = {s.get('user_id') for s in (student_response.data or [])}
                eligible_users = [uid for uid in eligible_users if uid in student_ids]
            elif user_type.upper() == 'EMPLOYEE':
                employee_response = supabase.table("employee") \
                    .select("user_id") \
                    .execute()
                employee_ids = {e.get('user_id') for e in (employee_response.data or [])}
                eligible_users = [uid for uid in eligible_users if uid in employee_ids]
            else:
                raise ValueError(f"Invalid user_type: {user_type}. Must be 'STUDENT' or 'EMPLOYEE'")
        
        # Apply user_ids filter if provided
        if user_ids:
            eligible_users = [uid for uid in eligible_users if uid in user_ids]
        
        # Apply limit
        if limit:
            eligible_users = eligible_users[:limit]
        
        return eligible_users
        
    except Exception as e:
        print(f"Error fetching user IDs: {e}")
        import traceback
        traceback.print_exc()
        return []


def fetch_user_attendance_records(user_id: str, n_records: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Fetch attendance_state records for a user.
    
    Args:
        user_id: User ID to fetch records for
        n_records: Number of most recent records to fetch (None = fetch all)
        
    Returns:
        List of attendance_state records (oldest to newest)
    """
    try:
        supabase = get_supabase()
        
        # Get attendance_state records (only PRESENT/ABSENT, excluding CANCELLED)
        query = supabase.table("attendance_state") \
            .select("id, user_id, mark, marked_at") \
            .eq("user_id", user_id) \
            .in_("mark", ["PRESENT", "ABSENT"]) \
            .order("marked_at", desc=True)
        
        if n_records:
            query = query.limit(n_records)
        
        response = query.execute()
        
        attendance_records = response.data if response.data else []
        
        if not attendance_records:
            return []
        
        # Build records list (only attendance_state data, no session data needed)
        records = []
        for att_record in attendance_records:
            record = {
                'id': att_record.get('id'),
                'user_id': att_record.get('user_id'),
                'mark': att_record.get('mark'),
                'marked_at': att_record.get('marked_at'),
                'session': None  # Not needed for binary sequence extraction
            }
            records.append(record)
        
        # AttendanceFeature expects records in oldest-first order for chronological slicing.
        # We queried with marked_at desc=True (most recent first), so reverse to oldest-first
        records.reverse()
        
        return records
        
    except Exception as e:
        print(f"Error fetching records for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        return []


def extract_unlabeled_samples(output_path: str, limit: Optional[int] = None,
                             min_sessions: int = 11, user_ids: Optional[List[str]] = None,
                             user_type: Optional[str] = None, balance_distribution: bool = False) -> None:
    """
    Extract sliding window samples from database for attendance forecasting.
    
    For each user with ≥11 attendance records, creates multiple training samples
    using sliding windows: each sample = last 10 days → next day label (0 or 1).
    
    Args:
        output_path: Path to output JSON file
        limit: Maximum number of users to extract (None = no limit)
        min_sessions: Minimum sessions required per user (default: 11 for at least 1 sample)
        user_ids: Optional list of specific user IDs to extract
        user_type: Optional filter by user type ('STUDENT' or 'EMPLOYEE')
        balance_distribution: If True, balance samples to 50/50 PRESENT/ABSENT ratio
    """
    print("=" * 70)
    print("SLIDING WINDOW SAMPLE EXTRACTION FOR ATTENDANCE FORECASTING")
    if user_type:
        print(f"Filtering by user type: {user_type.upper()}")
    print("=" * 70)
    print()
    
    # Get eligible user IDs (need at least min_sessions records)
    print(f"Step 1: Finding users with at least {min_sessions} attendance records...")
    eligible_user_ids = get_user_ids_with_min_sessions(
        min_sessions=min_sessions,
        limit=limit,
        user_ids=user_ids,
        user_type=user_type
    )
    
    if not eligible_user_ids:
        print("❌ No eligible users found")
        return
    
    print(f"✓ Found {len(eligible_user_ids)} eligible users")
    print()
    
    # Extract sliding window samples
    print(f"Step 2: Extracting sliding window samples for {len(eligible_user_ids)} users...")
    samples = []
    skipped = 0
    total_samples = 0
    
    for i, user_id in enumerate(eligible_user_ids, 1):
        if i % 10 == 0:
            print(f"  Processing user {i}/{len(eligible_user_ids)}... (generated {total_samples} samples so far)")
        
        # Fetch all attendance records for this user (need all for sliding windows)
        attendance_records = fetch_user_attendance_records(user_id, n_records=None)
        
        if len(attendance_records) < min_sessions:
            skipped += 1
            continue
        
        # Generate sliding window samples
        # For N records, we can create (N-10) samples
        # Each sample: features = [day_i, day_i+1, ..., day_i+9], target = day_i+10
        num_samples = len(attendance_records) - 10
        
        for window_start in range(num_samples):
            # Get 11 consecutive records (10 for features + 1 for target)
            window_records = attendance_records[window_start:window_start + 11]
            
            # Extract features (first 10 records)
            feature_records = window_records[:10]
            attendance_feature = AttendanceFeature(feature_records, {})
            binary_sequence = attendance_feature.extract_binary_sequence(n_records=10)
            
            if len(binary_sequence) != 10:
                continue
            
            # Extract target (11th record - next day)
            target_record = window_records[10]
            target_value = 1.0 if target_record.get('mark') == 'PRESENT' else 0.0
            
            # Generate unique sample_id: {user_id}_w{window_index}
            sample_id = f"{user_id}_w{window_start}"
            
            # Create sample with target
            sample = {
                "sample_id": sample_id,
                "features": binary_sequence,
                "targets": {
                    "attendance_probability": target_value
                }
            }
            samples.append(sample)
            total_samples += 1
    
    print(f"✓ Extracted {total_samples} sliding window samples from {len(eligible_user_ids) - skipped} users")
    if skipped > 0:
        print(f"  (Skipped {skipped} users with insufficient data)")
    print()
    
    # Balance distribution if requested
    original_sample_count = len(samples)
    present_count = 0
    absent_count = 0
    
    if balance_distribution:
        print("Step 3: Balancing dataset to 50/50 distribution...")
        # Separate samples by target value
        present_samples = [s for s in samples if s["targets"]["attendance_probability"] == 1.0]
        absent_samples = [s for s in samples if s["targets"]["attendance_probability"] == 0.0]
        
        present_count = len(present_samples)
        absent_count = len(absent_samples)
        
        print(f"  Original distribution: {present_count} PRESENT, {absent_count} ABSENT")
        
        if present_count > 0 and absent_count > 0:
            # Find minimum count
            min_count = min(present_count, absent_count)
            
            # Randomly sample from each class
            random.shuffle(present_samples)
            random.shuffle(absent_samples)
            
            balanced_present = present_samples[:min_count]
            balanced_absent = absent_samples[:min_count]
            
            # Combine and shuffle
            samples = balanced_present + balanced_absent
            random.shuffle(samples)
            
            print(f"  Balanced distribution: {min_count} PRESENT, {min_count} ABSENT")
            print(f"  Total balanced samples: {len(samples)}")
        else:
            print(f"  ⚠️  Cannot balance: only one class present (PRESENT: {present_count}, ABSENT: {absent_count})")
            print(f"  Using all {original_sample_count} samples without balancing")
        print()
    else:
        # Count distribution for metadata even if not balancing
        present_count = sum(1 for s in samples if s["targets"]["attendance_probability"] == 1.0)
        absent_count = len(samples) - present_count
    
    # Create output structure
    metadata = {
        "extracted_date": datetime.now(timezone.utc).isoformat(),
        "description": "Sliding window samples for attendance forecasting - 10 days → next day",
        "num_samples": len(samples),
        "original_num_samples": original_sample_count if balance_distribution else len(samples),
        "features_per_sample": 10,
        "feature_description": "10-day attendance marks (binary sequence, most recent to oldest)",
        "target_description": "Next day attendance (1.0 = PRESENT, 0.0 = ABSENT)",
        "sample_id_format": "{user_id}_w{window_index}",
        "sliding_window": True,
        "min_sessions_required": min_sessions,
        "user_type": user_type.upper() if user_type else None,
        "balanced": balance_distribution,
        "distribution": {
            "present_count": present_count if not balance_distribution else min(present_count, absent_count),
            "absent_count": absent_count if not balance_distribution else min(present_count, absent_count),
            "original_present_count": present_count if balance_distribution else None,
            "original_absent_count": absent_count if balance_distribution else None,
        },
        "version": "3.1"
    }
    
    output_data = {
        "metadata": metadata,
        "samples": samples
    }
    
    # Save to file
    step_number = 4 if balance_distribution else 3
    print(f"Step {step_number}: Saving to {output_path}...")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved {len(samples)} samples to {output_path}")
    print()
    print("=" * 70)
    print("✓ EXTRACTION COMPLETE!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("  1. Review the extracted samples in the JSON file")
    print("  2. Samples are already labeled with attendance_probability (0 or 1)")
    print("  3. Train forecasting model: python ml/train_forecast.py --user-type <TYPE> --data <path>")
    print("=" * 70)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Extract unlabeled samples from database for manual labeling'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='ml/data/unlabeled_samples.json',
        help='Path to output JSON file (default: ml/data/unlabeled_samples.json)'
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=None,
        help='Maximum number of users to extract (default: no limit)'
    )
    parser.add_argument(
        '--min-sessions',
        type=int,
        default=11,
        help='Minimum sessions required per user (default: 11 for sliding windows)'
    )
    parser.add_argument(
        '--user-ids',
        type=str,
        default=None,
        help='Comma-separated list of specific user IDs to extract (optional)'
    )
    parser.add_argument(
        '--user-type',
        type=str,
        choices=['STUDENT', 'EMPLOYEE'],
        default=None,
        help='Filter by user type: STUDENT or EMPLOYEE (optional)'
    )
    parser.add_argument(
        '--balance-distribution',
        action='store_true',
        help='Balance dataset to 50/50 PRESENT/ABSENT ratio'
    )
    
    args = parser.parse_args()
    
    # Parse user_ids if provided
    user_ids_list = None
    if args.user_ids:
        user_ids_list = [uid.strip() for uid in args.user_ids.split(',')]
    
    extract_unlabeled_samples(
        output_path=args.output,
        limit=args.limit,
        min_sessions=args.min_sessions,
        user_ids=user_ids_list,
        user_type=args.user_type,
        balance_distribution=args.balance_distribution
    )

