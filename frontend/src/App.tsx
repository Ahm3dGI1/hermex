import { useState } from 'react';
import './App.css';

const isValidYouTubeLink = (url: string): boolean => {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w\-]{11}/;
  return pattern.test(url.trim());
};

function App() {
  const [youtubeLink, setYoutubeLink] = useState<string>('');

  const handleInput = async (link: string) => {
    if (!isValidYouTubeLink(link)) {
      alert("Please enter a valid YouTube link.");
      return;
    }

    console.log("Input received:", link);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/preprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtube_link: link }),
      });

      const data = await response.json();
      console.log("Preprocessing response:", data);
    } catch (error) {
      console.error("Error during preprocessing:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && youtubeLink.trim()) {
      handleInput(youtubeLink.trim());
    }
  };

  return (
    <div className="main flex justify-center items-center h-screen bg-blue-200">
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
    </div>
  );
}

export default App;
