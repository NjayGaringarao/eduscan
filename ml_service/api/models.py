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
