import React, { useState, useEffect } from 'react';

function AnimatedText({ text, onComplete }: { text: string, onComplete?: () => void }) {
  const [visibleWords, setVisibleWords] = useState<number>(0);
  const words = text.split(' ');

  useEffect(() => {
    let timer: number;
    
    if (visibleWords < words.length) {
      timer = window.setTimeout(() => {
        setVisibleWords(prev => prev + 1);
      }, 40);
    } else if (onComplete) {
      onComplete();
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [visibleWords, words.length, onComplete]);

  return (
    <>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
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

function BulletPoints({ bullets }: { bullets: string[] }) {
  const [visibleBullets, setVisibleBullets] = useState<number>(1);
  const [completedBullets, setCompletedBullets] = useState<number>(0);

  const handleBulletComplete = () => {
    setCompletedBullets(prev => prev + 1);
    if (visibleBullets < bullets.length) {
      setVisibleBullets(prev => prev + 1);
    }
  };

  return (
    <div className="relative top-[7px] ml-4 p-5 w-[300px]">
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

function Notes({ notes }: { notes: string }) {
  return (
    <div className="relative top-[7px] p-5 flex-1 ml-4 thin">
      <p className="text-sm md:text-base xl:text-xl text-white leading-relaxed break-words">
        <AnimatedText text={notes} />
      </p>
    </div>
  );
}

export default function Summary() {
  return (
    <div className="relative">
      <Title title="Dot Product" />
      <div className="relative flex flex-row gap-0">
        <BulletPoints bullets={["This is a bullet point This is a bullet point This is a bullet point This is a bullet point ", "This is another bullet point", "This is yet another bullet point"]} />
        <Notes notes="With absolutely positioned elements, any offsets are calculated relative to the nearest parent that has a position other than static, and the element will act as a position reference for other absolutely positioned children." />
      </div>
    </div>
  );
};
