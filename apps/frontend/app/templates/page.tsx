import { PublicHeader } from "@/components/layout/PublicHeader";
import TemplatesClient from "./TemplatesClient";
export default function TemplatesPage() {
  return (
    <div className="public-page">
      <PublicHeader />
      <main className="template-gallery-page">
        <TemplatesClient />
      </main>
      <footer className="public-footer">
        Choose a template, customize your resume, and download it as a PDF.
      </footer>
    </div>
  );
}
