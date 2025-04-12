import { useState } from 'react';
import './App.css';

import { isValidYouTubeLink, extractVideoId } from './utils/youtube.tsx';
import { useYoutubePlayer } from './hooks/youtube-player.tsx';

function App() {
  // Checkpoints variables
  const [checkpoints, setCheckpoints] = useState<number[]>([]);
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);

  // Youtube player Logic
  const handleTimeUpdate = (time: number) => {
    console.log("Current Time:", time);
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
      const response = await fetch('http://127.0.0.1:8000/api/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_link: link }),
      });
      const data = await response.json();


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

  const handleAskQuestion = () => {
    pause(); // Pause the video
    console.log("Ask Question button clicked");
  };

  const handleEndConvo = () => {
    play(); // Pause the video
    console.log("End Convo button clicked");
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

      {/* Class Start */}
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
            <button onClick={handleAskQuestion} className="bg-red-500 text-white px-4 py-2 rounded">Ask Question</button>
            <button onClick={handleEndConvo} className="bg-green-500 text-white px-4 py-2 rounded">End Convo</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
