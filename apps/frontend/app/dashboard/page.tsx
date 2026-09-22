import Link from "next/link";

import { requireCurrentUser } from "../../modules/auth/server";
import { AppShell } from "../../modules/layout/AppShell";
import { OnboardingGate } from "../../modules/onboarding/OnboardingGate";

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <OnboardingGate userId={user.id} />
      <section className="dashboard-grid">
        <div className="work-surface resume-start">
          <div>
            <p className="eyebrow">Next step</p>
            <h2>Create your resume</h2>
            <p>
              Start from your saved profile information and build a polished
              resume.
            </p>
          </div>
          <Link href="/onboarding" className="primary-link-button">
            Create Resume
          </Link>
        </div>

        <div className="work-surface">
          <div className="section-heading">
            <p className="eyebrow">Account</p>
            <h2>{user.name || "Welcome"}</h2>
            <p>{user.email}</p>
          </div>
          <div className="status-list">
            <span
              className={
                user.email_verified
                  ? "status-tag is-success"
                  : "status-tag is-warning"
              }
            >
              {user.email_verified ? "Email verified" : "Email pending"}
            </span>
          </div>
        </div>

        <div className="work-surface">
          <div className="section-heading">
            <p className="eyebrow">Profile</p>
            <h2>Keep your details ready</h2>
            <p>
              Update personal information from settings before generating your
              resume.
            </p>
          </div>
          <Link href="/settings" className="secondary-link-button">
            Edit profile
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
