import React, { useState, useEffect } from 'react';

function Question({ title }: { title: string }) {
    return (
      <div className="text-[50px] text-white underline">
        <h1>{title}</h1>
      </div>
    );
}

interface ChoicesProps {
  choices: string[];
  correctAnswer: string;
  feedback: string;
}

function Feedback({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, 25);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, text]);

  return (
    <div className="pt-1 text-white font-light text-2xl">
      {displayedText}
    </div>
  );
}

function Choices({ choices, correctAnswer, feedback }: ChoicesProps) {
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [hasSelected, setHasSelected] = useState<boolean>(false);

  const handleSelect = (choice: string) => {
    if (!hasSelected) {
      setSelectedChoice(choice);
      setHasSelected(true);
    }
  };

  const getChoiceStyle = (choice: string) => {
    if (!hasSelected) return 'hover:text-purple-200';
    if (choice === correctAnswer) return 'text-green-200';
    if (choice === selectedChoice && choice !== correctAnswer) return 'text-red-200';
    return 'text-white/50'; // dim other choices
  };

  return (
    <div className="flex flex-col space-y-4 p-1">
      {choices.map((choice, index) => (
        <label 
          key={index} 
          className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-colors ${getChoiceStyle(choice)}`}
        >
          <input
            type="radio"
            name="answer"
            checked={selectedChoice === choice}
            onChange={() => handleSelect(choice)}
            disabled={hasSelected}
            className="w-6 h-6 text-blue-choice border-gray-300 focus:ring-blue-500"
          />
          <span className="text-2xl">{choice}</span>
          {hasSelected && choice === correctAnswer && (
            <span className="ml-2 text-2xl text-green-200">← Correct Answer</span>
          )}
        </label>
      ))}
      {hasSelected && (
        <>
          <div className={`rounded-lg text-2xl ${
            selectedChoice === correctAnswer ? 'text-green-200' : 'text-red-200'
          }`}>
            {selectedChoice === correctAnswer ? 'Correct!' : 'Incorrect'}
          </div>
          <Feedback text={feedback} />
        </>
      )}
    </div>
  );
}

export default function Summary() {
  return (
    <div className="relative">
      <Question title="Dot Product" />
      <div className="relative flex flex-row gap-0 text-white">
        <Choices 
          choices={[
            "This is a bullet point This is a bullet point This is a bullet point This is a bullet point ", 
            "This is another bullet point", 
            "This is yet another bullet point"
          ]} 
          correctAnswer="This is a bullet point This is a bullet point This is a bullet point This is a bullet point "
          feedback="The dot product, also known as scalar product, is a fundamental operation in linear algebra that takes two vectors and returns a scalar value. It has many applications in physics and computer graphics."
        />
      </div>
    </div>
  );
}
