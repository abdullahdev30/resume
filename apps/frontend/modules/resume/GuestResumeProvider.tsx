"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  ResumeRecord,
  ResumeUpdatePayload,
  TemplateResumePayload,
} from "./types";

interface GuestResumeContextValue {
  resumes: ResumeRecord[];
  createResume: (payload: TemplateResumePayload) => ResumeRecord;
  getResume: (id: string) => ResumeRecord | null;
  updateResume: (id: string, payload: ResumeUpdatePayload) => ResumeRecord | null;
  removeResume: (id: string) => boolean;
}

const GuestResumeContext = createContext<GuestResumeContextValue | null>(null);

export function GuestResumeProvider({ children }: { children: ReactNode }) {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const resumesRef = useRef(resumes);
  resumesRef.current = resumes;

  const createResume = useCallback((payload: TemplateResumePayload) => {
    const now = new Date().toISOString();
    const resume: ResumeRecord = {
      id: `guest-${crypto.randomUUID()}`,
      title: payload.title,
      resume_type: "template",
      editable: true,
      template_id: payload.template_id,
      resume_data: structuredClone(payload.resume_data),
      created_at: now,
      updated_at: now,
      source_version: 1,
    };
    const next = [resume, ...resumesRef.current];
    resumesRef.current = next;
    setResumes(next);
    return resume;
  }, []);

  const getResume = useCallback(
    (id: string) => resumesRef.current.find((resume) => resume.id === id) || null,
    [],
  );

  const updateResume = useCallback((id: string, payload: ResumeUpdatePayload) => {
    const currentResume = resumesRef.current.find((resume) => resume.id === id);
    if (!currentResume) return null;
    const updated: ResumeRecord = {
      ...currentResume,
      ...payload,
      resume_data: payload.resume_data
        ? structuredClone(payload.resume_data)
        : currentResume.resume_data,
      updated_at: new Date().toISOString(),
      source_version: currentResume.source_version + 1,
    };
    const next = resumesRef.current.map((resume) => resume.id === id ? updated : resume);
    resumesRef.current = next;
    setResumes(next);
    return updated;
  }, []);

  const removeResume = useCallback((id: string) => {
    const removed = resumesRef.current.some((resume) => resume.id === id);
    if (!removed) return false;
    const next = resumesRef.current.filter((resume) => resume.id !== id);
    resumesRef.current = next;
    setResumes(next);
    return removed;
  }, []);

  const value = useMemo<GuestResumeContextValue>(() => ({
    resumes,
    createResume,
    getResume,
    updateResume,
    removeResume,
  }), [createResume, getResume, removeResume, resumes, updateResume]);

  return (
    <GuestResumeContext.Provider value={value}>
      {children}
    </GuestResumeContext.Provider>
  );
}

export function useGuestResumes() {
  const context = useContext(GuestResumeContext);
  if (!context) {
    throw new Error("useGuestResumes must be used within GuestResumeProvider.");
  }
  return context;
}
