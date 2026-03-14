import React from "react";

export function RefundPolicyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-[70vh] bg-slate-950 text-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            Legal
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-xs text-slate-400">Last updated: {currentYear}</p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-slate-200">
          <p>
            This Refund &amp; Cancellation Policy applies to purchases made on
            the Chemistry By Anand website and dashboard. By purchasing any
            notes bundle, PYQ access or other digital product, you agree to the
            terms below.
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Nature of products
          </h2>
          <p>
            All paid products offered on the Platform are digital in nature
            (online notes, PDFs, PYQs, tests, analytics, etc.). Access is
            generally granted immediately after successful payment.
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            General refund policy
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Once access to a digital product or notes bundle has been
              provided, we normally do <span className="font-semibold">not</span> offer refunds, as the content
              cannot be &quot;returned&quot; in the same way as a physical product.
            </li>
            <li>
              Refunds may be considered only in limited cases such as duplicate
              payments, accidental multiple charges or a clear technical issue
              on our side that prevents you from accessing the purchased
              content.
            </li>
          </ul>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            How to request a refund
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              If you believe you are entitled to a refund, please contact us
              within <span className="font-semibold">7 days</span> of the transaction.
            </li>
            <li>
              Include your registered email address, payment date, transaction
              ID (from Razorpay) and a short description of the issue.
            </li>
            <li>
              Requests should be sent to{" "}
              <a
                href="mailto:chemistrywithanandsir@gmail.com"
                className="text-cyan-300 underline"
              >
                chemistrywithanandsir@gmail.com
              </a>
              .
            </li>
          </ul>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Refund method &amp; timeline
          </h2>
          <p>
            If a refund is approved, it will normally be processed back to the
            original payment method used for the purchase (subject to Razorpay
            and bank processing rules). Please allow{" "}
            <span className="font-semibold">7–10 working days</span> for the
            amount to reflect in your account.
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Cancellations
          </h2>
          <p>
            Because our products are digital and access is provided immediately,
            orders cannot be cancelled once payment is successfully completed.
          </p>

          <h2 className="mt-6 text-base font-semibold text-slate-50">
            Contact
          </h2>
          <p>
            For any questions about this policy or to raise a refund request,
            please email{" "}
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

