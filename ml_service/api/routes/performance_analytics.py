"""
Performance Analytics API Route
Provides ML-powered performance analytics for users.
"""

import os
from typing import List
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from ml.analytics import get_analytics

router = APIRouter()


class UserPerformanceRecord(BaseModel):
    user_id: str
    user_type: str
    average_punctuality_value: float | None
    average_time_balance_value: float | None
    attendance_rate_value: float | None
    attendance_forecast_probability: float | None
    attendance_forecast_confidence: float | None
    attendance_rate_present: int | None 
    attendance_rate_absent: int | None
    attendance_rate_total: int | None 
    attendance_forecast_factors: list[str] 
    data_points: int | None 


class AggregateMetricsRequest(BaseModel):
    user_ids: List[str]
    user_type: str = "ALL"


class AggregateMetrics(BaseModel):
    user_type: str
    average_punctuality: float | None
    average_time_balance: float | None
    attendance_rate: float | None
    average_forecast_probability: float | None
    total_users: int
    at_risk_count: int
    not_at_risk_count: int
    user_records: List[UserPerformanceRecord]


@router.post("/performance-analytics/aggregate", response_model=AggregateMetrics)
async def get_aggregate_performance_analytics(
    request: AggregateMetricsRequest,
    x_service_password: str = Header(None)
):
    """
    Get aggregate ML-powered performance analytics for multiple users.
    
    Args:
        request: AggregateMetricsRequest with user_ids and user_type
        x_service_password: Service authentication password
        
    Returns:
        AggregateMetrics with aggregated performance indicators
    """
    # Verify authentication
    SERVICE_PASSWORD = os.getenv("SERVICE_PASSWORD")
    if x_service_password != SERVICE_PASSWORD:
        raise HTTPException(
            status_code=401,
            detail="UNAUTHORIZED: Invalid credentials."
        )
    
    try:
        # Get analytics instance
        analytics = get_analytics()
        
        # Compute aggregate metrics
        aggregate = await analytics.compute_aggregate_metrics(request.user_ids, request.user_type)
        
        # Convert user records to Pydantic models
        user_records = [
            UserPerformanceRecord(**record)
            for record in aggregate.get('user_records', [])
        ]
        
        return AggregateMetrics(
            user_type=aggregate['user_type'],
            average_punctuality=aggregate['average_punctuality'],
            average_time_balance=aggregate['average_time_balance'],
            attendance_rate=aggregate['attendance_rate'],
            average_forecast_probability=aggregate.get('average_forecast_probability'),
            total_users=aggregate['total_users'],
            at_risk_count=aggregate['at_risk_count'],
            not_at_risk_count=aggregate['not_at_risk_count'],
            user_records=user_records
        )
        
    except Exception as e:
        print(f"Error in aggregate performance analytics endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error computing aggregate performance metrics: {str(e)}"
        )


