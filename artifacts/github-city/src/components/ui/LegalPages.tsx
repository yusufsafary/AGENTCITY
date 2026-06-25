import { useEffect } from 'react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function LegalPage({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} — Agent City`;
    return () => { document.title = 'Agent City'; };
  }, [title]);

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #060D1F 0%, #0d0720 100%)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: 'rgba(6,13,31,0.92)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{ background: 'rgba(202,255,0,0.08)', border: '1px solid rgba(202,255,0,0.20)', color: '#CAFF00' }}
        >
          ← Back
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-sm truncate">{title}</h1>
          <p className="text-white/40 text-[10px]">{subtitle}</p>
        </div>
        <span className="text-[10px] font-mono text-white/20">agentcity.uk</span>
      </div>

      {/* Content */}
      <div className="flex-1 mx-auto w-full max-w-2xl px-5 py-8">
        {children}
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-white/25 text-[10px]">© {new Date().getFullYear()} Agent City · agentcity.uk</p>
        <div className="flex items-center justify-center gap-3 mt-2">
          <FooterLink href="privacy">Privacy Policy</FooterLink>
          <span className="text-white/15 text-[10px]">·</span>
          <FooterLink href="terms">Terms of Service</FooterLink>
          <span className="text-white/15 text-[10px]">·</span>
          <FooterLink href="cookies">Cookie Policy</FooterLink>
        </div>
      </div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={`${BASE}/${href}`}
      className="text-white/30 hover:text-white/60 text-[10px] transition-colors"
    >
      {children}
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h2 className="text-[#CAFF00] font-semibold text-sm mb-2" style={{ letterSpacing: '0.04em' }}>{title}</h2>
      <div className="text-white/55 text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

/* ── Privacy Policy ──────────────────────────────────────── */
export function PrivacyPage({ onBack }: { onBack: () => void }) {
  return (
    <LegalPage title="Privacy Policy" subtitle="Last updated: June 2025" onBack={onBack}>
      <Section title="Overview">
        <p>
          Agent City (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a free, open-source tool that visualises public GitHub
          activity as a 3D city. We are committed to protecting your privacy. This policy explains
          what data we access, how we use it, and your rights.
        </p>
      </Section>

      <Section title="Data We Access">
        <p>
          Agent City only reads <strong className="text-white/80">publicly available</strong> GitHub data via the GitHub
          REST API. This includes:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 mt-1">
          <li>Public repository names, descriptions, and star counts</li>
          <li>Public commit counts and language statistics</li>
          <li>Public follower/following counts</li>
        </ul>
        <p className="mt-2">
          We do <strong className="text-white/80">not</strong> access private repositories, emails, or any
          authenticated user data. No GitHub login is required.
        </p>
      </Section>

      <Section title="Data We Store">
        <p>
          We do not maintain a user database. The leaderboard stores only GitHub usernames and
          publicly derived stats (commit counts, repo counts) that you voluntarily submit by
          clicking &ldquo;Add to Leaderboard&rdquo;. This data is stored on our serverless backend and can
          be removed on request.
        </p>
      </Section>

      <Section title="Analytics & Logging">
        <p>
          We may collect basic, anonymised server logs (request counts, error rates) to monitor
          service health. These logs do not identify individual users and are not shared with
          third parties for advertising purposes.
        </p>
      </Section>

      <Section title="Third-Party Services">
        <p>
          Agent City uses the following third-party services:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 mt-1">
          <li><strong className="text-white/70">GitHub API</strong> — to fetch public profile data. Subject to GitHub&apos;s Privacy Policy.</li>
          <li><strong className="text-white/70">Vercel / GitHub Pages</strong> — to host the application. Subject to their respective privacy policies.</li>
        </ul>
      </Section>

      <Section title="Cookies">
        <p>
          We use only strictly necessary session cookies for service functionality. See our{' '}
          <a href={`${BASE}/cookies`} className="text-[#00D4FF] hover:underline">Cookie Policy</a>{' '}
          for full details.
        </p>
      </Section>

      <Section title="Your Rights (GDPR / UK GDPR)">
        <p>If you are located in the UK or EU, you have the right to:</p>
        <ul className="list-disc list-inside space-y-1 pl-1 mt-1">
          <li>Request deletion of any leaderboard entry containing your username</li>
          <li>Request information about what data we hold about you</li>
          <li>Lodge a complaint with the ICO (UK) or your local data protection authority</li>
        </ul>
      </Section>

      <Section title="Contact">
        <p>
          For privacy-related requests, please open an issue on our{' '}
          <a
            href="https://github.com/yusufsafary/AGENTCITY"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00D4FF] hover:underline"
          >
            GitHub repository
          </a>{' '}
          or contact us via the About page.
        </p>
      </Section>
    </LegalPage>
  );
}

