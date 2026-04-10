import React from "react";

interface Step8ApprovalProps {
  data: any;
  onUpdate: (data: any) => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function Step8Approval({ data, onUpdate, onComplete, onBack }: Step8ApprovalProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review & Approve</h2>
      <div className="flex gap-4">
        <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded">Back</button>
        <button onClick={onComplete} className="px-4 py-2 bg-green-600 text-white rounded">Complete</button>
      </div>
    </div>
  );
}
