import os
from fastapi import APIRouter, Header, UploadFile, File
import numpy as np
from api.models import FaceEncodingResponse, User
import face_recognition

from utils.user_cache import get_cached_users

router = APIRouter()

async def get_face_matched(users: list[User], encodings: list[list[float]]):
    known_encodings = [p.facial_encoding for p in users if p.facial_encoding]
    distances = face_recognition.face_distance(known_encodings, encodings[0])
    min_distance = np.min(distances)
    best_match_index = np.argmin(distances)
    return min_distance, best_match_index

@router.post("/face-encoding", response_model=FaceEncodingResponse)
async def face_encoding(image: UploadFile = File(...), x_service_password: str = Header(None)):

    # Verify Connection
    SERVICE_PASSWORD = os.getenv("SERVICE_PASSWORD")
    if x_service_password != SERVICE_PASSWORD:
        return FaceEncodingResponse(encoding=None, error="UNAUTHORIZED: Invalid credentials.", user_id=None)

    img = face_recognition.load_image_file(image.file)
    face_locations = face_recognition.face_locations(img)
    encodings = face_recognition.face_encodings(img, face_locations)
    users = get_cached_users()

    if not encodings:
        return FaceEncodingResponse(encoding=None, error="ENCODING FAILED: No face found.", user_id=None)

    if len(encodings) != 1:
        return FaceEncodingResponse(encoding=None, error="ENCODING FAILED: Multiple faces found.", user_id=None)

    if users:
        min_distance, best_match_index = await get_face_matched(users, encodings)
        if min_distance < 0.4:
            return FaceEncodingResponse(encoding=None, error="ENCODING FAILED: Registered User found", user_id=users[best_match_index].id)

    # No matching user or no users at all
    return FaceEncodingResponse(encoding=encodings[0].tolist(), error=None, user_id=None)
