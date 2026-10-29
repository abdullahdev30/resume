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
        Your data stays in your browser tab and is never uploaded.
      </footer>
    </div>
  );
}
