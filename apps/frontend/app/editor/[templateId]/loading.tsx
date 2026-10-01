import { LoadingState } from "@/components/common/LoadingState";

export default function EditorLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <LoadingState label="Loading resume editor..." cards={2} />
    </div>
  );
}
