"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/feedback/Alert";
import { toast } from "@/components/feedback/Toast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingState } from "@/components/common/LoadingState";
import { useApiQuery } from "@/lib/use-api-query";
import { apiQueryKey, getQueryClient } from "@/lib/query-client";
import { personaApi } from "../api";
import { isPersonalSection, sections, type SectionConfig } from "../sections";
import type { Category, Entry, Persona, Section, Value } from "../types";
import { MetadataDialog } from "./MetadataDialog";
import styles from "../persona.module.css";

function display(value: Value | undefined): string {
  return Array.isArray(value)
    ? value.join(", ")
    : value === true
      ? "Yes"
      : value === false || value == null
        ? ""
        : value;
}

function SectionForm({
  config,
  initial,
  busy,
  onSave,
  onCancel,
}: {
  config: SectionConfig;
  initial?: Record<string, Value>;
  busy: boolean;
  onSave: (value: Record<string, Value>, file?: File) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(
      config.fields.map((field) => [
        field.key,
        field.type === "checkbox"
          ? initial?.[field.key] === true
          : display(initial?.[field.key]),
      ]),
    ),
  );
  const [certificateFile, setCertificateFile] = useState<File>();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        const body = Object.fromEntries(
          config.fields.map((field) => {
            const value = draft[field.key];
            if (field.type === "checkbox") return [field.key, value === true];
            if (field.key === "end_date" && draft.is_current)
              return [field.key, null];
            const text = typeof value === "string" ? value.trim() : "";
            return [
              field.key,
              field.type === "tags"
                ? text
                    .split(",")
                    .map((part) => part.trim())
                    .filter(Boolean)
                : text || null,
            ];
          }),
        );
        if (config.id === "certificates" && initial?.file_url === body.file_url)
          delete body.file_url;
        onSave(body, certificateFile);
      }}
    >
      <fieldset disabled={busy} className={styles.fields}>
        {config.fields.map((field) => {
          const value = draft[field.key];
          const onChange = (text: string | boolean) =>
            setDraft((current) => ({ ...current, [field.key]: text }));
          if (field.type === "checkbox")
            return (
              <label
                key={field.key}
                className={`${styles.wide} flex items-center gap-2 text-sm`}
              >
                <input
                  type="checkbox"
                  checked={value === true}
                  onChange={(event) => onChange(event.target.checked)}
                />
                {field.label}
              </label>
            );
          if (field.type === "textarea")
            return (
              <div key={field.key} className={styles.wide}>
                <Textarea
                  label={field.label}
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => onChange(event.target.value)}
                  required={field.required}
                  maxLength={field.max}
                  rows={5}
                />
              </div>
            );
          return (
            <Input
              key={field.key}
              label={field.label}
              type={field.type === "tags" ? "text" : field.type || "text"}
              value={typeof value === "string" ? value : ""}
              onChange={(event) => onChange(event.target.value)}
              required={field.required}
              maxLength={field.max || 2000}
              disabled={field.key === "end_date" && draft.is_current === true}
              min={
                field.key === "end_date" && typeof draft.start_date === "string"
                  ? draft.start_date
                  : undefined
              }
            />
          );
        })}
        {config.id === "certificates" && !initial?.id && (
          <div className={styles.wide}>
            <Input
              label="Upload certificate (optional)"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              hint="PDF, PNG, JPG, or WEBP, up to 10 MB."
              onChange={(event) => setCertificateFile(event.target.files?.[0])}
            />
          </div>
        )}
      </fieldset>
      <div className={styles.formActions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button type="submit" loading={busy} loadingLabel="Saving...">
          Save details
        </Button>
      </div>
    </form>
  );
}

type Removal =
  | { type: "persona" }
  | { type: "photo" }
  | { type: "personal"; section: Section }
  | { type: "entry"; category: Category; id: string };

