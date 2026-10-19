"use client";
import dynamic from "next/dynamic";
const ResumeMakerApp = dynamic(() => import("./main"), {
  ssr: false,
  loading: () => (
    <div className="resume-maker-app" role="status" style={{ padding: 32 }}>
      Loading resume maker…
    </div>
  ),
});
export default function ResumeMaker({
  screen = "dashboard",
}: {
  screen?: "dashboard" | "editor";
}) {
  return <ResumeMakerApp screen={screen} />;
}
