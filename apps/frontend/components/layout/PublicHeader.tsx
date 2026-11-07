import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import styles from "./PublicHeader.module.css";

export function PublicHeader() {
  return (
    <header className={`${styles.header} no-print`}>
      <div className={styles.inner}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="Resume Builder home"
        >
          <BrandLogo priority />
          <span>Resume Builder</span>
        </Link>
        <nav className={styles.sections} aria-label="Landing page sections">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#comments">Comments</Link>
          <Link href="/#faq">FAQs</Link>
        </nav>
        <nav className={styles.account} aria-label="Account navigation">
          <Link href="/auth/login" className={styles.login}>
            Log in
          </Link>
          <Link href="/auth/register" className={styles.signup}>
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
