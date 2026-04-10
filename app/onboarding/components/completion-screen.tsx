import React from "react";

interface CompletionScreenProps {
  error: string | null;
  onRetry: () => void;
}

export default function CompletionScreen({ error, onRetry }: CompletionScreenProps) {
  return (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold">Processing Your Onboarding...</h2>
      {error ? (
        <>
          <p className="text-red-600">{error}</p>
          <button onClick={onRetry} className="px-4 py-2 bg-purple-600 text-white rounded">Retry</button>
        </>
      ) : (
        <p>Please wait while we set up your campaign...</p>
      )}
    </div>
  );
}
