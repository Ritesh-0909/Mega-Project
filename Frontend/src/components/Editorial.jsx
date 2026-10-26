import { useRef, useState, useEffect } from 'react';

const Editorial = ({ secureUrl, thumbnailUrl, duration }) => {
    const videoRef = useRef(null);
    const pendingPlaybackRef = useRef(null);

    const [quality, setQuality] = useState('auto');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [videoSrc, setVideoSrc] = useState(secureUrl || '');
    const [thumbnailError, setThumbnailError] = useState(false);

    useEffect(() => {
    const handleKeyDown = (event) => {
        const video = videoRef.current;
        if (!video) return;

        // Don't interfere with typing in inputs or dropdowns
        if (
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(
                event.target.tagName
            ) ||
            event.target.isContentEditable
        ) {
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            video.currentTime = Math.min(
                video.duration || 0,
                video.currentTime + 10
            );
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            video.currentTime = Math.max(
                0,
                video.currentTime - 10
            );
        }

        if (event.code === 'Space') {
          event.preventDefault();
          togglePlay();
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
}, []);

    const handleLoadedMetadata = (event) => {
        const video = event.currentTarget;
        const actualDuration = video.duration;

        if (!Number.isFinite(actualDuration) || actualDuration <= 0) {
            setVideoDuration(0);
            return;
        }

        setVideoDuration(actualDuration);

        const pending = pendingPlaybackRef.current;

        if (pending) {
            const safeTime = Math.min(
                pending.currentTime,
                Math.max(0, actualDuration - 0.1)
            );

            video.currentTime = safeTime;
            setCurrentTime(safeTime);
            pendingPlaybackRef.current = null;

            if (pending.wasPlaying) {
                video.play().catch((error) => {
                    console.error('Video playback error:', error);
                });
            }
        } else {
            setCurrentTime(
                Math.min(video.currentTime, actualDuration)
            );
        }
    };

    const handleTimeUpdate = (event) => {
        const video = event.currentTarget;

        if (!Number.isFinite(video.currentTime)) return;

        setCurrentTime(video.currentTime);

        if (Number.isFinite(video.duration) && video.duration > 0) {
            setVideoDuration(video.duration);
        }
    };

    const formatTime = (time) => {
        if (!Number.isFinite(time) || time < 0) return '0:00';

        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);

        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    };

    const skip = (seconds) => {
        const video = videoRef.current;

        if (!video || !Number.isFinite(video.duration)) return;

        const newTime = Math.max(
            0,
            Math.min(video.duration, video.currentTime + seconds)
        );

        video.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const togglePlay = () => {
        const video = videoRef.current;

        if (!video) return;

        if (video.paused) {
            video.play().catch((error) => {
                console.error('Video playback error:', error);
            });
        } else {
            video.pause();
        }
    };

    const seek = (event) => {
        const video = videoRef.current;

        if (!video || !Number.isFinite(video.duration)) return;

        const requestedTime = Number(event.target.value);
        const safeTime = Math.max(
            0,
            Math.min(video.duration, requestedTime)
        );

        video.currentTime = safeTime;
        setCurrentTime(safeTime);
    };

    const changeQuality = (event) => {
        const selectedQuality = event.target.value;
        const video = videoRef.current;

        if (!video || !secureUrl) return;

        const savedTime = Number.isFinite(video.currentTime)
            ? video.currentTime
            : 0;

        const wasPlaying = !video.paused;

        let newUrl = secureUrl;

        if (selectedQuality !== 'auto') {
            const height = selectedQuality.replace('p', '');

            newUrl = secureUrl.replace(
                '/upload/',
                `/upload/c_limit,h_${height},q_auto/`
            );
        }

        setQuality(selectedQuality);

        if (newUrl === videoSrc) return;

        pendingPlaybackRef.current = {
            currentTime: savedTime,
            wasPlaying,
        };

        video.pause();
        setCurrentTime(0);
        setVideoDuration(0);
        setVideoSrc(newUrl);
    };

    const enterFullscreen = () => {
        const video = videoRef.current;

        if (!video) return;

        const container = video.parentElement;

        if (document.fullscreenElement) {
            document.exitFullscreen?.();
        } else {
            container?.requestFullscreen?.();
        }
    };

    if (!secureUrl) {
        return (
            <div className="alert alert-info">
                No editorial video is available for this problem.
            </div>
        );
    }

    const progress =
        videoDuration > 0
            ? Math.min(100, (currentTime / videoDuration) * 100)
            : 0;

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div className="overflow-hidden rounded-xl bg-base-200">
                <div className="group relative w-full overflow-hidden rounded-xl bg-black">

                    {/* Video */}
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        poster={
                            thumbnailUrl && !thumbnailError
                                ? thumbnailUrl
                                : undefined
                        }
                        preload="metadata"
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        onError={() => {
                            console.error(
                                'Video failed to load:',
                                videoSrc
                            );
                        }}
                        onClick={togglePlay}
                        className="block aspect-video w-full bg-black object-contain"
                    />

                    {/* Thumbnail overlay before playback */}
                    {!isPlaying &&
                        currentTime === 0 &&
                        thumbnailUrl &&
                        !thumbnailError && (
                            <img
                                src={thumbnailUrl}
                                alt="Editorial video thumbnail"
                                onError={() => setThumbnailError(true)}
                                onClick={togglePlay}
                                className="absolute inset-0 h-full w-full cursor-pointer object-contain"
                            />
                        )}

                    {/* Custom controls */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pb-3 pt-8 text-white">

                        {/* Progress bar */}
                        <input
                            type="range"
                            min="0"
                            max={videoDuration || 0}
                            step="0.1"
                            value={Math.min(
                                currentTime,
                                videoDuration || 0
                            )}
                            onChange={seek}
                            aria-label="Video progress"
                            className="mb-2 block h-1 w-full cursor-pointer appearance-none rounded-full accent-pink-500"
                            style={{
                                background: `linear-gradient(to right, #ff1744 ${progress}%, #555 ${progress}%)`,
                            }}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">

                                <button
                                    type="button"
                                    onClick={() => skip(-10)}
                                    className="btn btn-circle btn-sm border-0 bg-white/10 text-white hover:bg-white/20"
                                    title="Backward 10 seconds"
                                    aria-label="Backward 10 seconds"
                                >
                                    ⏪
                                </button>

                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    className="btn btn-circle btn-sm border-0 bg-white/10 text-white hover:bg-white/20"
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying ? 'Ⅱ' : '▶'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => skip(10)}
                                    className="btn btn-circle btn-sm border-0 bg-white/10 text-white hover:bg-white/20"
                                    title="Forward 10 seconds"
                                    aria-label="Forward 10 seconds"
                                >
                                    ⏩
                                </button>

                                <span className="whitespace-nowrap rounded-full bg-white/5 px-2 py-2 text-xs font-semibold sm:text-sm">
                                    {formatTime(currentTime)} /{' '}
                                    {formatTime(videoDuration)}
                                </span>
                            </div>

                            <div className="ml-auto flex shrink-0 items-center gap-2">

                            
                              <select
                                  className="bg-[#252525] text-white"
                                  value={quality}
                                  onChange={changeQuality}
                                  aria-label="Video quality"
                              >
                                  <option className="bg-[#1f2937] text-white" value="auto">
                                      Auto
                                  </option>
                                  <option className="bg-[#1f2937] text-white" value="360p">
                                      360p
                                  </option>
                                  <option className="bg-[#1f2937] text-white" value="480p">
                                      480p
                                  </option>
                                  <option className="bg-[#1f2937] text-white" value="720p">
                                      720p
                                  </option>
                                  <option className="bg-[#1f2937] text-white" value="1080p">
                                      1080p
                                  </option>
                              </select>

                                <button
                                    type="button"
                                    onClick={enterFullscreen}
                                    className="btn btn-circle btn-sm border-0 bg-white/10 text-lg text-white hover:bg-white/20"
                                    title="Fullscreen"
                                    aria-label="Fullscreen"
                                >
                                    ⛶
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Editorial;