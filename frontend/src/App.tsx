import { useState } from 'react';
import './App.css';

import { isValidYouTubeLink, extractVideoId } from './utils/youtube.tsx';
import { useYoutubePlayer } from './hooks/youtube-player.tsx';

function App() {
  // Checkpoints variables
  const [checkpoints, setCheckpoints] = useState<number[]>([]);
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);

  // Youyube player Logic
  const handleTimeUpdate = (time: number) => {
    if (
      checkpoints.length > 0 &&
      currentCheckpointIndex < checkpoints.length &&
      time >= checkpoints[currentCheckpointIndex]
    ) {
      pause(); // pause the video
      console.log("Paused at checkpoint:", checkpoints[currentCheckpointIndex]);
      setCurrentCheckpointIndex((prev) => prev + 1);
    }
  }

  const [youtubeLink, setYoutubeLink] = useState<string>('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const { play, pause } = useYoutubePlayer(videoId, handleTimeUpdate); // Custom hook to manage YouTube player



  const handleInput = async (link: string) => {
    const id = extractVideoId(link);
    if (!id || !isValidYouTubeLink(link)) return alert('Invalid YouTube link.');

    setVideoId(id); // triggers iframe rendering

    // Preprocess the video link
    try {
      // const response = await fetch('http://127.0.0.1:8000/api/preprocess', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ youtube_link: link }),
      // });
      // const data = await response.json();

      const data = {
        "checkpoints": [
          {
            "time": 18,
            "question": "What are the key aspects of UI components that Adam emphasizes?",
            "choices": [
              "A) They must be visually appealing.",
              "B) They must work perfectly on diverse devices.",
              "C) They should be accessible to screen reader users.",
              "D) All of the above."
            ],
            "answer": "D",
            "explanation": "Adam highlights multiple important aspects, including visual appeal, functionality across devices, and accessibility for screen reader users, thus 'All of the above' is correct."
          },
          {
            "time": 39,
            "question": "What is the basis of the blog site demo mentioned?",
            "choices": [
              "A) It was created using generic HTML.",
              "B) It is based on a template called Spotlight.",
              "C) It features no specific design template.",
              "D) It uses only Tailwind CSS."
            ],
            "answer": "B",
            "explanation": "Adam mentions that the demo is based on a personal website template called Spotlight, which is part of Tailwind Plus."
          },
          {
            "time": 43,
            "question": "What does Adam propose to improve the accessibility of links?",
            "choices": [
              "A) Keep the entire div as a link.",
              "B) Make only the blog post title the clickable link.",
              "C) Remove links entirely.",
              "D) Use images instead of text for links."
            ],
            "answer": "B",
            "explanation": "Adam suggests that to enhance accessibility, only the blog post title should be the clickable link, simplifying what the screen reader reads out loud."
          }
        ],
        "final": {
          "summary": "In this video series by Adam Wathen, the creator of Tailwind CSS, he shares insights on building accessible and visually appealing UIs. He highlights the importance of creating components that work seamlessly across devices and are easy to navigate with assistive tools. Through a practical example based on a blog site template, Adam demonstrates how to enhance accessibility for screen reader users by refining link structures while maintaining a user-friendly design.",
          "review_questions": [
            "What are some common issues with accessibility in UI components?",
            "Why is it important for screen reader users to receive concise information?",
            "How can design choices impact users with disabilities?"
          ]
        }
      };


      const checkpointTimes = data.checkpoints
        .map((cp: any) => cp.time)
        .sort((a: number, b: number) => a - b);

      setCheckpoints(checkpointTimes);
      setCurrentCheckpointIndex(0);

      console.log("Preprocessing response:", data);
    } catch (error) {
      console.error("Error during preprocessing:", error);
    }
  };

  // Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && youtubeLink.trim()) {
      handleInput(youtubeLink.trim());
    }
  };


  return (
    <div className="main flex flex-col justify-center items-center h-screen bg-blue-200">
      {/* Input Field */}
      <div className="input flex justify-around items-center w-4/5">
        <input
          className="link-field w-4/5 rounded bg-amber-50 px-4 py-2"
          type="text"
          placeholder="Enter a video link..."
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          className="submit-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleInput(youtubeLink.trim())}
        >
          Start Class
        </button>
      </div>

      {/* YouTube Player */}
      {videoId && (
        <>
          <div className="video-container mt-6 px-6 w-full max-w-3xl">
            <iframe
              id="youtube-player"
              className="rounded-xl w-full aspect-video"
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
              title="YouTube video player"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          </div>

          <div className="mt-4 flex gap-4">
            <button onClick={pause} className="bg-red-500 text-white px-4 py-2 rounded">Pause</button>
            <button onClick={play} className="bg-green-500 text-white px-4 py-2 rounded">Play</button>
            <button onClick={() => console.log("Time:")} className="bg-yellow-500 text-white px-4 py-2 rounded">
              Log Time
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
