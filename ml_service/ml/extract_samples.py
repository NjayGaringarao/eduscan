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


def fetch_user_attendance_records(user_id: str, n_records: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch attendance_state records for a user, joined with session data.
    
    Args:
        user_id: User ID to fetch records for
        n_records: Number of most recent records to fetch
        
    Returns:
        List of attendance_state records with joined session data
    """
    try:
        supabase = get_supabase()
        
        # First, get attendance_state records
        response = supabase.table("attendance_state") \
            .select("id, user_id, mark, marked_at, session_id") \
            .eq("user_id", user_id) \
            .in_("mark", ["PRESENT", "ABSENT"]) \
            .order("marked_at", desc=True) \
            .limit(n_records) \
            .execute()
        
        attendance_records = response.data if response.data else []
        
        if not attendance_records:
            return []
        
        # Get session IDs that exist
        session_ids = [r.get('session_id') for r in attendance_records if r.get('session_id')]
        
        # Fetch session data if we have session IDs
        sessions_map = {}
        if session_ids:
            try:
                session_response = supabase.table("session") \
                    .select("id, punctuality, time_balance") \
                    .in_("id", session_ids) \
                    .execute()
                
                session_data = session_response.data if session_response.data else []
                sessions_map = {s.get('id'): s for s in session_data}
            except Exception as e:
                print(f"  ⚠ Warning: Could not fetch session data: {e}")
        
        # Merge attendance_state with session data
        records = []
        for att_record in attendance_records:
            session_id = att_record.get('session_id')
            session_data = sessions_map.get(session_id) if session_id else None
            
            record = {
                'id': att_record.get('id'),
                'user_id': att_record.get('user_id'),
                'mark': att_record.get('mark'),
                'marked_at': att_record.get('marked_at'),
                'session': session_data if session_data else None
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
                             min_sessions: int = 10, user_ids: Optional[List[str]] = None,
                             user_type: Optional[str] = None) -> None:
    """
    Extract unlabeled samples from database and save to JSON file.
    
    Args:
        output_path: Path to output JSON file
        limit: Maximum number of users to extract (None = no limit)
        min_sessions: Minimum sessions required per user
        user_ids: Optional list of specific user IDs to extract
        user_type: Optional filter by user type ('STUDENT' or 'EMPLOYEE')
    """
    print("=" * 70)
    print("UNLABELED SAMPLE EXTRACTION")
    if user_type:
        print(f"Filtering by user type: {user_type.upper()}")
    print("=" * 70)
    print()
    
    # Get eligible user IDs
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
    
    # Extract samples
    print(f"Step 2: Extracting samples for {len(eligible_user_ids)} users...")
    samples = []
    skipped = 0
    
    for i, user_id in enumerate(eligible_user_ids, 1):
        if i % 10 == 0:
            print(f"  Processing user {i}/{len(eligible_user_ids)}...")
        
        # Fetch attendance records
        attendance_records = fetch_user_attendance_records(user_id, n_records=10)
        
        if len(attendance_records) < min_sessions:
            skipped += 1
            continue
        
        # Extract binary features using AttendanceFeature
        attendance_feature = AttendanceFeature(attendance_records, {})
        binary_sequence = attendance_feature.extract_binary_sequence(n_records=10)
        
        if len(binary_sequence) != 10:
            print(f"  ⚠ Warning: User {user_id} has {len(binary_sequence)} binary marks (expected 10), skipping")
            skipped += 1
            continue
        
        # Create sample (without targets, without user_type)
        sample = {
            "user_id": user_id,
            "features": binary_sequence
        }
        samples.append(sample)
    
    print(f"✓ Extracted {len(samples)} samples")
    if skipped > 0:
        print(f"  (Skipped {skipped} users with insufficient data)")
    print()
    
    # Create output structure
    metadata = {
        "extracted_date": datetime.now(timezone.utc).isoformat(),
        "description": "Unlabeled samples extracted from database - requires manual labeling",
        "num_samples": len(samples),
        "features_per_sample": 10,
        "feature_description": "10-day attendance marks (binary sequence only)",
        "session_ordering": "Most recent to oldest",
        "min_sessions_required": min_sessions,
        "user_type": user_type.upper() if user_type else None,
        "version": "2.0"
    }
    
    output_data = {
        "metadata": metadata,
        "samples": samples
    }
    
    # Save to file
    print(f"Step 3: Saving to {output_path}...")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved {len(samples)} unlabeled samples to {output_path}")
    print()
    print("=" * 70)
    print("✓ EXTRACTION COMPLETE!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("  1. Review the extracted samples in the JSON file")
    print("  2. Manually label each sample with dropout_risk (AT_RISK / NOT_AT_RISK)")
    print("  3. Add 'targets' field to each sample:")
    print("     {\"dropout_risk\": \"AT_RISK|NOT_AT_RISK\"}")
    print("  4. Use labeled file to train models: python ml/train_classifier.py --data <path>")
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
        default=10,
        help='Minimum sessions required per user (default: 10)'
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
        user_type=args.user_type
    )

