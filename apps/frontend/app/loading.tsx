import { LoadingState } from "@/components/common/LoadingState";

export default function AppLoading() {
  return (
    <main className="min-h-screen bg-[var(--bg)] p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <LoadingState label="Loading page..." cards={3} />
      </div>
    </main>
  );
}
