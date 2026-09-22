export function isValidExperiencePayload(payload: { institute_name?: string; job_title?: string }) {
  return Boolean(payload.institute_name?.trim() && payload.job_title?.trim());
}
