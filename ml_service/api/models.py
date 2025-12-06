from pydantic import BaseModel
import datetime


class User(BaseModel):
    id: str
    facial_encoding: list[float] | None = None
    
class FaceMatchResponse(BaseModel):
    error: str | None = None
    user_id: str | None = None
    is_spoof: bool | None = None

class FaceEncodingResponse(BaseModel):
    encoding: list[float] | None = None
    error: str | None = None
    user_id: str | None = None

class PingResponse(BaseModel):
    message: str | None = None

# Performance Analytics Models
class AveragePunctuality(BaseModel):
    value: float | None
    label: str
    trend: str

class AverageTimeBalance(BaseModel):
    value: float | None
    label: str
    trend: str

class AttendanceForecast(BaseModel):
    probability: float | None  # 0-1
    confidence: float | None
    factors: list[str]

class AttendanceRate(BaseModel):
    rate: float | None
    label: str
    present: int | None
    absent: int | None
    total: int | None

class PerformanceMetrics(BaseModel):
    averagePunctuality: AveragePunctuality
    averageTimeBalance: AverageTimeBalance
    attendanceForecast: AttendanceForecast
    attendanceRate: AttendanceRate
    lastUpdated: str
    dataPoints: int | None

class PerformanceAnalyticsResponse(BaseModel):
    success: bool
    data: PerformanceMetrics | None = None
    error: str | None = None