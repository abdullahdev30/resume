"use client";

import type React from "react";
import { useState } from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt: string;
  fallback?: string;
  size?: number;
}

export function Avatar({ src, alt, fallback, size = 36, className = "", ...props }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src && src !== failedSrc);

  return (
    <span
      className={["avatar", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.34) }}
      {...props}
    >
      {showImage ? (
        <img
          src={src || undefined}
          alt={alt}
          onError={() => setFailedSrc(src || null)}
        />
      ) : (
        <span aria-hidden="true">{fallback || alt.slice(0, 1).toUpperCase()}</span>
      )}
      {!showImage && <span className="sr-only">{alt}</span>}
    </span>
  );
}
