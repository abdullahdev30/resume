import Link from "next/link";

import { BrandLogo } from "@/components/common/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function PublicHeader() {
  return (
    <header className="public-header no-print">
      <div className="public-header-inner">
        <Link href="/" className="public-brand" aria-label="Resume Builder home">
          <BrandLogo className="public-brand-logo" priority />
          <span>Resume Builder</span>
        </Link>

        <nav className="public-nav" aria-label="Public navigation">
          <Link href="/templates" className="public-nav-link">Templates</Link>
          <ThemeToggle />
          <Link href="/auth/login" className="button button-secondary button-sm">Log in</Link>
          <Link href="/auth/register" className="button button-primary button-sm">Sign up</Link>
        </nav>
      </div>
    </header>
  );
}
