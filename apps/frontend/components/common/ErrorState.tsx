import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "../ui/Button";

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <section className="state-panel" role="alert">
      <div className="state-panel-inner">
        <div className="state-icon"><CircleAlert size={22} aria-hidden="true" /></div>
        <h2>{title}</h2>
        <p>{message}</p>
        {onRetry && (
          <Button type="button" variant="secondary" onClick={onRetry}>
            <RotateCcw size={16} aria-hidden="true" />
            Retry
          </Button>
        )}
      </div>
    </section>
  );
}
