import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-xl">
        <EmptyState
          title="Page not found"
          description="The page may have moved, or the link may no longer be available."
          action={<Link href="/dashboard" className="button button-primary">Back to dashboard</Link>}
        />
      </div>
    </main>
  );
}
