from typing import Union

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi import Body
from fastapi.middleware.cors import CORSMiddleware

import uuid

from utils.youtube_utils import download_audio
from utils.stt import stt

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


@app.post("/api/preprocess")
def preprocess_video(data: PreprocessRequest):
    session_id = str(uuid.uuid4())
    
    audio_file = download_audio(data.youtube_link, session_id)
    transcript = stt(audio_file)

    return {
        "status": "downloaded",
        "session_id": session_id,
        "audio_file": audio_file,
        "transcript": transcript,
    }
    