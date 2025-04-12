import { useEffect, useRef, useState } from 'react';
import './App.css';

const isValidYouTubeLink = (url: string): boolean => {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w\-]{11}/;
  return pattern.test(url.trim());
};

const extractVideoId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

function App() {
  const [youtubeLink, setYoutubeLink] = useState<string>('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);

  // Load YouTube Iframe API once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  }, []);

  // Setup the player when videoId changes
  useEffect(() => {
    if (videoId && window.YT && window.YT.Player) {
      playerRef.current = new window.YT.Player('youtube-player', {
        events: {
          onReady: () => console.log('YouTube Player Ready'),
        },
      });
    }
  }, [videoId]);

  const handleInput = async (youtubeLink: string) => {
    const id = extractVideoId(youtubeLink);
    if (!id || !isValidYouTubeLink(youtubeLink)) {
      alert('Invalid YouTube link format.');
      return;
    }

    setVideoId(id); // triggers iframe rendering

    // Backend call (commented for now)
    // try {
    //   const response = await fetch('http://127.0.0.1:8000/api/preprocess', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ youtube_link: youtubeLink }),
    //   });
    //   const data = await response.json();
    //   console.log("Preprocessing response:", data);
    // } catch (error) {
    //   console.error("Error during preprocessing:", error);
    // }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && youtubeLink.trim()) {
      handleInput(youtubeLink.trim());
    }
  };

  const pauseVideo = () => {
    playerRef.current?.pauseVideo();
  };

  const playVideo = () => {
    playerRef.current?.playVideo();
  };

  return (
    <div className="main flex flex-col justify-center items-center h-screen bg-blue-200">
      <div className="input flex justify-around items-center w-4/5">
        <input
          className="link-field w-4/5 rounded bg-amber-50 select-none px-4 py-2"
          type="text"
          placeholder="Enter a video link to get started..."
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

      {videoId && (
        <>
          <div className="video-container mt-6 px-6 w-full max-w-3xl">
            <iframe
              id="youtube-player"
              className="rounded-xl w-full aspect-video"
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          {/* Optional: control buttons to test pause/resume */}
          <div className="mt-4 flex gap-4">
            <button onClick={pauseVideo} className="bg-red-500 text-white px-4 py-2 rounded">Pause</button>
            <button onClick={playVideo} className="bg-green-500 text-white px-4 py-2 rounded">Play</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
