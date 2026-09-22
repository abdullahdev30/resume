export function hasRequiredProfileFields(profile: {
  first_name?: string;
  last_name?: string;
  email?: string;
}) {
  return Boolean(profile.first_name && profile.last_name && profile.email);
}
