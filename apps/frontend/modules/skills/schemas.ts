export function isValidSkillPayload(payload: { name?: string }) {
  return Boolean(payload.name?.trim());
}
