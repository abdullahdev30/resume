"use client";

import { ErrorState } from "@/components/common/ErrorState";

export default function EditorError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <ErrorState message="The resume editor could not be opened." onRetry={reset} />
    </div>
  );
}