/* ── Terms of Service ────────────────────────────────────── */
export function TermsPage({ onBack }: { onBack: () => void }) {
  return (
    <LegalPage title="Terms of Service" subtitle="Last updated: June 2025" onBack={onBack}>
      <Section title="Acceptance of Terms">
        <p>
          By accessing or using Agent City at agentcity.uk (&ldquo;the Service&rdquo;), you agree to be bound
          by these Terms of Service. If you do not agree, please do not use the Service.
        </p>
      </Section>

      <Section title="Description of Service">
        <p>
          Agent City is a free, open-source web application that fetches publicly available GitHub
          profile data and renders it as an interactive 3D city visualisation. The Service is provided
          &ldquo;as is&rdquo; without warranties of any kind.
        </p>
      </Section>

      <Section title="Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc list-inside space-y-1 pl-1 mt-1">
          <li>Use the Service to scrape or harvest data at scale</li>
          <li>Attempt to bypass GitHub API rate limits in a way that harms other users</li>
          <li>Submit false, misleading, or malicious content to the leaderboard</li>
          <li>Use the Service for any unlawful purpose or in violation of GitHub&apos;s Terms of Service</li>
        </ul>
      </Section>

      <Section title="GitHub API">
        <p>
          The Service relies on the GitHub public REST API. Your use of the Service is also subject
          to{' '}
          <a
            href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00D4FF] hover:underline"
          >
            GitHub&apos;s Terms of Service
          </a>
          . We are not affiliated with or endorsed by GitHub, Inc.
        </p>
      </Section>

      <Section title="Intellectual Property">
        <p>
          Agent City is open-source software released under the MIT licence. The source code is
          available at{' '}
          <a
            href="https://github.com/yusufsafary/AGENTCITY"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00D4FF] hover:underline"
          >
            github.com/yusufsafary/AGENTCITY
          </a>
          . GitHub usernames and profile data remain the property of their respective owners.
        </p>
      </Section>

      <Section title="Disclaimer of Warranties">
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without any warranty, express or
          implied, including but not limited to warranties of merchantability, fitness for a
          particular purpose, or non-infringement. We do not warrant that the Service will be
          uninterrupted, error-free, or free of viruses or other harmful components.
        </p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, Agent City and its contributors shall not be
          liable for any indirect, incidental, special, consequential, or punitive damages arising
          from your use of the Service.
        </p>
      </Section>

      <Section title="Changes to Terms">
        <p>
          We reserve the right to modify these Terms at any time. Continued use of the Service after
          changes constitutes acceptance of the revised Terms. Material changes will be noted in the
          repository changelog.
        </p>
      </Section>

      <Section title="Governing Law">
        <p>
          These Terms are governed by the laws of England and Wales. Any disputes shall be subject
          to the exclusive jurisdiction of the courts of England and Wales.
        </p>
      </Section>
    </LegalPage>
  );
}

