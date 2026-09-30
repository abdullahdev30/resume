"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { deleteSkill, listSkills } from "../api";
import { SkillCard } from "./SkillCard";
import type { Skill } from "../types";

export function SkillList({ items }: { items?: Skill[] }) {
  const [skills, setSkills] = useState<Skill[]>(items || []);
  const [pendingDelete, setPendingDelete] = useState<Skill | null>(null);

  useEffect(() => {
    if (items) {
      setSkills(items);
      return;
    }
    listSkills().then(setSkills).catch(() => setSkills([]));
  }, [items]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteSkill(pendingDelete.id);
    setSkills((current) => current.filter((item) => item.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span key={skill.id} className="inline-flex items-center gap-1">
          <SkillCard skill={skill} />
          <button type="button" onClick={() => setPendingDelete(skill)} className="p-1 text-[var(--text-muted)] hover:text-rose-600" title="Delete skill">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}
      <ConfirmDialog open={Boolean(pendingDelete)} title="Delete skill" onClose={() => setPendingDelete(null)}>
        <p className="text-sm text-[var(--text-muted)]">This skill will be removed from your profile.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button type="button" variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
