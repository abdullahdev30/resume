"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { deleteEducation, listEducations } from "../api";
import { EducationCard } from "./EducationCard";
import type { Education } from "../types";

export function EducationList({ items }: { items?: Education[] }) {
  const [educations, setEducations] = useState<Education[]>(items || []);
  const [pendingDelete, setPendingDelete] = useState<Education | null>(null);

  useEffect(() => {
    if (items) {
      setEducations(items);
      return;
    }
    listEducations().then(setEducations).catch(() => setEducations([]));
  }, [items]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteEducation(pendingDelete.id);
    setEducations((current) => current.filter((item) => item.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  return (
    <div className="space-y-3">
      {educations.map((education) => (
        <div key={education.id} className="flex items-start gap-3">
          <div className="flex-1"><EducationCard education={education} /></div>
          <button type="button" onClick={() => setPendingDelete(education)} className="p-2 text-[var(--text-muted)] hover:text-rose-600" title="Delete education">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <ConfirmDialog open={Boolean(pendingDelete)} title="Delete education" onClose={() => setPendingDelete(null)}>
        <p className="text-sm text-[var(--text-muted)]">This education entry will be removed from your profile.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button type="button" variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
