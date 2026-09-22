import type { Education } from "../types";

export function EducationCard({ education }: { education: Education }) {
  return <article className="work-surface"><h3>{education.institute_name}</h3><p>{education.field_of_study}</p></article>;
}
