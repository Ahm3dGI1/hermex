import { useEffect, useRef } from 'react';

export const useYoutubePlayer = (
    videoId: string | null,
    onTimeUpdate?: (time: number) => void,
    onVideoEnd?: () => void // Add new callback prop
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
                    onStateChange: (event: any) => {
                        // YouTube player states:
                        // -1 (unstarted)
                        // 0 (ended)
                        // 1 (playing)
                        // 2 (paused)
                        // 3 (buffering)
                        // 5 (video cued)
                        if (event.data === 0 && onVideoEnd) {
                            onVideoEnd();
                        }
                    },
                },
            });
        }
    }, [videoId, onVideoEnd]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current?.getCurrentTime) {
                const currentTime = playerRef.current.getCurrentTime();
                if (onTimeUpdate) {
                    onTimeUpdate(currentTime);
                }
            }
        }, 900);

        return () => clearInterval(interval);
    }, [onTimeUpdate]);

    return {
        pause: () => playerRef.current?.pauseVideo(),
        play: () => playerRef.current?.playVideo(),
        getCurrentTime: () => playerRef.current?.getCurrentTime(),
    };
};