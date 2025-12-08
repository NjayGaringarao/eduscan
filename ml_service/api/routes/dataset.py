"""
Dataset API Route
Handles dataset generation and download for attendance forecasting training.
"""

import os
import json
from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Literal
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.extract_samples import extract_unlabeled_samples

router = APIRouter()


class GenerateDatasetRequest(BaseModel):
    user_type: Literal["STUDENT", "EMPLOYEE"]
    balance_distribution: bool = False


class GenerateDatasetResponse(BaseModel):
    success: bool
    file_path: str
    metadata: dict


@router.post("/dataset/generate", response_model=GenerateDatasetResponse)
async def generate_dataset(
    request: GenerateDatasetRequest,
    x_service_password: str = Header(None, alias="X-Service-Password")
):
    """
    Generate training dataset on-demand by running extract_samples.py.
    
    Args:
        request: GenerateDatasetRequest with user_type
        x_service_password: Service authentication password
        
    Returns:
        GenerateDatasetResponse with file path and metadata
    """
    # Verify authentication
    SERVICE_PASSWORD = os.getenv("SERVICE_PASSWORD")
    if x_service_password != SERVICE_PASSWORD:
        raise HTTPException(
            status_code=401,
            detail="UNAUTHORIZED: Invalid credentials."
        )
    
    try:
        user_type = request.user_type
        user_type_suffix = "s" if user_type == "STUDENT" else "e"
        output_path = f"ml/data/training_data_{user_type_suffix}.json"
        
        # Ensure data directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Run extraction programmatically
        extract_unlabeled_samples(
            output_path=output_path,
            limit=None,
            min_sessions=11,
            user_ids=None,
            user_type=user_type,
            balance_distribution=request.balance_distribution
        )
        
        # Load metadata from generated file
        with open(output_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            metadata = data.get('metadata', {})
        
        return GenerateDatasetResponse(
            success=True,
            file_path=output_path,
            metadata=metadata
        )
        
    except Exception as e:
        print(f"Error generating dataset: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error generating dataset: {str(e)}"
        )


@router.get("/dataset/download")
async def download_dataset(
    user_type: Literal["STUDENT", "EMPLOYEE"] = Query(...),
    x_service_password: str = Header(None, alias="X-Service-Password")
):
    """
    Download generated training dataset as JSON file.
    
    Args:
        user_type: User type (STUDENT or EMPLOYEE)
        x_service_password: Service authentication password
        
    Returns:
        JSON file download
    """
    # Verify authentication
    SERVICE_PASSWORD = os.getenv("SERVICE_PASSWORD")
    if x_service_password != SERVICE_PASSWORD:
        raise HTTPException(
            status_code=401,
            detail="UNAUTHORIZED: Invalid credentials."
        )
    
    try:
        user_type_suffix = "s" if user_type == "STUDENT" else "e"
        file_path = f"ml/data/training_data_{user_type_suffix}.json"
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail=f"Dataset not found for {user_type}. Please generate it first."
            )
        
        filename = f"training_data_{user_type_suffix}.json"
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/json"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error downloading dataset: {str(e)}"
        )

