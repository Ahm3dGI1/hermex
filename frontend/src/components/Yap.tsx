import React, { useState, useEffect } from 'react';



export default function Yap({ isDown }: { isDown: boolean }): React.ReactElement {
  const [currentImage, setCurrentImage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let interval: number | null = null;

    if (!isDown && isAnimating) {
      interval = window.setInterval(() => {
        setCurrentImage((prev) => prev === 1 ? 2 : 1);
      }, 350);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [!isDown, isAnimating]);

  const handleClick = () => {
    setIsAnimating(prev => !prev);
  };

  return (
    <div className={`absolute top-107 transition-all duration-500 ease-in-out ${!isDown ? '-left-10' : '-left-[600px]'
      } justify-center`}>
      <button
        onClick={handleClick}
        className="flex items-center justify-center"
      >
        <img
          src={`/yap${currentImage}.PNG`}
          alt={`Yap animation frame ${currentImage}`}
          className={`w-1/1 h-[400px] object-contain rounded-lg transition-transform duration-200 ease-in-out ${currentImage === 2 ? '-translate-y-5' : 'translate-y-0'
            }`}
        />
      </button>
    </div>
  );
}
