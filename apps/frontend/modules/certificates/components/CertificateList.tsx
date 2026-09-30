"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { deleteCertificate, listCertificates } from "../api";
import { CertificateCard } from "./CertificateCard";
import type { Certificate } from "../types";

export function CertificateList({ items }: { items?: Certificate[] }) {
  const [certificates, setCertificates] = useState<Certificate[]>(items || []);
  const [pendingDelete, setPendingDelete] = useState<Certificate | null>(null);

  useEffect(() => {
    if (items) {
      setCertificates(items);
      return;
    }
    listCertificates().then(setCertificates).catch(() => setCertificates([]));
  }, [items]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteCertificate(pendingDelete.id);
    setCertificates((current) => current.filter((item) => item.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  return (
    <div className="space-y-3">
      {certificates.map((certificate) => (
        <div key={certificate.id} className="flex items-start gap-3">
          <div className="flex-1"><CertificateCard certificate={certificate} /></div>
          <button type="button" onClick={() => setPendingDelete(certificate)} className="p-2 text-[var(--text-muted)] hover:text-rose-600" title="Delete certificate">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <ConfirmDialog open={Boolean(pendingDelete)} title="Delete certificate" onClose={() => setPendingDelete(null)}>
        <p className="text-sm text-[var(--text-muted)]">This certificate will be removed from your profile.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button type="button" variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
