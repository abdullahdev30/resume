import type React from "react";

export function Table({ className = "", ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="table-wrap">
      <table className={["table", className].filter(Boolean).join(" ")} {...props} />
    </div>
  );
}
