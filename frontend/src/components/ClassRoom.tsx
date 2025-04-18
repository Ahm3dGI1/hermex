import { useState } from 'react';
import { Checkpoint, Status } from '../components/Types';
import Screen from './Screen.tsx';
import Whiteboard from './Whiteboard';
import Yap from './Yap';

export default function Classroom() {
    // Required props for Screen
    const [status, setStatus] = useState<Status>("waitingForInput");
    const [startPreloading, setStartPreloading] = useState(false);
    const [isDown, setIsDown] = useState(true);
    const [conversationMode, setConversationMode] = useState(false);
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
    const [hermexIsAnimating, setHermexIsAnimating] = useState(false);

    return (
        <div className="relative inset-0 w-screen h-screen overflow-hidden font-[Chalkduster]">
            <div
                className="absolute inset-0 w-full h-full z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('./backgroundach2.jpg')` }}
            />
            <div className="fixed w-full h-full z-1 font-[Chalkduster]">
                <Whiteboard
                    status={status}
                    setStatus={setStatus}
                    conversationMode={conversationMode}
                    setConversationMode={setConversationMode}
                    checkpoints={checkpoints}
                    currentCheckpointIndex={currentCheckpointIndex}
                    setHermexIsAnimating={setHermexIsAnimating}
                    startPreloading={startPreloading}
                    setStartPreloading={setStartPreloading}
                />
                <Screen
                    status={status}
                    setStatus={setStatus}
                    conversationMode={conversationMode}
                    setConversationMode={setConversationMode}
                    checkpoints={checkpoints}
                    setCheckpoints={setCheckpoints}
                    currentCheckpointIndex={currentCheckpointIndex}
                    setCurrentCheckpointIndex={setCurrentCheckpointIndex}
                    setStartPreloading={setStartPreloading}
                    isDown={isDown}
                    setIsDown={setIsDown}
                />
                <Yap isDown={isDown} isAnimating={hermexIsAnimating} />
            </div>
        </div>
    );
}
