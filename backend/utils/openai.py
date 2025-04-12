from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

from pydantic import BaseModel, Field
from typing import List


class Checkpoint(BaseModel):
    time: float
    question: str
    choices: List[str]
    answer: str
    explanation: str


class FinalReview(BaseModel):
    summary: str
    review_questions: List[str]


class TranscriptCheckpoints(BaseModel):
    checkpoints: List[Checkpoint] 
    final: FinalReview


def stt(audio_path: str):
    print("Starting STT...")
    audio_file = open(audio_path, "rb")
    transcript = client.audio.transcriptions.create(
    file=audio_file,
    model="whisper-1",
    response_format="verbose_json",
    timestamp_granularities=["segment"]
    )
    
    return transcript

def generate_ai_questions_and_summary(transcript_text: str, segments: list):
    prompt = {
        "role": "user",
        "content": f"""
You are an educational assistant.
You will be given a transcript and a list of timestamped segments.
Your goal is to return a JSON with two keys: `checkpoints` and `final`.

1. `checkpoints` should contain 5-9 important timestamps where a learner should be tested.
   For each checkpoint:
   - Add `time`: the timestamp in seconds from the corresponding segment.
   - Add `question`: a multiple choice quesiton or open-ended question, make sure to balance their numbers and include the question type in square brackets at the start: [MCQ] or [OpenEnded]
   - Add `choices`: list of 4 options in case of [MCQ], or 0 for [OpenEnded].
   - Add `answer`: correct choice letter (A/B/C/D) for MCQ and correct answer for open ended.
   - Add `explanation`: why that answer is correct.
   - The check points should be evenly distributed across the transcript.

2. `final` should contain:
   - `summary`: a paragraph summarizing the whole content.
   - `review_questions`: a mix of MCQ and Open-ended.

Return only a valid JSON.

Transcript:
{transcript_text}

Segments:
{segments}
        """
    }

    completion = client.beta.chat.completions.parse(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful educational assistant that only returns JSON."},
            prompt
        ],
        response_format=TranscriptCheckpoints,
    )

    return completion.choices[0].message.parsed
