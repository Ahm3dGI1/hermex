import { useEffect, useState } from 'react';
import { Checkpoint, Status } from './Types';

type UIType = 'empty' | 'explanation' | 'multiple_choice' | 'buttons';

export default function Whiteboard( {status, setStatus, conversationMode, setConversationMode, checkpoints, currentCheckpointIndex}: {status: Status, setStatus: (status: Status) => void, conversationMode: boolean, setConversationMode: (conversationMode: boolean) => void, checkpoints: Checkpoint[], currentCheckpointIndex: number}) {
    const [currentUI, setCurrentUI] = useState<UIType>('buttons');

    // function getUI() {
    //     switch (currentUI) {
    //         case 'explanation':
    //             return <Summary />;
    //         case 'multiple_choice':
    //             return <MultipleChoice />;
    //         case 'buttons':
    //             return <Buttons ></Buttons>
    //     }
    // }

    
    useEffect(() => {
        if (conversationMode){
            console.log("Starting real time chat");
        }
    }, [conversationMode]);

    function handleEndChat() {
        setConversationMode(false);
    }
    return (
        <div className='absolute bg-gray-200 w-2/3 z-10'>
            <h1>Whiteboard</h1>
            {conversationMode && (
                <div>
                    <h1>Real time chat starting...</h1>
                    <button onClick={handleEndChat}>End Chat</button>
                </div>
            )}
        </div>
    )
}
