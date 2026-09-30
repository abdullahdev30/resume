import type React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt: string;
  fallback?: string;
  size?: number;
}

export function Avatar({ src, alt, fallback, size = 36, className = "", ...props }: AvatarProps) {
  return (
    <span
      className={["avatar", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.34) }}
      {...props}
    >
      {src ? <img src={src} alt={alt} /> : <span aria-hidden="true">{fallback || alt.slice(0, 1).toUpperCase()}</span>}
      {!src && <span className="sr-only">{alt}</span>}
    </span>
  );
}
