"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { resumeApi } from "../api";

export function ResumeEditRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = useState("Opening editor...");

  useEffect(() => {
    resumeApi
      .get(params.id)
      .then((resume) => {
        if (!resume.editable) {
          setMessage("This legacy PDF is view/download only.");
          router.replace(`/resumes/${resume.id}`);
          return;
        }
        router.replace(`/editor/${resume.template_id || "1"}?resumeId=${resume.id}`);
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Unable to open editor.");
      });
  }, [params.id, router]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--text-muted)]">
      {message}
    </div>
  );
}
