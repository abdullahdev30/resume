"use client";

import { ErrorState } from "@/components/common/ErrorState";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-xl">
        <ErrorState
          title="This page did not load"
          message="Your data has not been changed. Try loading the page again."
          onRetry={reset}
        />
      </div>
    </main>
  );
}
