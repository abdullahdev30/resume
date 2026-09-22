export function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" style={{ color: "var(--status-error-text)", fontSize: "0.875rem" }}>
      {message}
    </p>
  );
}
