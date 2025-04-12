import { useEffect, useState } from 'react';
import { ResponseOutput } from '../Types';

interface DetailedExplanationData {
  title: string;
  bullets: string[];
  notes: string;
}

function AnimatedText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [visibleWords, setVisibleWords] = useState(0);
  const words = text.split(' ');

  useEffect(() => {
    if (visibleWords < words.length) {
      const timer = setTimeout(() => {
        setVisibleWords((prev) => prev + 1);
      }, 40);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [visibleWords, words.length, onComplete]);

  return (
    <>
      {words.map((word, index) => (
        <span key={index} className="inline-block transition-opacity duration-300" style={{ opacity: index < visibleWords ? 1 : 0 }}>
          {word}{' '}
        </span>
      ))}
    </>
  );
}

function Title({ title }: { title: string }) {
  return (
    <div className="text-[40px] text-white font-bold underline mb-4">
      <h1>{title}</h1>
    </div>
  );
}

function BulletPoints({ bullets }: { bullets: string[] }) {
  const [visibleBullets, setVisibleBullets] = useState(1);
  const [completedBullets, setCompletedBullets] = useState(0);

  const handleBulletComplete = () => {
    setCompletedBullets((prev) => prev + 1);
    if (visibleBullets < bullets.length) {
      setVisibleBullets((prev) => prev + 1);
    }
  };

  return (
    <ul className="list-disc text-white space-y-3 text-lg pl-6 w-[350px]">
      {bullets.map((bullet, i) => (
        <li
          key={i}
          className="transition-opacity duration-300"
          style={{
            opacity: i < visibleBullets ? 1 : 0,
            visibility: i < visibleBullets ? 'visible' : 'hidden',
          }}
        >
          {i < visibleBullets && (
            <AnimatedText text={bullet} onComplete={i === visibleBullets - 1 ? handleBulletComplete : undefined} />
          )}
        </li>
      ))}
    </ul>
  );
}

function Notes({ notes }: { notes: string }) {
  return (
    <div className="text-white text-lg ml-10 w-[600px] leading-relaxed">
      <AnimatedText text={notes} />
    </div>
  );
}

export default function DetailedExplanationComponent({ functionCallOutput }: { functionCallOutput: ResponseOutput }) {
  const [data, setData] = useState<DetailedExplanationData>({
    title: '',
    bullets: [],
    notes: '',
  });

  useEffect(() => {
    try {
      const parsed: DetailedExplanationData = JSON.parse(functionCallOutput.arguments || '{}');
      setData({
        title: parsed.title || '',
        bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
        notes: parsed.notes || '',
      });
    } catch (err) {
      console.error('Error parsing explanation data:', err);
      setData({ title: '', bullets: [], notes: '' }); // fallback to prevent crash
    }
  }, [functionCallOutput]);

  return (
    <div className="p-8 bg-[#1b1e28] rounded-lg max-w-5xl mx-auto shadow-md">
      <Title title={data.title} />
      <div className="flex flex-row gap-10">
        {data.bullets.length > 0 && <BulletPoints bullets={data.bullets} />}
        {data.notes && <Notes notes={data.notes} />}
      </div>
    </div>
  );
}
