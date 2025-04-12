import { useState, Dispatch, SetStateAction } from 'react';

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

export default function Screen({ isDown, setIsDown }: { isDown: boolean, setIsDown: Dispatch<SetStateAction<boolean>> }) {

  const handleToggle = () => setIsDown(prev => !prev);

  return (
    <div className="mx-auto">
      <div className="mx-auto flex flex-col justify-center items-center">
        <ToggleButton isDown={isDown} onToggle={handleToggle} />
      </div>
    </div>
  );
}
