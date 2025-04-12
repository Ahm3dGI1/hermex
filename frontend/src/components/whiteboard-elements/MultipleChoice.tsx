import { useEffect, useState } from "react";
import { ResponseOutput } from "../Types";

interface MultipleChoiceData {
  title: string;
  quizzes: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
}

const MultipleChoice = ({ functionCallOutput }: { functionCallOutput: ResponseOutput }) => {
  const [quiz, setQuiz] = useState<MultipleChoiceData>();

  useEffect(() => {
    const quiz_data: MultipleChoiceData = JSON.parse(functionCallOutput.arguments || "{}");
    setQuiz(quiz_data);
  }, [functionCallOutput]);

  return (
    <div className="bg-white rounded-md p-4 shadow-sm">
      This is quiz
      <h3 className="text-lg font-bold mb-2">{quiz?.title}</h3>
      {quiz?.quizzes.map((q, i) => (
        <div key={i} className="mb-4">
          <p className="text-gray-700 mb-2">{q.question}</p>
          <div className="space-y-2">
            {q.options.map((option, j) => (
              <div key={j} className="flex items-center">
                <input
                  type="radio"
                  id={`q${i}-option${j}`}
                  name={`question${i}`}
                  value={option}
                  className="mr-2"
                />
                <label htmlFor={`q${i}-option${j}`} className="text-gray-600">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
};

export default MultipleChoice;