import { useState } from 'react';
import Whiteboard from './Whiteboard';
import Screen from './Screen';
import Yap from './Yap';


export default function Classroom() {

    const [isDown, setIsDown] = useState(false);
  return (
    <div className="relative inset-0 w-screen h-screen overflow-hidden font-[Chalkduster]">
      <div 
        className="absolute inset-0 w-full h-full z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('./backgroundach2.jpg')`
        }}
      />

    <div className="fixed w-full h-full z-1 font-[Chalkduster]">
      <Whiteboard />
      <Screen isDown={isDown} setIsDown={setIsDown} />
      <Yap isDown={isDown}/>
    </div>
    </div>
  );
};
