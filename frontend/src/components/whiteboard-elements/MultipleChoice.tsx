import { useEffect, useState } from "react";
import { ResponseOutput } from "../Types";

interface MultipleChoiceData {
  title: string;
  question: string;
  options: string[];
  correctAnswer: string;
  feedback: string;
}

interface MultipleChoiceProps {
  functionCallOutput: ResponseOutput;
  handleChoiceClick: (choice: string, call_id: string) => void;
}

const MultipleChoice = ({ functionCallOutput, handleChoiceClick }: MultipleChoiceProps) => {
  const [quiz, setQuiz] = useState<MultipleChoiceData>();
  const [selectedChoice, setSelectedChoice] = useState<string>("");
  const [hasSelected, setHasSelected] = useState(false);
  const [displayedFeedback, setDisplayedFeedback] = useState("");
  const [feedbackIndex, setFeedbackIndex] = useState(0);

  useEffect(() => {
    const quiz_data: MultipleChoiceData = JSON.parse(functionCallOutput.arguments || "{}");
    setQuiz(quiz_data);
    setSelectedChoice("");
    setHasSelected(false);
    setDisplayedFeedback("");
    setFeedbackIndex(0);
  }, [functionCallOutput]);

  useEffect(() => {
    if (hasSelected && selectedChoice && quiz?.feedback) {
      if (feedbackIndex < quiz.feedback.length) {
        const timer = setTimeout(() => {
          setDisplayedFeedback(prev => prev + quiz.feedback[feedbackIndex]);
          setFeedbackIndex(prev => prev + 1);
        }, 25);

        return () => clearTimeout(timer);
      }
    }
  }, [feedbackIndex, hasSelected, selectedChoice, quiz?.feedback]);

  const handleSelect = (choice: string) => {
    if (!hasSelected) {
      setSelectedChoice(choice);
      setHasSelected(true);
      handleChoiceClick(choice, functionCallOutput.call_id || "");
    }
  };

  const getChoiceStyle = (choice: string) => {
    if (!hasSelected) return 'hover:text-purple-200';
    if (choice === quiz?.correctAnswer) return 'text-green-200';
    if (choice === selectedChoice && choice !== quiz?.correctAnswer) return 'text-red-200';
    return 'text-white/50';
  };

  return (
    <div className="rounded-lg p-6 text-white max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold underline mb-4">{quiz?.title}</h2>
      <p className="text-xl mb-6">{quiz?.question}</p>

      <div className="flex flex-col space-y-4">
        {quiz?.options.map((option, index) => (
          <label
            key={index}
            className={`cursor-pointer flex items-center space-x-3 p-3 rounded-lg transition-all ${getChoiceStyle(option)}`}
          >
            <input
              type="radio"
              name="choice"
              checked={selectedChoice === option}
              onChange={() => handleSelect(option)}
              disabled={hasSelected}
              className="w-5 h-5"
            />
            <span className="text-lg">{option}</span>
            {hasSelected && option === quiz?.correctAnswer && (
              <span className="ml-2 text-green-200">← Correct Answer</span>
            )}
          </label>
        ))}
      </div>

      {hasSelected && (
        <>
          <div className={`mt-4 text-2xl font-semibold ${selectedChoice === quiz?.correctAnswer ? 'text-green-200' : 'text-red-200'
            }`}>
            {selectedChoice === quiz?.correctAnswer ? 'Correct!' : 'Incorrect'}
          </div>
          <div className="pt-2 text-white font-light text-xs">
            {displayedFeedback}
          </div>
        </>
      )}
    </div>
  );
};

export default MultipleChoice;