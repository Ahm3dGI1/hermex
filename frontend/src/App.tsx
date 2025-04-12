import { useState } from 'react';

import './App.css'


function App() {
  const [youtubeLink, setYoutubeLink] = useState<string>('');

  // Function to handle input submission
  const handleInput = async (youtubeLink: string) => {
    console.log("Input received:", youtubeLink);

    const response = await fetch('http://127.0.0.1:8000/api/preprocess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ youtube_link: youtubeLink }),
    });

    const data = await response.json();
    console.log("Preprocessing response:", data);
  }

  // Press Enter to submit the input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const inputValue = e.currentTarget.value.trim();
      if (inputValue) {
        handleInput(inputValue);
      }
    }
  };


  return (
    <>
      <div className='main flex justify-center items-center h-screen bg-blue-200'>
        <div className="input flex justify-around items-center w-4/5">
          <input
            className="link-field w-4/5 rounded bg-amber-50 select-none"
            type="text"
            placeholder="Enter a video link to get started..."
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="submit-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => handleInput(youtubeLink)}>
            Start Class
          </button>
        </div>
      </div>
    </>
  )
}

export default App
