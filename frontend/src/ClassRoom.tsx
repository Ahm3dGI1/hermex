import { useState } from 'react';
import Screen from './components/Screen';
import { Checkpoint, Status } from './components/Types';
import Whiteboard from './components/Whiteboard';


export default function MainApp() {
    const [currentStatus, setCurrentStatus] = useState<Status>('waitingForInput');
    const [conversationMode, setConversationMode] = useState<boolean>(false);
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState<number>(0);
    
    return (
        <div className='relative h-screen w-screen bg-red-200 flex justify-center items-center'>
            <Whiteboard status={currentStatus} setStatus={setCurrentStatus} conversationMode={conversationMode} setConversationMode={setConversationMode} checkpoints={checkpoints} currentCheckpointIndex={currentCheckpointIndex} />
            <Screen status={currentStatus} setStatus={setCurrentStatus} conversationMode={conversationMode} setConversationMode={setConversationMode} checkpoints={checkpoints} setCheckpoints={setCheckpoints} currentCheckpointIndex={currentCheckpointIndex} setCurrentCheckpointIndex={setCurrentCheckpointIndex} />
        </div>
    )
}