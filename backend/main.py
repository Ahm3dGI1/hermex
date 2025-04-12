from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

import uuid

from utils.youtube_utils import download_audio

from utils.openai import stt
from utils.openai import generate_ai_questions_and_summary

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://hermex-gamma.vercel.app/"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_transcript_segments(segments: list) -> list[dict]:
    return [
        {
            "start": round(segment.start, 2),
            "end": round(segment.end, 2),
            "text": segment.text.strip()
        }
        for segment in segments
    ]

session_data = {}

class PreprocessRequest(BaseModel):
    youtube_link: str

class QuestionRequest(BaseModel):
    question: str

@app.post("/api/preprocess")
def preprocess_video(data: PreprocessRequest):
    session_id = str(uuid.uuid4())
    
    audio_file = download_audio(data.youtube_link, session_id)

    transcript_verbose = stt(audio_file)
    transcript_text = transcript_verbose.text.strip()
    transcript_segments = clean_transcript_segments(transcript_verbose.segments)

    ai_response = generate_ai_questions_and_summary(transcript_text, transcript_segments)

    session_data[session_id] = {
        "transcript": transcript_text,
        "segments": transcript_segments,
        "checkpoints": ai_response.checkpoints,
        "summary": ai_response.final.summary,
        "review_questions": ai_response.final.review_questions,
    }

    return session_data[session_id]


@app.get("/api/transcript/{session_id}")
def get_transcript(session_id: str):
    if session_id in session_data:
        return session_data[session_id]
    else:
        return {"error": "Session not found"}

@app.post("/api/realtime_conversation")
def realtime_conversation(data: QuestionRequest):
    return {"response": f"You asked: {data.question}"}
