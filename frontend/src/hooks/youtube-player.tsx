import { useEffect, useRef } from 'react';

export const useYoutubePlayer = (
    videoId: string | null,
    onTimeUpdate?: (time: number) => void
) => {
    const playerRef = useRef<any>(null);

    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.body.appendChild(tag);
        }
    }, []);

    useEffect(() => {
        if (videoId && window.YT && window.YT.Player) {
            playerRef.current = new window.YT.Player('youtube-player', {
                events: {
                    onReady: () => console.log('YouTube Player Ready'),
                },
            });
        }
    }, [videoId]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current?.getCurrentTime) {
                const currentTime = playerRef.current.getCurrentTime();
                if (onTimeUpdate) {
                    onTimeUpdate(currentTime);
                }
            }
        }, 500);

        return () => clearInterval(interval);
    }, [onTimeUpdate]);

    return {
        pause: () => playerRef.current?.pauseVideo(),
        play: () => playerRef.current?.playVideo(),
        getCurrentTime: () => playerRef.current?.getCurrentTime(),
    };
};
