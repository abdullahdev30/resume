export function isValidSocialLinkPayload(payload: { platform_name?: string; profile_url?: string }) {
  return Boolean(payload.platform_name?.trim() && payload.profile_url?.trim());
}
