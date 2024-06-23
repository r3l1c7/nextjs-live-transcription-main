'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AutoPlayAudioProps {
  src: string;
}

const AutoPlayAudio: React.FC<AutoPlayAudioProps> = ({ src }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          audioRef.current.muted = true;
          await audioRef.current.play();
          setCanPlay(true);
        } catch (error) {
          console.error("Autoplay failed:", error);
        }
      }
    };

    playAudio();

    const handleInteraction = () => {
      if (audioRef.current && canPlay) {
        audioRef.current.muted = false;
      }
    };

    document.addEventListener('click', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [canPlay]);

  return (
    <>
      <audio 
        ref={audioRef} 
        src={src} 
        loop
      >
        Your browser does not support the audio element.
      </audio>
      {!canPlay && <p>Click anywhere to enable audio</p>}
    </>
  );
};

export default AutoPlayAudio;