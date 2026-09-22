import type { PersonalInfo } from "../types";

export function ProfileCard({ personal }: { personal: PersonalInfo }) {
  return (
    <article className="work-surface">
      <h2>{personal.first_name} {personal.last_name}</h2>
      <p>{personal.email}</p>
    </article>
  );
}