export function PersonaDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryResult = useApiQuery<Persona>(`/personas/${id}`, {
    initialData: getQueryClient()
      .getQueryData<Persona[]>(apiQueryKey("/personas"))
      ?.find((item) => item.id === id),
  });
  const persona = queryResult.data || null;
  const setPersona = (value: Persona) => {
    const client = getQueryClient();
    client.setQueryData(apiQueryKey(`/personas/${id}`), value);
    client.setQueryData<Persona[]>(apiQueryKey("/personas"), (items) =>
      items?.map((item) => (item.id === id ? value : item)),
    );
  };
  const [section, setSection] = useState<Section>("personal");
  const loading = queryResult.isPending;
  const loadError = persona ? "" : queryResult.error?.message || "";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [editing, setEditing] = useState<{ entry?: Entry } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [nextSection, setNextSection] = useState<Section | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mutate = async (action: () => Promise<Persona>, success: string) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      setPersona(await action());
      setEditing(null);
      setRemoval(null);
      toast.success(success);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Your changes could not be saved. Please try again.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading persona..." cards={2} />;
  if (!persona || loadError)
    return (
      <div className="page-stack">
        <Link href="/persona" className="text-link">
          Back to personas
        </Link>
        <Alert variant="error">{loadError || "Persona not found."}</Alert>
        <Button onClick={() => void queryResult.refetch()}>Retry</Button>
      </div>
    );
  const config = sections.find((item) => item.id === section)!;
  const personalSection = isPersonalSection(section);
  const entries = personalSection ? [] : persona.data[section as Category];
  const personalValues = persona.data.personal;
  const hasPersonal = config.fields.some((field) =>
    Boolean(personalValues[field.key]),
  );
  const confirmRemoval = async () => {
    if (!removal || pending.current) return;
    if (removal.type === "persona") {
      pending.current = true;
      setBusy(true);
      setError("");
      try {
        await personaApi.delete(id);
        toast.success("Persona deleted.");
        router.replace("/persona");
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to delete persona.",
        );
        setRemoval(null);
      } finally {
        pending.current = false;
        setBusy(false);
      }
    } else if (removal.type === "photo") {
      await mutate(() => personaApi.removeAvatar(id), "Photo removed.");
    } else if (removal.type === "personal") {
      const fields = sections.find(
        (item) => item.id === removal.section,
      )!.fields;
      await mutate(
        () =>
          personaApi.personal(
            id,
            Object.fromEntries(fields.map((field) => [field.key, null])),
          ),
        "Details removed.",
      );
    } else {
      await mutate(
        () => personaApi.deleteEntry(id, removal.category, removal.id),
        "Entry deleted.",
      );
    }
  };
  return (
    <div className={styles.root}>
      <Link href="/persona" className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" />
        All personas
      </Link>
      <header className={styles.detailHeading}>
        <div>
          <span className={styles.eyebrow}>PERSONA WORKSPACE</span>
          <h1>{persona.name}</h1>
          <p>
            {persona.description ||
              "A dedicated space for this version of your experience."}
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={() => setRenaming(true)}
            disabled={busy}
          >
            <Pencil size={15} />
            Edit persona
          </Button>
          <Button
            variant="ghost"
            onClick={() => setRemoval({ type: "persona" })}
            disabled={busy}
          >
            <Trash2 size={15} />
            Delete persona
          </Button>
        </div>
      </header>
      <div className={styles.workspace}>
        <aside className={styles.sidebar} aria-label="Persona categories">
          <div className={styles.sidebarSummary}>
            <div className={styles.progressLabel}>
              <span>Persona completeness</span>
              <strong>{persona.completion}%</strong>
            </div>
            <progress
              value={persona.completion}
              max={100}
              aria-label="Persona completeness"
            />
            <small>
              Based on eight core personal details and six categories. Fill only
              what is relevant to you.
            </small>
          </div>
          <nav className={styles.sectionNav}>
            {sections.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-current={section === item.id ? "true" : undefined}
                disabled={busy}
                onClick={() => {
                  if (item.id === section) return;
                  if (editing) {
                    setNextSection(item.id);
                    return;
                  }
                  setSection(item.id);
                  setError("");
                }}
              >
                <span>{item.label}</span>
                <span>
                  {isPersonalSection(item.id)
                    ? item.fields.some((field) =>
                        Boolean(personalValues[field.key]),
                      )
                      ? "✓"
                      : "—"
                    : persona.data[item.id].length}
                </span>
              </button>
            ))}
          </nav>
        </aside>
        <section
          className={styles.panel}
          aria-labelledby="persona-section-heading"
        >
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="persona-section-heading">{config.label}</h2>
              <p>{config.description}</p>
            </div>
            {!editing && (
              <Button
                variant="secondary"
                onClick={() => {
                  setError("");
                  setEditing({});
                }}
                disabled={busy}
              >
                {personalSection && hasPersonal ? (
                  <Pencil size={15} />
                ) : (
                  <Plus size={15} />
                )}
                {personalSection
                  ? hasPersonal
                    ? "Edit details"
                    : "Add details"
                  : "Add new"}
              </Button>
            )}
          </div>
          {error && (
            <div className="mb-5">
              <Alert variant="error">{error}</Alert>
            </div>
          )}
          {section === "personal" && (
            <div className={styles.photo}>
              <Avatar
                src={persona.avatar_url || undefined}
                alt={`${persona.name} photo`}
                fallback={persona.name.slice(0, 1)}
                size={76}
              />
              <div>
                <strong className="text-sm">Persona photo</strong>
                <p>
                  JPG, PNG, or WEBP, up to 5 MB. Each persona has its own photo.
                </p>
                <input
                  ref={fileRef}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Upload persona photo"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    if (
                      !["image/png", "image/jpeg", "image/webp"].includes(
                        file.type,
                      ) ||
                      file.size > 5 * 1024 * 1024
                    ) {
                      setError(
                        "Choose a JPG, PNG, or WEBP image of 5 MB or less.",
                      );
                      return;
                    }
                    void mutate(
                      () => personaApi.uploadAvatar(id, file),
                      "Persona photo updated.",
                    );
                  }}
                />
                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    onClick={() => fileRef.current?.click()}
                    loading={busy}
                    disabled={Boolean(editing)}
                    loadingLabel="Please wait..."
                  >
                    Upload photo
                  </Button>
                  {persona.avatar_url && (
                    <Button
                      variant="ghost"
                      onClick={() => setRemoval({ type: "photo" })}
                      disabled={busy || Boolean(editing)}
                    >
                      Remove photo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          {editing ? (
            <SectionForm
              key={`${section}-${editing.entry?.id || "new"}`}
              config={config}
              initial={personalSection ? personalValues : editing.entry}
              busy={busy}
              onCancel={() => {
                setEditing(null);
                setError("");
              }}
              onSave={(body, file) =>
                void mutate(
                  () =>
                    personalSection
                      ? personaApi.personal(id, body)
                      : file
                        ? personaApi.uploadCertificate(id, file, body)
                        : personaApi.saveEntry(
                            id,
                            section as Category,
                            body,
                            editing.entry?.id,
                          ),
                  "Persona details saved.",
                )
              }
            />
          ) : personalSection ? (
            hasPersonal ? (
              <article className={styles.entry}>
                <dl>
                  {config.fields
                    .filter((field) => personalValues[field.key])
                    .map((field) => (
                      <div key={field.key}>
                        <dt>{field.label}</dt>
                        <dd>{display(personalValues[field.key])}</dd>
                      </div>
                    ))}
                </dl>
                <div className={styles.formActions}>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setRemoval({ type: "personal", section })}
                  >
                    <Trash2 size={15} />
                    Remove these details
                  </Button>
                </div>
              </article>
            ) : (
              <div className={styles.empty}>
                <h3>No details yet</h3>
                <p>Add the details you want to use for {persona.name}.</p>
                <Button onClick={() => setEditing({})}>Add details</Button>
              </div>
            )
          ) : entries.length ? (
            <div className={styles.entries}>
              {entries.map((entry) => (
                <article key={entry.id} className={styles.entry}>
                  <div className={styles.entryHeading}>
                    <h3>
                      {display(entry[config.titleKey || "name"]) ||
                        "Untitled entry"}
                    </h3>
                    <div className={styles.actions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setEditing({ entry });
                          setError("");
                        }}
                        aria-label={`Edit ${display(entry[config.titleKey || "name"])}`}
                      >
                        <Pencil size={15} />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          setRemoval({
                            type: "entry",
                            category: section as Category,
                            id: entry.id,
                          })
                        }
                        aria-label={`Delete ${display(entry[config.titleKey || "name"])}`}
                      >
                        <Trash2 size={15} />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <dl>
                    {config.fields
                      .filter(
                        (field) =>
                          field.key !== config.titleKey && entry[field.key],
                      )
                      .map((field) => (
                        <div key={field.key}>
                          <dt>{field.label}</dt>
                          <dd>
                            {field.type === "url" &&
                            /^https?:\/\//i.test(String(entry[field.key])) ? (
                              <a
                                className="text-link"
                                href={String(entry[field.key])}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {display(entry[field.key])}
                              </a>
                            ) : (
                              display(entry[field.key])
                            )}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <h3>No {config.label.toLowerCase()} yet</h3>
              <p>Add your first entry to this persona.</p>
              <Button onClick={() => setEditing({})}>
                <Plus size={15} />
                Add new
              </Button>
            </div>
          )}
        </section>
      </div>
      {renaming && (
        <MetadataDialog
          initial={{ name: persona.name, description: persona.description }}
          onClose={() => setRenaming(false)}
          onSave={async (value) => {
            setPersona(await personaApi.rename(id, value));
            setRenaming(false);
          }}
        />
      )}
      <Dialog
        open={Boolean(removal)}
        title={
          removal?.type === "persona"
            ? "Delete this persona?"
            : "Remove these details?"
        }
        description={
          removal?.type === "persona"
            ? "This permanently removes the persona and its details. Existing saved resumes remain unchanged."
            : "This removes the selected information from this persona only."
        }
        onClose={() => setRemoval(null)}
        preventClose={busy}
      >
        {error && <Alert variant="error">{error}</Alert>}
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setRemoval(null)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy}
            loadingLabel="Removing..."
            onClick={() => void confirmRemoval()}
          >
            Delete
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={Boolean(nextSection)}
        title="Discard unsaved changes?"
        description="Your changes in this category have not been saved."
        onClose={() => setNextSection(null)}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setNextSection(null)}>
            Keep editing
          </Button>
          <Button
            onClick={() => {
              if (nextSection) setSection(nextSection);
              setNextSection(null);
              setEditing(null);
              setError("");
            }}
          >
            Discard changes
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
