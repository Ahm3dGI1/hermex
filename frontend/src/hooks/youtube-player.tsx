import { useEffect, useRef } from 'react';
import { YouTubePlayer } from 'react-youtube';


export const useYoutubePlayer = (
    videoId: string | null,
    onTimeUpdate?: (time: number) => void,
    onVideoEnd?: () => void // Add new callback prop
) => {
    const playerRef = useRef<YouTubePlayer | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const currentTime = playerRef.current.getCurrentTime();
            if (onTimeUpdate) {
                onTimeUpdate(currentTime);
            }
        }, 900);

        return () => clearInterval(interval);
    }, [onTimeUpdate]);

    return {
        pause: () => playerRef.current.pauseVideo(),
        play: () => playerRef.current.playVideo(),
        getCurrentTime: () => playerRef.current.getCurrentTime(),
        playerRef: playerRef,
    };
};