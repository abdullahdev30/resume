import type { Certificate } from "../types";

export function CertificateCard({ certificate }: { certificate: Certificate }) {
  return <article className="work-surface"><h3>{certificate.title}</h3><p>{certificate.category || certificate.field}</p></article>;
}
