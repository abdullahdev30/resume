"use client";
import { useState } from "react";
import TemplatesClient from "@/app/templates/TemplatesClient";
import { useApiQuery } from "@/lib/use-api-query";
import type { User } from "@/modules/auth/types";
import type { Persona } from "@/modules/persona/types";
import type { ProfileResponse } from "@/modules/profile/types";
import {
  templateCatalog,
  type TemplateItem,
} from "@/components/templates/catalog";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/feedback/Alert";
import { blankResume, normalizeResume } from "../editorDocument";
import {
  profileToResumeData,
  withProfileAvatarSnapshot,
} from "../profileSnapshot";
import { personaApi } from "@/modules/persona/api";
import { EditorDocument } from "./AccountResumeEditor";
import type { ResumeRecord } from "../types";
export function AccountTemplatePicker({
  user,
  initialPersonaId = "",
  initialTemplateId = "",
}: {
  user: User;
  initialPersonaId?: string;
  initialTemplateId?: string;
}) {
  const [template, setTemplate] = useState<TemplateItem | null>(
    () => templateCatalog.find((item) => item.id === initialTemplateId) || null,
  );
  const personas = useApiQuery<Persona[]>("/personas", {
    enabled: Boolean(template),
  });
  const [personaId, setPersonaId] = useState(initialPersonaId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ResumeRecord | null>(null);
  const begin = async (manual: boolean) => {
    if (!template || busy) return;
    setBusy(true);
    setError("");
    try {
      let data = blankResume(template);
      if (!manual) {
        const selected = await personaApi.get(personaId);
        let profile = selected.data as unknown as ProfileResponse;
        if (profile.personal.avatar_url) {
          const snapshot = await personaApi.avatarSnapshot(personaId);
          profile = {
            ...profile,
            personal: { ...profile.personal, avatar_url: snapshot.data_url },
          };
        }
        profile = await withProfileAvatarSnapshot(profile);
        data = normalizeResume({
          ...data,
          ...profileToResumeData(profile),
          primaryColor: template.data.primaryColor,
          secondaryColor: template.data.secondaryColor,
          fontFamily: template.data.fontFamily,
        });
      }
      setDraft({
        id: "",
        title: `${user.name || "My"} Resume`,
        resume_type: "template",
        editable: true,
        template_id: template.id,
        resume_data: data,
        source_version: 1,
        created_at: "",
        updated_at: "",
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load the persona. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (draft) return <EditorDocument record={draft} />;
  return (
    <>
      <TemplatesClient onSelect={setTemplate} />
      <Dialog
        open={Boolean(template)}
        onClose={() => setTemplate(null)}
        title={`Start with ${template?.name || "template"}`}
      >
        <p>Choose how to fill your selected template.</p>
        {error && <Alert variant="error">{error}</Alert>}
        <Button onClick={() => void begin(true)} disabled={busy}>
          Enter information manually
        </Button>
        <label className="form-stack">
          Use existing persona
          <select
            className="field-control"
            value={personaId}
            onChange={(event) => setPersonaId(event.target.value)}
          >
            <option value="">Choose a persona</option>
            {personas.data?.map((persona) => (
              <option value={persona.id} key={persona.id}>
                {persona.name}
              </option>
            ))}
          </select>
        </label>
        {personas.error && (
          <Alert variant="error">
            {personas.error.message}
            <Button onClick={() => void personas.refetch()}>Retry</Button>
          </Alert>
        )}
        <Button
          onClick={() => void begin(false)}
          disabled={!personaId || busy}
          loading={busy}
        >
          Use this persona
        </Button>
      </Dialog>
    </>
  );
}
