"""
Model API Route
Handles model training and training summary retrieval.
"""

import os
import json
import base64
import tempfile
from fastapi import APIRouter, Header, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel
from typing import Literal, Dict, List, Optional
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.train_forecast import train_forecast_model

router = APIRouter()


class TrainModelRequest(BaseModel):
    user_type: Literal["STUDENT", "EMPLOYEE"]


class TrainModelResponse(BaseModel):
    success: bool
    message: str


class TrainingSummaryResponse(BaseModel):
    success: bool
    metadata: Dict
    images: Dict[str, str]  # Base64-encoded images


@router.post("/model/train", response_model=TrainModelResponse)
async def train_model(
    user_type: str = Form(...),
    dataset_file: Optional[UploadFile] = File(None),
    x_service_password: str = Header(None, alias="X-Service-Password")
):
    """
    Train attendance forecasting model by running train_forecast.py.
    Accepts either an uploaded dataset file or uses the existing generated dataset.
    
    Args:
        user_type: User type (STUDENT or EMPLOYEE)
        dataset_file: Optional uploaded dataset JSON file
        x_service_password: Service authentication password
        
    Returns:
        TrainModelResponse with training status
    """
    # Verify authentication
    SERVICE_PASSWORD = os.getenv("SERVICE_PASSWORD")
    if x_service_password != SERVICE_PASSWORD:
        raise HTTPException(
            status_code=401,
            detail="UNAUTHORIZED: Invalid credentials."
        )
    
    # Validate user_type
    if user_type not in ["STUDENT", "EMPLOYEE"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid user_type. Must be STUDENT or EMPLOYEE."
        )
    
    temp_file_path = None
    try:
        user_type_suffix = "s" if user_type == "STUDENT" else "e"
        
        # If dataset file is uploaded, save it temporarily
        if dataset_file:
            # Validate file type
            if not dataset_file.filename.endswith('.json'):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file type. Please upload a JSON file."
                )
            
            # Read file content
            file_content = await dataset_file.read()
            
            # Validate JSON
            try:
                json.loads(file_content.decode('utf-8'))
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid JSON file. Please upload a valid JSON dataset."
                )
            
            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.json',
                delete=False,
                dir='ml/data'
            )
            temp_file.write(file_content.decode('utf-8'))
            temp_file.close()
            temp_file_path = temp_file.name
            
            data_file = temp_file_path
        else:
            # Use existing generated dataset
            data_file = f"ml/data/training_data_{user_type_suffix}.json"
            
            # Check if dataset exists
            if not os.path.exists(data_file):
                raise HTTPException(
                    status_code=404,
                    detail=f"Training dataset not found for {user_type}. Please generate it first or upload a dataset file."
                )
        
        # Run training programmatically
        train_forecast_model(data_file, user_type)
        
        return TrainModelResponse(
            success=True,
            message=f"Model training completed successfully for {user_type}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error training model: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error training model: {str(e)}"
        )
    finally:
        # Clean up temporary file if created
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                print(f"Warning: Failed to delete temporary file {temp_file_path}: {e}")


@router.get("/model/training-summary", response_model=TrainingSummaryResponse)
async def get_training_summary(
    user_type: Literal["STUDENT", "EMPLOYEE"] = Query(...),
    x_service_password: str = Header(None, alias="X-Service-Password")
):
    """
    Get training summary including metadata and evaluation plots.
    
    Args:
        user_type: User type (STUDENT or EMPLOYEE)
        x_service_password: Service authentication password
        
    Returns:
        TrainingSummaryResponse with metadata and base64-encoded images
    """
    # Verify authentication
    SERVICE_PASSWORD = os.getenv("SERVICE_PASSWORD")
    if x_service_password != SERVICE_PASSWORD:
        raise HTTPException(
            status_code=401,
            detail="UNAUTHORIZED: Invalid credentials."
        )
    
    try:
        user_type_lower = user_type.lower()
        models_dir = "ml/models/trained"
        metadata_path = os.path.join(models_dir, "training_metadata.json")
        
        # Check if metadata exists
        if not os.path.exists(metadata_path):
            raise HTTPException(
                status_code=404,
                detail=f"Training summary not found for {user_type}. Model may not be trained yet."
            )
        
        # Load metadata
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        # Verify metadata is for the requested user type
        if metadata.get('user_type') != user_type.upper():
            raise HTTPException(
                status_code=404,
                detail=f"Training summary not found for {user_type}. Model may not be trained yet."
            )
        
        # Load and encode evaluation plot images
        image_files = {
            "scatter": f"attendance_forecast_{user_type_lower}_scatter.png",
            "residuals": f"attendance_forecast_{user_type_lower}_residuals.png",
            "feature_importance": f"attendance_forecast_{user_type_lower}_fi.png",
            "learning_curves": f"attendance_forecast_{user_type_lower}_learning_curves.png",
            "distribution": f"attendance_forecast_{user_type_lower}_distribution.png",
            "confusion_matrix": f"attendance_forecast_{user_type_lower}_confusion_matrix.png",
            "roc_curve": f"attendance_forecast_{user_type_lower}_roc_curve.png"
        }
        
        images = {}
        for key, filename in image_files.items():
            image_path = os.path.join(models_dir, filename)
            if os.path.exists(image_path):
                with open(image_path, 'rb') as img_file:
                    img_data = img_file.read()
                    img_base64 = base64.b64encode(img_data).decode('utf-8')
                    images[key] = img_base64
            else:
                # If image doesn't exist, set to empty string
                images[key] = ""
        
        return TrainingSummaryResponse(
            success=True,
            metadata=metadata,
            images=images
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting training summary: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error getting training summary: {str(e)}"
        )

