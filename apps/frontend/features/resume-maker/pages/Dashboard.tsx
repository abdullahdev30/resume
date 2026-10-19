import { useState } from "react";
import { useNavigate } from "../utils/navigation";
import { useResume } from "../store/resume";
import { templates, presets, type Template } from "../templates/catalog";
import Thumbnail from "../components/Thumbnail";
import Modal from "../components/Modal";
export default function Dashboard() {
  const [filter, setFilter] = useState("All");
  const [preview, setPreview] = useState<Template | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const [size, setSize] = useState("A4");
  const exists = useResume((s) => s.exists);
  const title = useResume((s) => s.title);
  const selected = useResume((s) => s.template);
  const navigate = useNavigate();
  function start(id: string, blank = false) {
    const s = useResume.getState();
    s.start(id, blank);
    s.update({
      page: {
        ...s.page,
        preset: size,
        width: presets[size]![0],
        height: presets[size]![1],
      },
    });
    navigate("/editor");
  }
  return (
    <>
      <header className="app-header">
        <a href="/builder" className="brand">
          Resume Maker<span>THE ESSENTIALS, WELL WRITTEN.</span>
        </a>
        <button className="text-button" onClick={() => setPrivacy(true)}>
          Privacy
        </button>
      </header>
      <main className="shell">
        <div className="page-intro">
          <p className="eyebrow">A GOOD FIRST IMPRESSION STARTS HERE</p>
          <h1>Create your resume</h1>
          <p>
            Choose a template to get started. You can customize everything in
            the editor.
          </p>
        </div>
        {exists && (
          <section className="continue-card">
            <div className="continue-thumb">
              <Thumbnail template={templates.find((t) => t.id === selected)!} />
            </div>
            <div>
              <span className="eyebrow">CONTINUE EDITING</span>
              <h2>{title}</h2>
              <p>
                {templates.find((t) => t.id === selected)?.name} template · Kept
                in this tab
              </p>
            </div>
            <button className="primary" onClick={() => navigate("/editor")}>
              Continue <span aria-hidden="true">→</span>
            </button>
          </section>
        )}
        <div className="gallery-controls">
          <div role="tablist" aria-label="Template categories">
            {["All", "Single column", "Two column", "Compact"].map((f) => (
              <button
                role="tab"
                aria-selected={filter === f}
                key={f}
                className={filter === f ? "active" : ""}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <label>
            Page size{" "}
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              {Object.keys(presets).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="gallery">
          <article className="template-card blank-card">
            <button
              className="blank-page"
              onClick={() => start("classic", true)}
              aria-label="Start a blank resume"
            >
              <span>+</span>
              <strong>A fresh start</strong>
              <small>Make it your own.</small>
            </button>
            <div className="card-caption">
              <h2>Blank resume</h2>
              <p>Start with a clean page</p>
            </div>
          </article>
          {templates
            .filter((t) => filter === "All" || t.category === filter)
            .map((t) => (
              <article className="template-card" key={t.id}>
                <div
                  className="template-image"
                  role="button"
                  tabIndex={0}
                  aria-label={`Use ${t.name} template`}
                  onClick={() => start(t.id)}
                  onKeyDown={(e) => {
                    if (
                      e.target === e.currentTarget &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      e.preventDefault();
                      start(t.id);
                    }
                  }}
                >
                  <Thumbnail template={t} />
                  <div className="card-actions">
                    <button
                      className="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        start(t.id);
                      }}
                    >
                      Use this template
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreview(t);
                      }}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                <div className="card-caption">
                  <h2>{t.name}</h2>
                  <p>{t.tag}</p>
                </div>
              </article>
            ))}
        </div>
        <aside className="gallery-note">
          <strong>Your experience. Your words. Your next chapter.</strong>
          <span>Every template is free and fully customizable.</span>
        </aside>
      </main>
      <footer className="footer">
        Your data stays in your browser tab and is never uploaded.
      </footer>
      {privacy && (
        <Modal title="Your privacy" onClose={() => setPrivacy(false)}>
          <p>
            Your resume is stored only in this browser tab’s sessionStorage. It
            survives refreshes and is deleted when the tab’s session ends. Some
            browsers can restore a session when reopening closed tabs or
            windows.
          </p>
          <p>
            Resume content is never uploaded. We use no accounts, cookies,
            analytics, or database. Download a PDF to keep your work
            permanently.
          </p>
          <button className="primary" onClick={() => setPrivacy(false)}>
            Got it
          </button>
        </Modal>
      )}
      {preview && (
        <Modal
          title={`${preview.name} preview`}
          onClose={() => setPreview(null)}
          wide
        >
          <div className="large-preview">
            <Thumbnail template={preview} />
          </div>
          <div className="dialog-actions">
            <button onClick={() => setPreview(null)}>Back</button>
            <button className="primary" onClick={() => start(preview.id)}>
              Use this template
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
