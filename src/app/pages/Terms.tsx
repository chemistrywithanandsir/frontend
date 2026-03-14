// src/app/pages/Terms.tsx
import React from "react";

export function TermsPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-[70vh] bg-slate-950 text-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            Legal
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-slate-400">Last updated: {currentYear}</p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-slate-200">
          <p>
            These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of the
            Chemistry By Anand website, dashboard and learning tools
            (collectively, the &quot;Platform&quot;). By accessing or using the
            Platform you agree to be bound by these Terms.
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Account &amp; access
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              You must use accurate information when creating and maintaining
              your account.
            </li>
            <li>
              You are responsible for any activity that happens under your
              account and for keeping your login details secure.
            </li>
          </ul>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Personal, non‑commercial use
          </h2>
          <p>
            The Platform, including PYQs, notes, tests and analytics, is
            provided for your personal exam preparation only. You may not copy,
            resell, redistribute or share paid content publicly without written
            permission.
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Content &amp; accuracy
          </h2>
          <p>
            We aim to keep all questions, solutions and notes accurate and
            up‑to‑date, but we do not guarantee that every item is free from
            errors. Use your own judgment and official exam resources where
            needed.
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Payments, pricing &amp; refunds
          </h2>
          <p>
            Some content or bundles on the Platform are paid. Prices, discounts
            and offers are subject to change at our discretion. Online payments
            are processed securely via Razorpay; by completing a payment you
            agree to Razorpay&apos;s own terms and privacy policy in addition to
            ours.
          </p>
          <p className="mt-2">
            Because our products are digital in nature (online notes, PYQs,
            test access, etc.), access is normally granted immediately after
            successful payment. We therefore do not offer refunds once access
            has been provided, except in limited situations such as duplicate
            payments or a clear technical problem preventing access to the
            purchased content. Any such requests must be raised by email within
            7 days of the transaction and will be handled according to our{" "}
            <a
              href="/refund-policy"
              className="text-cyan-300 underline"
            >
              Refund &amp; Cancellation Policy
            </a>
            .
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Prohibited behaviour
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Attempting to hack, reverse engineer or disrupt the Platform.</li>
            <li>
              Sharing your login with others or publicly posting paid content.
            </li>
            <li>
              Using the Platform in any way that violates applicable exam rules
              or laws.
            </li>
          </ul>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Changes &amp; termination
          </h2>
          <p>
            We may update these Terms or modify features of the Platform at any
            time to improve the service. We may suspend or terminate access if
            you violate these Terms or misuse the Platform.
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">Contact</h2>
          <p>
            If you have questions about these Terms or any purchase, please
            email us at{" "}
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

