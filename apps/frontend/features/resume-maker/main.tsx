import React, { lazy, Suspense } from "react";
import { useResume } from "./store/resume";
import "./styles.css";
import "./editor-light.css";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Editor = lazy(() => import("./pages/Editor"));
export function Skeleton() {
  return (
    <main className="shell" aria-label="Loading resume maker" aria-busy="true">
      <div className="skeleton title-skeleton" />
      <div className="gallery">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="skeleton card-skeleton" key={i} />
        ))}
      </div>
    </main>
  );
}
function App({ screen }: { screen: "dashboard" | "editor" }) {
  const hydrated = useResume((s) => s.hydrated);
  const warning = useResume((s) => s.warning);
  React.useEffect(() => {
    if (!useResume.getState().hydrated) void useResume.persist.rehydrate();
  }, []);
  if (!hydrated) return <Skeleton />;
  return (
    <>
      <Suspense fallback={<Skeleton />}>
        {screen === "editor" ? <Editor /> : <Dashboard />}
      </Suspense>
      {warning && (
        <div className="storage-warning" role="status">
          {warning}
        </div>
      )}
    </>
  );
}
export default function ResumeMakerApp({
  screen,
}: {
  screen: "dashboard" | "editor";
}) {
  return (
    <div className="resume-maker-app">
      <App screen={screen} />
    </div>
  );
}
