import { useEffect, useState } from "react";
import { ResponseOutput } from "../Types";

interface ExplanationData {
  title: string;
  text: string;
}

const ExplanationComponent = ({ functionCallOutput }: { functionCallOutput: ResponseOutput}) => {
  const [explanation, setExplanation] = useState<ExplanationData>({
    title: "",
    text: "",
  });

  useEffect(() => {
      const explanation_data: ExplanationData = JSON.parse(functionCallOutput.arguments || "{}");
      setExplanation(explanation_data);
  }, [functionCallOutput]);

  return (
    <div className="bg-white rounded-md p-4 shadow-sm">
      <h3 className="text-lg font-bold mb-2">{explanation.title}</h3>
      <p className="text-gray-700">{explanation.text}</p>
    </div>
  );
};

export default ExplanationComponent;