export function isValidEducationPayload(payload: { institute_name?: string }) {
  return Boolean(payload.institute_name?.trim());
}
