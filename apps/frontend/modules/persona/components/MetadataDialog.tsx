"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/feedback/Alert";
import type { Metadata } from "../types";

export function MetadataDialog({
  initial,
  onClose,
  onSave,
}: {
  initial?: Metadata;
  onClose: () => void;
  onSave: (value: Metadata) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [useAccountProfile, setUseAccountProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog
      open
      title={initial ? "Edit persona" : "Create a persona"}
      description="Give this persona a name that makes it easy to recognize."
      onClose={onClose}
      preventClose={busy}
    >
      <form
        className="form-stack"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || !name.trim()) return;
          setBusy(true);
          setError("");
          try {
            await onSave({
              name: name.trim(),
              description: description.trim(),
              ...(!initial ? { use_account_profile: useAccountProfile } : {}),
            });
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Unable to save persona.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {error && <Alert variant="error">{error}</Alert>}
        <Input
          label="Persona name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          autoFocus
          maxLength={100}
          placeholder="For example, Software engineer"
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="What is this persona for?"
        />
        {!initial && (
          <fieldset className="form-stack rounded-lg border border-[var(--border)] p-4">
            <legend className="px-1 text-sm font-bold">Starting details</legend>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="radio"
                name="persona-start"
                checked={!useAccountProfile}
                onChange={() => setUseAccountProfile(false)}
              />
              <span>
                Start with empty details
                <span className="mt-1 block text-xs text-[var(--text-muted)]">
                  Enter a different name, email, and phone for this persona.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="radio"
                name="persona-start"
                checked={useAccountProfile}
                onChange={() => setUseAccountProfile(true)}
              />
              <span>
                Use my account details
                <span className="mt-1 block text-xs text-[var(--text-muted)]">
                  Copy your account name, email, and phone once. You can change
                  them here without changing your account.
                </span>
              </span>
            </label>
          </fieldset>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={busy}
            loadingLabel="Saving..."
            disabled={!name.trim()}
          >
            {initial ? "Save changes" : "Create persona"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
