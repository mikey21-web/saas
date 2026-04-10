import React from "react";

interface Step1BrandProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export default function Step1Brand({ data, onUpdate, onNext }: Step1BrandProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Brand Identity</h2>
      <button onClick={onNext} className="px-4 py-2 bg-purple-600 text-white rounded">Next</button>
    </div>
  );
}
