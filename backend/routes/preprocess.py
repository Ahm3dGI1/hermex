from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
import uuid

router = APIRouter()

class PreprocessInput(BaseModel):
    youtube_link: str

@router.post("/")
def preprocess_video(data: PreprocessInput, background_tasks: BackgroundTasks):
    session_id = str(uuid.uuid4())

    return {
        "status": "started",
        "session_id": session_id,
        "message": "Preprocessing started. Please wait..."
    }
