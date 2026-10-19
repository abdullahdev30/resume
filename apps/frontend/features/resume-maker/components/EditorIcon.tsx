const paths: Record<string, React.ReactNode> = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  undo: (
    <>
      <path d="m8 5-5 5 5 5M3 10h11a6 6 0 0 1 0 12" />
    </>
  ),
  redo: (
    <>
      <path d="m16 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12" />
    </>
  ),
  print: (
    <>
      <path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v8H6z" />
      <path d="M17 12h1" />
    </>
  ),
  paint: (
    <>
      <path d="M6 3h12v6H6zM18 6h3v7h-9v3M10 16h4v6h-4z" />
    </>
  ),
  document: (
    <>
      <path d="M5 2h10l5 5v15H5z" />
      <path d="M15 2v6h5M8 12h9M8 16h9M8 19h6" />
    </>
  ),
  cloud: (
    <>
      <path d="M7 18a5 5 0 1 1 0-10 6 6 0 0 1 11-2 6 6 0 0 1 0 12Z" />
      <path d="m9 12 3 3 5-6" />
    </>
  ),
  back: <path d="m13 5-7 7 7 7M6 12h15" />,
  link: (
    <>
      <path d="M9 7H7a5 5 0 0 0 0 10h2m6-10h2a5 5 0 0 1 0 10h-2M8 12h8" />
    </>
  ),
  more: (
    <>
      <circle cx="12" cy="4" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="20" r="1" />
    </>
  ),
  chevron: <path d="m6 14 6-6 6 6" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="12" rx="2" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4m-4 6v2" />
    </>
  ),
};
export default function EditorIcon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.document}
    </svg>
  );
}
