# Hermex: Interactive Educational Assistant

## Overview

Hermex is an educational assistant designed to improve learning experiences using AI-generated content and interactive tools. The application processes YouTube videos to generate transcripts, summaries, checkpoints, and quizzes, enabling educators to create engaging lessons.

## Features

- **AI-Powered Video Preprocessing**: Extracts transcripts, summaries, and checkpoints from YouTube videos using OpenAI's Whisper and GPT models.
- **Interactive Frontend**: Provides tools for real-time quizzes and explanations during video playback.

---

## Directory Structure

```
├── backend
│   ├── utils
│   │   ├── __init__.py
│   │   ├── openai.py
│   │   └── youtube_utils.py
│   ├── main.py
│   └── requirements.txt
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── whiteboard-elements
│   │   │   │   ├── Explanation.tsx
│   │   │   │   └── MultipleChoice.tsx
│   │   │   ├── RealtimeTest.tsx
│   │   │   └── Types.tsx
│   │   ├── hooks
│   │   │   └── youtube-player.tsx
│   │   ├── types
│   │   │   └── youtube.d.ts
│   │   ├── utils
│   │   │   └── youtube.tsx
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
└── .gitignore
```

---

## Backend Setup

### Prerequisites

- Python 3.9+
- Firebase credentials (`firebase_credentials.json`)
- OpenAI API key stored in `.env` file.

### Installation

1. Navigate to the `backend` directory:
    ```bash
    cd backend/
    ```

2. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3. Create a `.env` file with your OpenAI API key:
    ```env
    OPENAI_API_KEY=your_openai_api_key_here
    ```

4. Run the FastAPI server:
    ```bash
    uvicorn main:app --reload --host 127.0.0.1 --port 8000
    ```

---

## Frontend Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Navigate to the `frontend` directory:
    ```bash
    cd frontend/
    ```

2. Install dependencies:
    ```bash
    npm install  # or yarn install
    ```

3. Start the development server:
    ```bash
    npm run dev  # or yarn dev
    ```

4. Open the application in your browser at `http://localhost:5173`.

---

## How It Works

### Backend Workflow

1. **Video Preprocessing**:
    - `/api/preprocess`: Accepts a YouTube link, downloads audio using `yt-dlp`, transcribes it using OpenAI Whisper, and generates checkpoints and summaries using GPT.
    
2. **Session Storage**:
    - Stores processed data in Firebase Firestore for retrieval during frontend interactions.

3. **Transcript Snippets**:
    - `/api/transcript/{session_id}/{start_time}/{end_time}`: Retrieves specific transcript segments based on timestamps.

### Frontend Workflow

1. **YouTube Player**:
    - Integrates with YouTube's iframe API for video playback control.
    
2. **Interactive Components**:
    - Displays explanations and quizzes at predefined checkpoints using React components (`Explanation`, `MultipleChoice`).

3. **Real-Time Test Mode**:
    - Enables dynamic interactions with AI-generated content during video playback.

---

## Technologies Used

### Backend:
- FastAPI (Python)
- OpenAI Whisper & GPT APIs for AI processing.
- Firebase Firestore for session storage.

### Frontend:
- React with TypeScript.
- Tailwind CSS for styling.
- Vite for bundling and development.

---

## Environment Variables

| Variable            | Description                     |
|---------------------|---------------------------------|
| `OPENAI_API_KEY`     | API key for OpenAI services     |
| `FIREBASE_CREDENTIALS` | Path to Firebase credentials JSON |

---

## Future Improvements

1. Add more interactive question formats.
2. Support multi-language transcripts and quizzes.
3. Improve checkpoint generation logic for better distribution.

---

## License

This project is licensed under the MIT License.