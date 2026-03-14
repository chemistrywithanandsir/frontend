import React from "react";

export function ContactPage() {
  return (
    <div className="min-h-[60vh] bg-slate-950 text-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            Support
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Contact Us
          </h1>
          <p className="text-xs text-slate-400">
            We&apos;re happy to help with questions about the platform,
            purchases or technical issues.
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-slate-200">
          <p>
            For support related to Chemistry By Anand, including help with
            accessing your dashboard, notes bundles, PYQs, test features or
            payment‑related queries, please use the email below.
          </p>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Primary support email
            </p>
            <p className="mt-2 text-base md:text-lg font-semibold text-cyan-300">
              <a
                href="mailto:chemistrywithanandsir@gmail.com"
                className="underline decoration-cyan-500/60"
              >
                chemistrywithanandsir@gmail.com
              </a>
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Please write from the same email ID that you use to sign in, and
              include details like your exam (NEET / JEE / CBSE), order ID (if
              any) and a short description of the issue.
            </p>
          </div>

          <p className="text-xs text-slate-500">
            We typically respond within 1–3 working days. For urgent payment
            disputes or suspected fraudulent activity on your payment method,
            you may also contact your bank / card issuer and Razorpay support
            directly in addition to emailing us.
          </p>
        </section>
      </div>
    </div>
  );
}

