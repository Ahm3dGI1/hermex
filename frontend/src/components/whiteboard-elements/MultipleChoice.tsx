import { useEffect, useState } from "react";
import { ResponseOutput } from "../Types";

interface MultipleChoiceData {
  title: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

const MultipleChoice = ({ functionCallOutput }: { functionCallOutput: ResponseOutput }) => {
  const [quiz, setQuiz] = useState<MultipleChoiceData>();

  useEffect(() => {
    const quiz_data: MultipleChoiceData = JSON.parse(functionCallOutput.arguments || "{}");
    setQuiz(quiz_data);
  }, [functionCallOutput]);

  return (
    <div className="bg-white rounded-md p-4 shadow-sm">
      <h3 className="text-lg font-bold mb-2">{quiz?.title}</h3>
      <p className="text-gray-700 mb-4">{quiz?.question}</p>
      <div className="space-y-2">
        {quiz?.options.map((option, index) => (
          <button
            key={index}
            className="w-full text-left p-2 rounded hover:bg-gray-100 border border-gray-200"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
};

export default MultipleChoice;