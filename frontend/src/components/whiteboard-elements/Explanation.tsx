import React, { useEffect, useState } from 'react';
import { ResponseOutput } from '../Types';


function AnimatedText({ text, onComplete }: { text: string, onComplete?: () => void }) {
  const [visibleWords, setVisibleWords] = useState<number>(0);
  const words = text.split(' ');

  useEffect(() => {
    if (visibleWords < words.length) {
      const timer = setTimeout(() => {
        setVisibleWords(prev => prev + 1);
      }, 40);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [visibleWords, words.length, onComplete]);

  return (
    <>
      {words.map((word, index) => (
        <React.Fragment key={index}>
          <span
            className="inline-block transition-opacity duration-300"
            style={{ opacity: index < visibleWords ? 1 : 0 }}
          >
            {word}
          </span>
          {index < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </>
  );
}

function Title({ title }: { title: string }) {
  return (
    <div className="text-[50px] text-white underline">
      <h1>{title}</h1>
    </div>
  );
}

function Headers({ bullets }: { bullets: string[] }) {
  const [visibleBullets, setVisibleBullets] = useState<number>(1);
  const [completedBullets, setCompletedBullets] = useState<number>(0);

  const handleBulletComplete = () => {
    setCompletedBullets(prev => prev + 1);
    if (visibleBullets < bullets.length) {
      setVisibleBullets(prev => prev + 1);
    }
  };

  return (
    <div className="relative top-[7px] p-5 w-1/1.2">
      <ul className="list-disc text-sm md:text-base xl:text-xl text-white space-y-2 leading-relaxed">
        {bullets.map((point, index) => (
          <li 
            key={index} 
            className="break-words transition-opacity duration-300"
            style={{ 
              opacity: index < visibleBullets ? 1 : 0,
              visibility: index < visibleBullets ? 'visible' : 'hidden'
            }}
          >
            {index < visibleBullets && (
              <AnimatedText 
                text={point} 
                onComplete={index === visibleBullets - 1 ? handleBulletComplete : undefined}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ExplanationData {
  title: string;
  bullets: string[];
}

export default function ExplanationComponent({ functionCallOutput }: { functionCallOutput: ResponseOutput }) {
  const [data, setData] = useState<ExplanationData>({
    title: '',
    bullets: []
  });

  useEffect(() => {
    try {
      const parsed: ExplanationData = JSON.parse(functionCallOutput.arguments || '{}');
      setData({
        title: parsed.title || '',
        bullets: Array.isArray(parsed.bullets) ? parsed.bullets : []
      });
    } catch (err) {
      console.error('Error parsing explanation data:', err);
      setData({ title: '', bullets: [] }); // fallback to prevent crash
    }
  }, [functionCallOutput]);

  return (
    <div className="relative w-full">
      <Title title={data.title} />
      <div className="w-full">
        <Headers bullets={data.bullets} />
      </div>
    </div>
  );
}
