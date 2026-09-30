"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { deleteProject, listProjects } from "../api";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "../types";

export function ProjectList({ items }: { items?: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(items || []);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  useEffect(() => {
    if (items) {
      setProjects(items);
      return;
    }
    listProjects().then(setProjects).catch(() => setProjects([]));
  }, [items]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteProject(pendingDelete.id);
    setProjects((current) => current.filter((item) => item.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <div key={project.id} className="flex items-start gap-3">
          <div className="flex-1"><ProjectCard project={project} /></div>
          <button type="button" onClick={() => setPendingDelete(project)} className="p-2 text-[var(--text-muted)] hover:text-rose-600" title="Delete project">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <ConfirmDialog open={Boolean(pendingDelete)} title="Delete project" onClose={() => setPendingDelete(null)}>
        <p className="text-sm text-[var(--text-muted)]">This project will be removed from your profile.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button type="button" variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
