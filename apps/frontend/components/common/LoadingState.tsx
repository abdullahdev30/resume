import { Skeleton } from "../ui/Skeleton";

export function LoadingState({
  label = "Loading...",
  cards = 3,
}: {
  label?: string;
  cards?: number;
}) {
  return (
    <div role="status" aria-label={label} className="grid gap-4">
      <span className="sr-only">{label}</span>
      <div className="card card-padding-md grid gap-3">
        <Skeleton style={{ width: "32%", height: "1rem" }} />
        <Skeleton style={{ width: "58%", height: "2rem" }} />
        <Skeleton style={{ width: "76%", height: "0.8rem" }} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="card card-padding-md grid gap-3">
            <Skeleton style={{ height: "7rem" }} />
            <Skeleton style={{ width: "70%" }} />
            <Skeleton style={{ width: "45%", height: "0.75rem" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
