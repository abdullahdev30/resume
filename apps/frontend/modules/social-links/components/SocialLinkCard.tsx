import type { SocialLink } from "../types";

export function SocialLinkCard({ socialLink }: { socialLink: SocialLink }) {
  return <a href={socialLink.profile_url}>{socialLink.platform_name}</a>;
}
