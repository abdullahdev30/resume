import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  ShieldCheck,
  Download,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { BrandLogo } from "@/components/common/BrandLogo";
import { LandingPricing } from "./LandingPricing";
import styles from "./LandingPage.module.css";

const steps = [
  {
    title: "Start with a template",
    copy: "Open the free builder and choose a clear, professional starting point.",
  },
  {
    title: "Make it your own",
    copy: "Add your experience, education, and skills. Adjust the font, spacing, and page layout.",
  },
  {
    title: "Review and download",
    copy: "Check every detail, then download your resume as a PDF, ready for your next application.",
  },
  {
    title: "Keep building with personas",
    copy: "For an account workspace, sign up and choose a package. Reuse your personas for different roles.",
  },
];
const faqs = [
  [
    "Can I create a resume without an account?",
    "Yes. Choose Create a resume to open the free editor. Your draft stays in this browser tab. Download your PDF before closing the tab to keep your work.",
  ],
  [
    "What is a persona?",
    "A persona is a reusable set of career details in your account. You can create different personas for different roles and use them as the starting point for new resumes.",
  ],
  [
    "Do I need to pay to subscribe right now?",
    "Free packages do not require payment. Paid packages can be purchased monthly or yearly through Safepay, and access begins after payment is verified.",
  ],
  [
    "How long does a package last?",
    "Packages last for the billing period shown on the package: one month or one year. They do not renew automatically. Renew after your package expires to continue creating and editing in your account.",
  ],
  [
    "Can I change my package?",
    "Yes. Choose another available package from your account. A new monthly or yearly term starts after payment is verified. You must remove extra personas before switching to a package with a lower limit than your current persona count.",
  ],
  [
    "Where is my information stored?",
    "Free-editor drafts stay in session storage for the current tab. Account personas, saved resumes, and subscription information are stored by the service. See our privacy page for more detail.",
  ],
];

export default function HomePage() {
  return (
    <div className={`${styles.page} marketing-page`}>
      <PublicHeader />
      <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <span className={styles.eyebrow}>
            Your experience. Clearly presented.
          </span>
          <h1 id="hero-title">
            A better resume.
            <br />
            <span>A confident next step.</span>
          </h1>
          <p>
            Turn your experience into a resume you’re ready to send. Start free,
            make it your own, and download a polished PDF.
          </p>
          <div className={styles.actions}>
            <Link href="/templates" className={styles.primary}>
              Create a resume <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/auth/login" className={styles.secondary}>
              Get started
            </Link>
          </div>
          <p className={styles.heroNote}>
            Free editor, no account needed. An account gives you a reusable
            persona workspace.
          </p>
        </section>
        <section className={styles.trust} aria-label="What you can count on">
          <p>Made for the details that matter.</p>
          <div>
            <span>
              <FileText size={17} aria-hidden="true" /> Classic resume templates
            </span>
            <span>
              <ShieldCheck size={17} aria-hidden="true" /> Tab-only free drafts
            </span>
            <span>
              <Download size={17} aria-hidden="true" /> PDF downloads
            </span>
            <span>
              <Check size={17} aria-hidden="true" /> No payment details required
            </span>
          </div>
        </section>
        <section
          className={styles.section}
          id="how-it-works"
          aria-labelledby="how-title"
        >
          <header className={styles.sectionHeader}>
            <span className={styles.eyebrow}>How it works</span>
            <h2 id="how-title">From a first draft to your next opportunity.</h2>
            <p>A few simple steps. You stay in control of every word.</p>
          </header>
          <div className={styles.steps}>
            {steps.map((step, index) => (
              <article key={step.title}>
                <span className={styles.stepNumber}>0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          className={styles.pricingSection}
          id="pricing"
          aria-labelledby="pricing-title"
        >
          <div className={styles.section}>
            <header className={styles.sectionHeader}>
              <span className={styles.eyebrow}>Simple pricing</span>
              <h2 id="pricing-title">A workspace that fits your plans.</h2>
              <p>
                Use the free editor, or choose a package for reusable personas
                and saved resumes.
              </p>
            </header>
            <LandingPricing />
            <p className={styles.pricingNote}>
              Package prices and AI resume allowances are set by the administrator. Paid packages are activated after secure Safepay payment verification.
            </p>
          </div>
        </section>
        <section className={styles.bottomCta} aria-labelledby="cta-title">
          <div>
            <span className={styles.eyebrow}>Ready when you are</span>
            <h2 id="cta-title">Make your next application count.</h2>
            <p>
              You already have the experience. Give it a clear place to shine.
            </p>
          </div>
          <div className={styles.actions}>
            <Link href="/templates" className={styles.primary}>
              Create a resume <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/auth/login" className={styles.secondary}>
              Get started
            </Link>
          </div>
        </section>
        <section
          className={styles.section}
          id="comments"
          aria-labelledby="comments-title"
        >
          <header className={styles.sectionHeader}>
            <span className={styles.eyebrow}>Comments & feedback</span>
            <h2 id="comments-title">
              Good resumes start with thoughtful choices.
            </h2>
            <p>A few notes on the way we’ve built this workspace.</p>
          </header>
          <div className={styles.comments}>
            <article>
              <span>On clarity</span>
              <h3>Let your experience do the talking.</h3>
              <p>
                Start with a readable layout and make your strongest, most
                relevant experience easy to find.
              </p>
              <small>Product note</small>
            </article>
            <article>
              <span>On flexibility</span>
              <h3>Different roles deserve different stories.</h3>
              <p>
                Use account personas to organize the details you want to
                highlight for each kind of opportunity.
              </p>
              <small>Product note</small>
            </article>
            <article>
              <span>On ownership</span>
              <h3>Keep a copy of your work.</h3>
              <p>
                Your free draft belongs to this tab. Download a PDF whenever
                you’re ready to keep or share it.
              </p>
              <small>Product note</small>
            </article>
          </div>
          <p className={styles.commentsNote}>
            These are product notes, not customer testimonials. Public customer
            comments haven’t been added yet.
          </p>
        </section>
        <section
          className={`${styles.section} ${styles.faq}`}
          id="faq"
          aria-labelledby="faq-title"
        >
          <header className={styles.sectionHeader}>
            <span className={styles.eyebrow}>A little more detail</span>
            <h2 id="faq-title">Frequently asked questions.</h2>
            <p>Everything you need to know before you begin.</p>
          </header>
          <div>
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerColumns}>
          <div>
            <Link href="/" className={styles.footerBrand}>
              <BrandLogo />
              <span>Resume Builder</span>
            </Link>
            <p>A clear story for your next opportunity.</p>
            <p className={styles.address}>United States</p>
          </div>
          <nav aria-label="Explore">
            <h2>Explore</h2>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/#comments">Comments</Link>
            <Link href="/#faq">FAQs</Link>
          </nav>
          <nav aria-label="Resources">
            <h2>Resources</h2>
            <Link href="/privacy">Privacy</Link>
            <Link href="/templates">Resume templates</Link>
            <Link href="/templates">Free resume builder</Link>
            <Link href="/auth/login">Log in to your account</Link>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Resume Builder</span>
          <span>Built around your next step.</span>
        </div>
      </footer>
    </div>
  );
}
