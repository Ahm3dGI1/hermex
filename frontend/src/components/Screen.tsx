import { useEffect, useState } from 'react';
import { useYoutubePlayer } from '../hooks/youtube-player.tsx';
import { extractVideoId, isValidYouTubeLink } from '../utils/youtube.tsx';
import { Checkpoint, Status } from './Types';
interface ScreenProps {
  status: Status;
  setStatus: (status: Status) => void;
  conversationMode: boolean;
  setConversationMode: (conversationMode: boolean) => void;
  checkpoints: Checkpoint[];
  setCheckpoints: (checkpoints: Checkpoint[]) => void;
  currentCheckpointIndex: number;
  setCurrentCheckpointIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function Screen({
  status,
  setStatus,
  conversationMode,
  setConversationMode,
  checkpoints,
  setCheckpoints,
  currentCheckpointIndex,
  setCurrentCheckpointIndex
}: ScreenProps) {
    
  
    // Youtube player Logic
    const handleTimeUpdate = (time: number) => {
      console.log("Current Time:", time);
      if (
        checkpoints.length > 0 &&
        currentCheckpointIndex < checkpoints.length &&
        time >= checkpoints[currentCheckpointIndex].time
      ) {
        pause(); // pause the video
        console.log("Paused at checkpoint:", checkpoints[currentCheckpointIndex].time);
        setConversationMode(true);
        setCurrentCheckpointIndex((prev) => prev + 1);
      }
    }
  
    const handleVideoEnd = () => {
      console.log("Video ended");
      setStatus('review');
    }
    const [youtubeLink, setYoutubeLink] = useState<string>('');
    const [videoId, setVideoId] = useState<string | null>(null);
    const { play, pause } = useYoutubePlayer(videoId, handleTimeUpdate, handleVideoEnd); // Custom hook to manage YouTube player

    useEffect(() => {
        if (!conversationMode && status === 'class') {
            play();
        }
    }, [conversationMode]);
  
  
    const handleInput = async (link: string) => {
        setStatus('processing');
      const id = extractVideoId(link);
      if (!id || !isValidYouTubeLink(link)) return alert('Invalid YouTube link.');
  
      // Preprocess the video link
      try {
        console.log("Preprocessing video link:", link);
        const response = await fetch('http://127.0.0.1:8000/api/preprocess', {
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
  
  
    return (
      <div className="absolute w-full flex-col justify-center items-center bg-blue-200">
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
        {videoId && status === 'class' && (
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
        {status === 'processing' && (
          <div className="flex justify-center items-center h-screen">
            processing...
          </div>
        )}
      </div>
    );
  }
