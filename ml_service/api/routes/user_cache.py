import os
from fastapi import APIRouter, HTTPException, Header
from services.user_listener import refresh_user_list

router = APIRouter()

@router.post("/update-user-cache")
async def update_user_cache(x_service_password: str = Header(None)):
    """
    Endpoint to programmatically refresh the user cache.
    Replaces the unreliable realtime listener.
    """
    # Verify Connection
    SERVICE_PASSWORD = os.getenv("SERVICE_PASSWORD")
    if x_service_password != SERVICE_PASSWORD:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED: Invalid credentials.")
    
    try:
        await refresh_user_list()
        return {"success": True, "message": "User cache updated successfully"}
    except Exception as e:
        print(f"Error updating user cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update user cache: {str(e)}")


