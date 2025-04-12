from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

1. `checkpoints` should contain 3–5 important timestamps where a learner should be tested.
   For each checkpoint:
   - Add `time`: the timestamp in seconds from the corresponding segment.
   - Add `question`: a multiple-choice question related to the section.
   - Add `choices`: list of 4 options.
   - Add `answer`: correct choice letter (A/B/C/D).
   - Add `explanation`: why that answer is correct.

2. `final` should contain:
   - `summary`: a paragraph summarizing the whole content.
   - `review_questions`: 3 short open-ended review questions.

Return only a valid JSON.

Transcript:
{transcript_text}

Segments:
{segments}
        """
    }

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful educational assistant that only returns JSON."},
            prompt
        ]
    )

    return response.choices[0].message.content
