import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className = "", priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/resume_logo.png"
      alt=""
      width={48}
      height={48}
      priority={priority}
      className={["brand-logo", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}
