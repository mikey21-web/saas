import React from "react";

interface Step5CompetitorsProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step5Competitors({ data, onUpdate, onNext, onBack }: Step5CompetitorsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Competitor Analysis</h2>
      <div className="flex gap-4">
        <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded">Back</button>
        <button onClick={onNext} className="px-4 py-2 bg-purple-600 text-white rounded">Next</button>
      </div>
    </div>
  );
}
