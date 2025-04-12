import { useState } from 'react';
import OpenQ from './OpenQ';
import Summary from './Summary';
import MultipleQ from './MultipleQ';
import UserQ from './UserQ';


export type UIType = 'empty' | 'summary' | 'multiple_choice' | 'open_ended' | 'user_question' | 'buttons';


interface ButtonsProps {
    setStatus: (status: UIType) => void;
  }
  
function Buttons({ setStatus }: ButtonsProps) {
  return (
    <div className="flex mt-[500px] items-center justify-center gap-4 w-full">
      <button 
        onClick={() => setStatus('summary')}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-48"
      >
        go to summary
      </button>
      <button 
        onClick={() => setStatus('multiple_choice')}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-48"
      >
        go to multiple choice
      </button>
      <button 
        onClick={() => setStatus('open_ended')}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-48"
      >
        go to open ended
      </button>
      <button 
        onClick={() => setStatus('user_question')}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-48"
      >
        go to user question
      </button>
    </div>
  );
}
  
export default function Whiteboard() {
  const [currentUI, setCurrentUI] = useState<UIType>('buttons');

   const getUI = () => {
    switch (currentUI) {
      case 'summary':
        return <Summary />;
      case 'multiple_choice':
        return <MultipleQ />;
      case 'buttons':
        return <Buttons setStatus={setCurrentUI}/>;
      case 'open_ended':
        return <OpenQ />;
      case 'user_question':
        return <UserQ/>;
      default:
        return <Buttons setStatus={setCurrentUI}/>;
    }
  }
  
  return (
    <div className="mx-auto mt-[100px] ml-[300px] w-[1050px] h-[600px]">
        <div className="mx-auto">
            {getUI()}
        </div>
    </div>
  );
};

