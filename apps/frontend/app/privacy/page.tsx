import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import styles from "@/features/marketing/LandingPage.module.css";
export const metadata = { title: "Privacy | Resume Builder" };
export default function PrivacyPage() {
  return (
    <div className={`${styles.page} marketing-page`}>
      <PublicHeader />
      <main className={`${styles.section} ${styles.privacy}`}>
        <span className={styles.eyebrow}>Your information</span>
        <h1>Privacy, in plain language.</h1>
        <h2>The free editor</h2>
        <p>
          Your free resume draft is stored in your browser’s session storage for
          the current tab. It is not uploaded to our resume service. Refreshing
          restores the draft; closing the tab normally ends that session.
          Download a PDF to keep a permanent copy. Use Clear data in the editor
          to remove the draft sooner.
        </p>
        <h2>Your account workspace</h2>
        <p>
          When you register, authentication is handled by our authentication
          provider. Account personas, saved resumes, uploaded files, and
          subscription information are stored by the service so you can return
          to your work. Authentication uses session cookies. The free editor’s
          tab-only storage policy does not apply to account data.
        </p>
        <h2>AI features</h2>
        <p>
          When you choose an AI feature in your account, the information used
          for that request is processed by the configured AI service to generate
          or revise your resume. Only use these features with information you
          want processed for that purpose.
        </p>
        <h2>Packages and payments</h2>
        <p>
          We store your selected package, persona allowance, and subscription
          dates. Payment collection is not enabled, and the app does not ask for
          card details.
        </p>
        <h2>Managing your information</h2>
        <p>
          You can remove individual personas and saved resumes from your
          account. Contact your service administrator for questions about
          account access, stored information, or other account requests.
        </p>
        <Link href="/">Back to home</Link>
      </main>
    </div>
  );
}
