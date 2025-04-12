import uuid

import firebase_admin
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials, firestore
from pydantic import BaseModel
from utils.openai import generate_ai_questions_and_summary, stt
from utils.youtube_utils import download_audio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://hermex-gamma.vercel.app/"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Init Firebase
cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)
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

@app.post("/api/preprocess")
def preprocess_video(data: PreprocessRequest):
    try:
        session_id = str(uuid.uuid4())
        
        audio_file = download_audio(data.youtube_link, session_id)

        transcript_verbose = stt(audio_file)
        transcript_text = transcript_verbose.text.strip()
        transcript_segments = clean_transcript_segments(transcript_verbose.segments)

        ai_response = generate_ai_questions_and_summary(transcript_text, transcript_segments)

        doc_ref = db.collection("sessions").document(session_id)
        doc_ref.set({
            "transcript": transcript_text,
            "segments": transcript_segments,
            "checkpoints": [cp.model_dump() for cp in ai_response.checkpoints],
            "summary": ai_response.final.summary,
            "review_questions": ai_response.final.review_questions,
        })

        checkpoint_times = sorted([cp.time for cp in ai_response.checkpoints])
        last_segment_end = transcript_segments[-1]["end"] if transcript_segments else 0
        checkpoint_times.append(last_segment_end)

        checkpoints_context = []
        for i in range(len(checkpoint_times) - 1):
            start_time = 0 if i == 0 else checkpoint_times[i - 1]
            end_time = checkpoint_times[i]

            context = " ".join([
                segment["text"]
                for segment in transcript_segments
                if start_time <= segment["start"] < end_time
            ])
            checkpoints_context.append(context.strip())


        return {
            "session_id": session_id,
            "transcript": transcript_text,
            "contex": checkpoints_context,
            "checkpoints": ai_response.checkpoints,
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