export function isValidProjectPayload(payload: { name?: string; description?: string }) {
  return Boolean(payload.name?.trim() && payload.description?.trim());
}