/* ── Cookie Policy ───────────────────────────────────────── */
export function CookiesPage({ onBack }: { onBack: () => void }) {
  return (
    <LegalPage title="Cookie Policy" subtitle="Last updated: June 2025" onBack={onBack}>
      <Section title="What Are Cookies?">
        <p>
          Cookies are small text files stored on your device when you visit a website. They help
          websites remember your preferences and provide functionality. Agent City uses cookies
          minimally and only where necessary.
        </p>
      </Section>

      <Section title="Cookies We Use">
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'rgba(202,255,0,0.06)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th className="text-left px-3 py-2 text-[#CAFF00] font-semibold">Name</th>
                <th className="text-left px-3 py-2 text-[#CAFF00] font-semibold">Purpose</th>
                <th className="text-left px-3 py-2 text-[#CAFF00] font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'session', purpose: 'Leaderboard session state (server-side)', duration: 'Session' },
                { name: '__vercel_*', purpose: 'Vercel deployment routing (strictly necessary)', duration: 'Session' },
              ].map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: i < 1 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                >
                  <td className="px-3 py-2 font-mono text-[#00D4FF]">{row.name}</td>
                  <td className="px-3 py-2 text-white/50">{row.purpose}</td>
                  <td className="px-3 py-2 text-white/40">{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="What We Do NOT Use">
        <p>Agent City does <strong className="text-white/80">not</strong> use:</p>
        <ul className="list-disc list-inside space-y-1 pl-1 mt-1">
          <li>Advertising or tracking cookies</li>
          <li>Third-party analytics cookies (e.g. Google Analytics)</li>
          <li>Social media tracking pixels</li>
          <li>Fingerprinting or cross-site tracking technologies</li>
        </ul>
      </Section>

      <Section title="LocalStorage">
        <p>
          In addition to cookies, we use browser <strong className="text-white/80">localStorage</strong> to
          remember your last visited GitHub username for convenience. This data never leaves your
          device and is not transmitted to our servers. You can clear it at any time via your
          browser&apos;s developer tools or by clearing site data.
        </p>
      </Section>

      <Section title="Managing Cookies">
        <p>
          You can control and delete cookies through your browser settings. Note that disabling
          strictly necessary cookies may affect the functionality of certain features (such as
          the leaderboard). Most browsers allow you to:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 mt-1">
          <li>View all cookies stored for a site</li>
          <li>Delete individual cookies or all cookies from a site</li>
          <li>Block cookies from specific or all sites</li>
        </ul>
        <p className="mt-2">
          For guidance, visit{' '}
          <a
            href="https://www.aboutcookies.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00D4FF] hover:underline"
          >
            aboutcookies.org
          </a>
          .
        </p>
      </Section>

      <Section title="UK GDPR & ePrivacy">
        <p>
          Under UK GDPR and the Privacy and Electronic Communications Regulations (PECR), we are
          required to obtain consent for non-essential cookies. As Agent City only uses strictly
          necessary cookies and localStorage, no consent banner is required. If this changes, we will
          update this policy and implement appropriate consent mechanisms.
        </p>
      </Section>

      <Section title="Changes to This Policy">
        <p>
          We may update this Cookie Policy from time to time. The &ldquo;last updated&rdquo; date at the top
          of this page will reflect any changes. Continued use of the Service constitutes acceptance
          of the updated policy.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For questions about our cookie practices, open an issue on our{' '}
          <a
            href="https://github.com/yusufsafary/AGENTCITY"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00D4FF] hover:underline"
          >
            GitHub repository
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}

/* ── Footer component (for use in landing hero) ─────────── */
export function LegalFooterLinks() {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <a
        href={`${BASE}/privacy`}
        className="text-white/25 hover:text-white/55 text-[10px] transition-colors"
        style={{ letterSpacing: '0.04em' }}
      >
        Privacy
      </a>
      <span className="text-white/15 text-[10px]">·</span>
      <a
        href={`${BASE}/terms`}
        className="text-white/25 hover:text-white/55 text-[10px] transition-colors"
        style={{ letterSpacing: '0.04em' }}
      >
        Terms
      </a>
      <span className="text-white/15 text-[10px]">·</span>
      <a
        href={`${BASE}/cookies`}
        className="text-white/25 hover:text-white/55 text-[10px] transition-colors"
        style={{ letterSpacing: '0.04em' }}
      >
        Cookies
      </a>
    </div>
  );
}
