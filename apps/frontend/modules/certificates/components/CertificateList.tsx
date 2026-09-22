import { CertificateCard } from "./CertificateCard";
import type { Certificate } from "../types";

export function CertificateList({ items }: { items: Certificate[] }) {
  return <div>{items.map((certificate) => <CertificateCard key={certificate.id} certificate={certificate} />)}</div>;
}
