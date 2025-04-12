from typing import Union

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi import Body
from fastapi.middleware.cors import CORSMiddleware
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://hermex-gamma.vercel.app/"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PreprocessRequest(BaseModel):
    youtube_link: str

@app.get("/api")



@app.post("/api/preprocess")
def preprocess_video(data: PreprocessRequest):
    session_id = str(uuid.uuid4())
    return {
        "status": "started",
        "session_id": session_id,
        "message": f"Started processing {data.youtube_link}"
    }
