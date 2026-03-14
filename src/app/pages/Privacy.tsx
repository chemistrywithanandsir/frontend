// src/app/pages/Privacy.tsx
import React from "react";

export function PrivacyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-[70vh] bg-slate-950 text-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            Legal
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">Last updated: {currentYear}</p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-slate-200">
          <p>
            This Privacy Policy explains how Chemistry By Anand (&quot;we&quot;, &quot;us&quot;,
            &quot;our&quot;) collects, uses and protects your information when you use our
            website, dashboard, learning tools and payment features.
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Information we collect
          </h2>
          <ul className="list-disc list-inside space-y-1 text-slate-200">
            <li>
              <span className="font-medium">Account information</span> – your
              name, email address and profile details from Google sign‑in.
            </li>
            <li>
              <span className="font-medium">Usage data</span> – exams selected,
              questions attempted, notes viewed, tests created and completed.
            </li>
            <li>
              <span className="font-medium">Device &amp; technical data</span> –
              basic browser and usage information used for analytics and to keep
              the platform secure.
            </li>
            <li>
              <span className="font-medium">Payment information</span> – limited
              payment‑related details (such as transaction IDs, payment status
              and purchased bundles) when you buy paid content. Sensitive card
              or UPI details are collected and processed directly by our payment
              gateway partner, Razorpay, and are never stored on our servers.
            </li>
          </ul>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            How we use your information
          </h2>
          <ul className="list-disc list-inside space-y-1 text-slate-200">
            <li>To create and manage your account and dashboard.</li>
            <li>
              To save your tests, question attempts and daily targets so that
              your progress is always available when you sign in.
            </li>
            <li>
              To improve our content, analytics and platform performance over
              time.
            </li>
            <li>
              To communicate important updates related to your account or
              purchased content.
            </li>
          </ul>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Data storage &amp; security
          </h2>
          <p>
            We store your data securely using trusted third‑party services (such
            as Supabase, cloud infrastructure providers and Razorpay). Reasonable
            technical and organisational safeguards are used to protect your
            data, but no online system can be guaranteed 100% secure.
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Third‑party services
          </h2>
          <p>
            We use third‑party tools for authentication, analytics, file storage
            and payments. These providers may process limited data subject to
            their own privacy policies:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-200">
            <li>
              <span className="font-medium">Supabase</span> – for
              authentication, database storage and analytics.
            </li>
            <li>
              <span className="font-medium">Razorpay</span> – for secure online
              payments in India. Razorpay may collect your card, UPI or other
              payment instrument details directly on their pages / SDKs. We do
              not see or store your full card number, CVV or UPI PIN.
            </li>
          </ul>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Your choices
          </h2>
          <ul className="list-disc list-inside space-y-1 text-slate-200">
            <li>You can sign out of your account at any time.</li>
            <li>
              You may contact us to request correction or deletion of your
              stored data, subject to legal and operational requirements.
            </li>
          </ul>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Contact
          </h2>
          <p>
            If you have any questions about this Privacy Policy or how your data
            is handled, please email us at{" "}
            <a
              href="mailto:chemistrywithanandsir@gmail.com"
              className="text-cyan-300 underline"
            >
              chemistrywithanandsir@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

