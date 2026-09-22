import { SocialLinkCard } from "./SocialLinkCard";
import type { SocialLink } from "../types";

export function SocialLinkList({ items }: { items: SocialLink[] }) {
  return <div>{items.map((socialLink) => <SocialLinkCard key={socialLink.id} socialLink={socialLink} />)}</div>;
}
