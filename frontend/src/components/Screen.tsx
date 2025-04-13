import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import YouTube from 'react-youtube';
import { useYoutubePlayer } from '../hooks/youtube-player.tsx';
import { getBackendAPI } from '../utils/backendApi.tsx';
import { extractVideoId, isValidYouTubeLink } from '../utils/youtube.tsx';
import { Checkpoint, Status } from './Types.tsx';

interface ScreenProps {
  status: Status;
  setStatus: (status: Status) => void;
  conversationMode: boolean;
  setConversationMode: (conversationMode: boolean) => void;
  checkpoints: Checkpoint[];
  setCheckpoints: (checkpoints: Checkpoint[]) => void;
  currentCheckpointIndex: number;
  setCurrentCheckpointIndex: React.Dispatch<React.SetStateAction<number>>;
  setStartPreloading: Dispatch<SetStateAction<boolean>>;
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
  setStartPreloading,
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
      console.log("Paused at checkpoint:", checkpoints[currentCheckpointIndex].time);
      setStartPreloading(true);
      setCurrentCheckpointIndex((prev) => prev + 1);
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
    if (conversationMode && status === 'class' && playerRef.current) {
      pause();

      if (isDown) {
        setIsDown(false);
      }
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
      setTimeout(() => {
        play();
      }, 2000);
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
    height: '540',
    width: '960',
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <div className="mx-auto">
      <div className="mx-auto flex flex-col justify-center items-center">

        {/* Toggle Screen & Projected Content */}
        <div
          className={`absolute mx-auto ${isDown ? 'top-[-150px]' : 'top-[-780px]'} duration-300 transition-all`}
        >
          <img
            src="/screenprojector.PNG"
            alt="Screen Projector"
            className="w-[2000px] h-[1000px] object-fill pointer-events-none"
          />

          {/* Toggle Buttons */}
          <button
            //onClick={handleToggle}
            className="absolute top-0 left-0 w-[2000px] h-[810px]"
            aria-label="Toggle screen"
          />
          <button
            //onClick={handleToggle}
            className="absolute bottom-0 left-33 w-[50px] h-[190px]"
            aria-label="Toggle screen"
          />

          {/* Nested Input Field */}
          {!videoId && status !== 'processing' && (
            <div className="absolute top-[71%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] flex justify-between gap-4 z-10 duration-300">
              <input
                className="flex-1 rounded bg-white/80 backdrop-blur-sm border border-[#8F71A3] px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8F71A3]"
                type="text"
                placeholder="Enter a YouTube video link..."
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className="backdrop-transparent hover:bg-[#8F71A3]/30 text-[#8F71A3] font-semibold px-6 py-2 rounded transition-all duration-300 border-2 border-[#8F71A3]"
                onClick={() => handleInput(youtubeLink.trim())}
              >
                Enter Class
              </button>
            </div>
          )}

          {/* Nested YouTube Player */}
          {videoId && status === 'class' && (
            <div className="absolute top-[12.5%] left-[48%] transform -translate-x-1/2 w-[960px] max-w-[90%] z-10 pt-14">
              <YouTube
                videoId={videoId}
                opts={opts}
                onReady={(e) => {
                  playerRef.current = e.target;
                }}
                onEnd={handleVideoEnd}
              />
            </div>
          )}
        </div>

        {isDown && status !== 'class' && (
          <div className="absolute top-[20px] left-1/2 transform -translate-x-1/2 z-20 max-w-[700px] text-center bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-lg border border-gray-300">
            <h2 className="text-2xl font-bold mb-4 text-[#6A4C93]">Getting things ready!</h2>
            <p className="text-gray-800 text-lg mb-3">We're analyzing your video to create an interactive learning experience.</p>
            <ul className="text-left text-gray-700 list-disc pl-6 space-y-2 text-base">
              <li>⏸️ The video will pause at important moments to check your understanding with various quesitions.</li>
              <li>🧠 You can use your mic to answer the questions and have a conversation with your personal tutor.</li>
              <li>🧑‍🏫 You can answer the question and go back to the video or ask the tutor more questions.</li>
              <li>🎥 Say "go back to video" when you're ready to resume.</li>
            </ul>
            <p className="mt-6 italic text-sm text-gray-600">Tip: You can interrupt the tutor whenever you want.</p>
          </div>)}

        {/* Separate Loading Screen (not inside toggle) */}
        {isDown && status === 'processing' && (
          <div className="absolute bottom-1/7 left-1/2 transform -translate-x-1/2 -translate-y-0 z-20 text-xl font-medium text-gray-700">
            Processing...
          </div>
        )}
      </div>
    </div>


  );
}
