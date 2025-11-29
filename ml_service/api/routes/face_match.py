import os
from fastapi import APIRouter, HTTPException, Header, UploadFile, File
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from api.models import FaceMatchResponse
from deepface import DeepFace
from utils.user_cache import get_cached_users
import face_recognition
import numpy as np
import io
from PIL import Image


router = APIRouter()

@router.post("/face-match", response_model=FaceMatchResponse)
async def face_match(image: UploadFile = File(...), x_service_password: str = Header(None)):
    
    MATCH_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", 0.8))
    
    # Verify Connection and input
    SERVICE_PASSWORD = os.getenv("SERVICE_PASSWORD")
    if x_service_password != SERVICE_PASSWORD:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED: Invalid credentials.")
    
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    # initialize image
    image_bytes = await image.read()
    print("Received image size:", len(image_bytes))

    
    # Verify autheticity
    VERIFY_AUTHENTICITY = os.getenv("VERIFY_AUTHENTICITY")
    if VERIFY_AUTHENTICITY == "True":
        np_image = np.array(Image.open(io.BytesIO(image_bytes)).convert("RGB"))
        try:
            analysis = DeepFace.extract_faces(np_image, anti_spoofing=True)
            if not analysis or not analysis[0].get("is_real", False):
                return FaceMatchResponse(is_spoof=True)
        except Exception as e:
            return FaceMatchResponse( error="Facial features not clear with an error:{e} . Please try again.")
        
    
    # Do face matching process
    
    try:
        img = face_recognition.load_image_file(io.BytesIO(image_bytes))
        face_locations = face_recognition.face_locations(img)
        encodings = face_recognition.face_encodings(img, face_locations)
    except Exception as e:
        return FaceMatchResponse( error=f"Facial features not clear with an error:{str(e)} . Please try again.")


    if len(encodings) < 1:
        return FaceMatchResponse( error="Facial features not clear. Please try again.")
    
    if len(encodings) > 1:
        return FaceMatchResponse( error="Multiple faces is captured in a single request. Please try again.")

    users = get_cached_users()
    if not users:
        return FaceMatchResponse( error="No registered User. Please coordinate to administrator.")

    known_encodings = [p.facial_encoding for p in users if p.facial_encoding]
    
    distances = face_recognition.face_distance(known_encodings, encodings[0])
    min_distance = np.min(distances)
    best_match_index = np.argmin(distances)

    print("Minimum Distance: ", min_distance)
    print("Best Match Index: ",best_match_index)
    print("Is Face Recognized: ", min_distance < MATCH_THRESHOLD)
    
    if min_distance < MATCH_THRESHOLD:
        return FaceMatchResponse(
            user_id=users[best_match_index].id,
        )

    return FaceMatchResponse()
