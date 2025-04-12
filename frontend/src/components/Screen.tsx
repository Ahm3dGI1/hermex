import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useYoutubePlayer } from '../hooks/youtube-player.tsx';
import YouTube from 'react-youtube';
import { getBackendAPI } from '../utils/backendApi.tsx';
import { extractVideoId, isValidYouTubeLink } from '../utils/youtube.tsx';
import { Checkpoint, Status } from './Types.tsx';

interface ButtonProps {
  isDown: boolean;
  onToggle: () => void;
}

function ToggleButton({ isDown, onToggle }: ButtonProps) {
  return (
    <div className={`absolute mx-auto ${isDown ? 'top-[-150px]' : 'top-[-780px]'} duration-300 transition-all`}>
      <img
        src="/screenprojector.PNG"
        alt="Screen Projector"
        className="w-[2000px] h-[1000px] object-fill pointer-events-none"
      />
      {/* Clickable overlay - adjust position and size as needed */}
      <button
        onClick={onToggle}
        className="absolute top-0 left-0 w-[2000px] h-[810px]"
        aria-label="Toggle screen"
      />
      <button
        onClick={onToggle}
        className="absolute bottom-0 left-33 w-[50px] h-[190px]"
        aria-label="Toggle screen"
      />
    </div>
  );
}

interface ScreenProps {
  status: Status;
  setStatus: (status: Status) => void;
  conversationMode: boolean;
  setConversationMode: (conversationMode: boolean) => void;
  checkpoints: Checkpoint[];
  setCheckpoints: (checkpoints: Checkpoint[]) => void;
  currentCheckpointIndex: number;
  setCurrentCheckpointIndex: React.Dispatch<React.SetStateAction<number>>;
  isDown: boolean;
  setIsDown: Dispatch<SetStateAction<boolean>>;
}

export default function Screen({
  status,
  setStatus,
  conversationMode,
  setConversationMode,
  checkpoints,
  setCheckpoints,
  currentCheckpointIndex,
  setCurrentCheckpointIndex,
  isDown,
  setIsDown
}: ScreenProps) {

  const handleToggle = () => setIsDown(prev => !prev);

  // Youtube player Logic
  const handleTimeUpdate = async () => {
    if (!playerRef.current) return;

    const time = await getCurrentTime();

    console.log("Current Time:", time);
    if (
      checkpoints.length > 0 &&
      currentCheckpointIndex < checkpoints.length &&
      time >= checkpoints[currentCheckpointIndex].time
    ) {
      pause();
      console.log("Paused at checkpoint:", checkpoints[currentCheckpointIndex].time);
      setConversationMode(true);
      setCurrentCheckpointIndex((prev) => prev + 1);
      if (isDown) {
        setIsDown(false);
      }
    }
  }

  const handleVideoEnd = () => {
    console.log("Video ended");
    setStatus('review');
  }

  const [youtubeLink, setYoutubeLink] = useState<string>('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const { play, pause, getCurrentTime, playerRef } = useYoutubePlayer(videoId, handleTimeUpdate, handleVideoEnd); // Pass the new callback

  useEffect(() => {
    if (!conversationMode && status === 'class' && playerRef.current) {
      if (!isDown) {
        setIsDown(true);
      }
      play();
    }
  }, [conversationMode]);

  const handleInput = async (link: string) => {
    setStatus('processing');
    const id = extractVideoId(link);
    if (!id || !isValidYouTubeLink(link)) return alert('Invalid YouTube link.');

    // Preprocess the video link
    try {
      const apiurl = await getBackendAPI();
      console.log("Preprocessing video link:", link);
      const response = await fetch(`${apiurl}/preprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_link: link }),
      });
      const data = await response.json();
      console.log("Preprocessing response:", data);
      // Sort checkpoints by time before setting

      setCheckpoints(data.checkpoints.sort((a: Checkpoint, b: Checkpoint) => a.time - b.time));
      setCurrentCheckpointIndex(0);
      setVideoId(id); // triggers iframe rendering
      setStatus('class');

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


  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 0,
    },
  };


  return (
    <div className="mx-auto">
      <div className="mx-auto flex flex-col justify-center items-center">
        <ToggleButton isDown={isDown} onToggle={handleToggle} />

        {/* Input Field */}
        {isDown && !videoId && status !== 'processing' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] flex justify-between gap-4 z-10">
            <input
              className="flex-1 rounded bg-white border border-gray-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="text"
              placeholder="Enter a YouTube video link..."
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow"
              onClick={() => handleInput(youtubeLink.trim())}
            >
              Start Class
            </button>
          </div>
        )}

        {/* YouTube Player */}
        {isDown && videoId && status === 'class' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[720px] max-w-[90%] z-10">
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={(e) => {
                playerRef.current = e.target;
              }}
              onEnd={handleVideoEnd}
            />
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => pause()}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Pause
              </button>
            </div>
          </div>
        )}

        {/* Loading Screen */}
        {isDown && status === 'processing' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-xl font-medium text-gray-700">
            Processing...
          </div>
        )}
      </div>
    </div>
  );
}
