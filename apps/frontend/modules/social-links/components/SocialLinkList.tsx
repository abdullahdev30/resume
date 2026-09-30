"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { deleteSocialLink, listSocialLinks } from "../api";
import { SocialLinkCard } from "./SocialLinkCard";
import type { SocialLink } from "../types";

export function SocialLinkList({ items }: { items?: SocialLink[] }) {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(items || []);
  const [pendingDelete, setPendingDelete] = useState<SocialLink | null>(null);

  useEffect(() => {
    if (items) {
      setSocialLinks(items);
      return;
    }
    listSocialLinks().then(setSocialLinks).catch(() => setSocialLinks([]));
  }, [items]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteSocialLink(pendingDelete.id);
    setSocialLinks((current) => current.filter((item) => item.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  return (
    <div className="space-y-2">
      {socialLinks.map((socialLink) => (
        <div key={socialLink.id} className="flex items-center gap-2">
          <SocialLinkCard socialLink={socialLink} />
          <button type="button" onClick={() => setPendingDelete(socialLink)} className="p-1 text-[var(--text-muted)] hover:text-rose-600" title="Delete social link">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <ConfirmDialog open={Boolean(pendingDelete)} title="Delete social link" onClose={() => setPendingDelete(null)}>
        <p className="text-sm text-[var(--text-muted)]">This social link will be removed from your profile.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button type="button" variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
