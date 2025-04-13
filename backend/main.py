import json
import os
from hashlib import sha256

import firebase_admin
import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials, firestore
from pydantic import BaseModel
from utils.openai import generate_ai_questions_and_summary, stt
from utils.youtube_utils import download_audio

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://hermex-gamma.vercel.app", "https://hermex-frontend.vercel.app/", "https://hermex-frontend-git-main-ahmed-ibrahims-projects-a63cd30b.vercel.app/", "https://hermex-frontend-ahmed-ibrahims-projects-a63cd30b.vercel.app/"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Init Firebase
if os.getenv("ENV") == "local":
    cred = credentials.Certificate("firebase_credentials.json")
    firebase_admin.initialize_app(cred)

else:
    firebase_admin.initialize_app()
db = firestore.client()


def clean_transcript_segments(segments: list) -> list[dict]:
    return [
        {
            "start": round(segment.start, 2),
            "end": round(segment.end, 2),
            "text": segment.text.strip()
        }
        for segment in segments
    ]

class PreprocessRequest(BaseModel):
    youtube_link: str

class QuestionRequest(BaseModel):
    question: str

@app.get("/api/ping")
def ping():
    return {"status": "ok"}

@app.post("/api/preprocess")
def preprocess_video(data: PreprocessRequest):
    try:
        video_id = sha256(data.youtube_link.encode("utf-8")).hexdigest()

        cached_doc = db.collection("sessions").document(video_id).get()
        if cached_doc.exists:
            cached_data = cached_doc.to_dict()
            cached_data["session_id"] = video_id
            return cached_data

        audio_file = download_audio(data.youtube_link, video_id)
        transcript_verbose = stt(audio_file)
        transcript_text = transcript_verbose.text.strip()
        transcript_segments = clean_transcript_segments(transcript_verbose.segments)

        ai_response = generate_ai_questions_and_summary(transcript_text, transcript_segments)
        checkpoints = [cp.model_dump() for cp in ai_response.checkpoints]

        checkpoint_times = sorted([cp["time"] for cp in checkpoints])
        last_segment_end = transcript_segments[-1]["end"] if transcript_segments else 0
        checkpoint_times.append(last_segment_end)

        checkpoints_context = []
        for i in range(len(checkpoint_times) - 1):
            start_time = 0 if i == 0 else checkpoint_times[i]
            end_time = checkpoint_times[i + 1]

            context = " ".join([
                segment["text"]
                for segment in transcript_segments
                if start_time <= segment["start"] < end_time
            ])
            checkpoints_context.append(context.strip())

        for idx, checkpoint in enumerate(checkpoints):
            checkpoint["segment"] = checkpoints_context[idx]

        # Cache the result using video hash as ID
        db.collection("sessions").document(video_id).set({
            "transcript": transcript_text,
            "segments": transcript_segments,
            "checkpoints": checkpoints,
            "summary": ai_response.final.summary,
            "review_questions": ai_response.final.review_questions,
        })

        return {
            "session_id": video_id,
            "transcript": transcript_text,
            "checkpoints": checkpoints,
            "summary": ai_response.final.summary,
            "review_questions": ai_response.final.review_questions,
        }

    except Exception as e:
        return {"error": str(e)}


@app.get("/api/transcript/{session_id}/{start_time}/{end_time}")
def get_transcript(session_id: str, start_time: float, end_time: float):
    doc = db.collection("sessions").document(session_id).get()
    if not doc.exists:
        return {"error": "Session not found"}
    
    data = doc.to_dict()
    segments = data["segments"]
    transcript_snippet = ""

    for segment in segments:
        start, end, text = segment["start"], segment["end"], segment["text"]
        if start >= start_time and end <= end_time:
            transcript_snippet += text + " "

    return {
        "transcript": transcript_snippet.strip(),
    }

@app.post("/api/session-token")
def get_openai_client_secret(payload: dict):
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    print(OPENAI_API_KEY)
    if not OPENAI_API_KEY:
        return {"error": "Missing OpenAI API key"}

    try:
        response = requests.post(
            "https://api.openai.com/v1/realtime/sessions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json=payload
        )

        response.raise_for_status()
        data = response.json()
        return {"client_secret": data["client_secret"]}

    except Exception as e:
        return {"error": str(e)}