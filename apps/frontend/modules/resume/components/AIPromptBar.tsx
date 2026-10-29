"use client";

import { ArrowUp, LoaderCircle } from "lucide-react";
import styles from "./AIPromptBar.module.css";

export function AIPromptBar({
  instruction,
  onChange,
  onSubmit,
  onOptions,
  busy,
  disabled,
  error,
  proposalReady,
}: {
  instruction: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onOptions: () => void;
  busy: boolean;
  disabled: boolean;
  error: string;
  proposalReady: boolean;
}) {
  const canSend = !disabled && !busy && Boolean(instruction.trim());
  return (
    <section
      className={`${styles.wrapper} no-print`}
      aria-label="AI resume assistant"
      data-active={busy || Boolean(error) || proposalReady}
    >
      <form
        className={styles.bar}
        onSubmit={(event) => {
          event.preventDefault();
          if (canSend) onSubmit();
        }}
      >
        <textarea
          rows={1}
          maxLength={5000}
          value={instruction}
          disabled={busy}
          aria-label="AI instruction"
          placeholder="Ask AI to improve your resume..."
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              if (canSend) onSubmit();
            }
          }}
        />
        <button
          type="submit"
          className={styles.send}
          aria-label={busy ? "Creating AI proposal" : "Send AI prompt"}
          disabled={!canSend}
        >
          {busy ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <ArrowUp size={20} />
          )}
        </button>
      </form>
      <div className={styles.status} aria-live="polite">
        {error ? (
          <span role="alert">{error}</span>
        ) : busy ? (
          "Creating your proposal..."
        ) : proposalReady ? (
          <button type="button" onClick={onOptions}>
            Review AI proposal
          </button>
        ) : null}
      </div>
    </section>
  );
}
