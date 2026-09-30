"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { deleteExperience, listExperiences } from "../api";
import { ExperienceCard } from "./ExperienceCard";
import type { Experience } from "../types";

export function ExperienceList({ items }: { items?: Experience[] }) {
  const [experiences, setExperiences] = useState<Experience[]>(items || []);
  const [pendingDelete, setPendingDelete] = useState<Experience | null>(null);

  useEffect(() => {
    if (items) {
      setExperiences(items);
      return;
    }
    listExperiences().then(setExperiences).catch(() => setExperiences([]));
  }, [items]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteExperience(pendingDelete.id);
    setExperiences((current) => current.filter((item) => item.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  return (
    <div className="space-y-3">
      {experiences.map((experience) => (
        <div key={experience.id} className="flex items-start gap-3">
          <div className="flex-1"><ExperienceCard experience={experience} /></div>
          <button type="button" onClick={() => setPendingDelete(experience)} className="p-2 text-[var(--text-muted)] hover:text-rose-600" title="Delete experience">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <ConfirmDialog open={Boolean(pendingDelete)} title="Delete experience" onClose={() => setPendingDelete(null)}>
        <p className="text-sm text-[var(--text-muted)]">This experience entry will be removed from your profile.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button type="button" variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
