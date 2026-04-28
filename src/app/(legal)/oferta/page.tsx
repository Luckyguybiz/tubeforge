
export default function OfertaPage() {


  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-2">
        Public Offer Agreement
      </h1>
      <p className="text-xs text-muted-foreground mb-4">
        Effective date: March 20, 2026
      </p>

      {/* 1 */}
      <div className="mb-9">
        <h2 id="general-provisions" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">1. General Provisions</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          This document constitutes an official public offer from TubeForge
          (hereinafter referred to as the &quot;Provider&quot;), addressed to any individual or legal entity
          (hereinafter referred to as the &quot;Customer&quot;), and contains all essential terms for granting access
          to the TubeForge SaaS platform located at{' '}
          <a href="https://tubeforge.co" className="text-brand-500">tubeforge.co</a>{' '}
          (hereinafter referred to as the &quot;Service&quot;).
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Acceptance of this offer is achieved by registering on the Service and/or paying for any subscription plan.
          Upon acceptance, the Customer is considered to have entered into an agreement under the terms set forth in this offer.
        </p>
        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Definitions:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li><strong className="text-foreground font-semibold">Service</strong> — the TubeForge SaaS platform available at tubeforge.co</li>
          <li><strong className="text-foreground font-semibold">Provider</strong> — TubeForge, the owner and operator of the Service</li>
          <li><strong className="text-foreground font-semibold">Customer</strong> — an individual or legal entity that has accepted the terms of this offer</li>
          <li><strong className="text-foreground font-semibold">Subscription</strong> — paid access to the Service features for a defined period</li>
          <li><strong className="text-foreground font-semibold">Account</strong> — the Customer&apos;s personal section on the Service</li>
          <li><strong className="text-foreground font-semibold">Content</strong> — any materials created or uploaded by the Customer</li>
        </ul>
      </div>

      {/* 2 */}
      <div className="mb-9">
        <h2 id="subject" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">2. Subject of the Offer</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Provider agrees to grant the Customer access to the TubeForge SaaS platform —
          an AI-powered platform for YouTube content creators — and the Customer agrees to pay for
          services according to the selected plan (if a paid plan is chosen).
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The platform provides a suite of tools for creating, optimizing, and promoting
          video content using artificial intelligence technologies.
        </p>
      </div>

      {/* 3 */}
      <div className="mb-9">
        <h2 id="service-description" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">3. Service Description</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Under this offer, the Provider grants the Customer access to the following
          tools and features (availability may vary by plan):
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Video analysis and YouTube channel analytics</li>
          <li>AI-powered video translation and dubbing (multi-language support)</li>
          <li>Video file compression without quality loss</li>
          <li>Video format conversion</li>
          <li>AI thumbnail generation for videos</li>
          <li>AI generation of titles, descriptions, and tags</li>
          <li>AI scriptwriting and content ideation</li>
          <li>Video metadata SEO optimization</li>
          <li>Video editor with basic editing features</li>
          <li>Subtitle extraction and video transcription</li>
          <li>Channel statistics and analytics monitoring</li>
          <li>YouTube Data API integration for content management</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Provider reserves the right to add, modify, or remove individual
          features of the Service without prior notice, provided the core functionality
          of the selected plan is maintained.
        </p>
      </div>

      {/* 4 */}
      <div className="mb-9">
        <h2 id="pricing-plans" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">4. Pricing Plans</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Service is provided under the following pricing plans:
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Free ($0/month):</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Limited access to basic tools</li>
          <li>Up to 3 thumbnail generations per day</li>
          <li>Up to 5 text generations (titles, descriptions) per day</li>
          <li>Video compression and conversion — up to 3 files per day</li>
          <li>Basic channel analytics</li>
          <li>TubeForge watermark on generated thumbnails</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Pro ($12/month):</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Extended access to all tools</li>
          <li>Up to 50 thumbnail generations per day</li>
          <li>Unlimited text generation</li>
          <li>Video translation and dubbing — up to 10 videos per month</li>
          <li>Unlimited video compression and conversion</li>
          <li>Advanced analytics and SEO recommendations</li>
          <li>No watermark</li>
          <li>Priority request processing</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Studio ($30/month):</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Full unrestricted access to all tools</li>
          <li>Unlimited thumbnail generation</li>
          <li>Video translation and dubbing — up to 50 videos per month</li>
          <li>Team access — up to 5 members</li>
          <li>API access for integration with external services</li>
          <li>Dedicated support manager</li>
          <li>Early access to new features</li>
          <li>Priority technical support</li>
        </ul>
      </div>

      {/* 5 */}
      <div className="mb-9">
        <h2 id="payment-terms" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">5. Payment Terms</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Payment for paid plans is processed in US Dollars (USD) through the payment system
          integrated into the Service. We accept Visa, MasterCard, and other payment methods
          available through our payment provider (Stripe).
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Automatic Renewal:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The subscription renews automatically at the end of each billing period (1 month).
          Payment is charged automatically from the linked payment method at the beginning of each
          new billing period. The Customer receives a notification about the upcoming charge
          via the email address provided at registration.
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Subscription Cancellation:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Customer may cancel the subscription at any time through the &quot;Billing&quot; section in the Account.
          After cancellation, access to paid features is retained until the end of the current paid period.
          Automatic renewal ceases from the moment of cancellation.
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Plan Changes:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Customer may change the subscription plan at any time. When upgrading to a more expensive plan,
          the price difference is calculated proportionally to the remaining time in the current period.
          When downgrading, changes take effect at the beginning of the next billing period.
        </p>
      </div>

      {/* 6 */}
      <div className="mb-9">
        <h2 id="refund-policy" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">6. Refund Policy</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Provider offers a <strong className="text-foreground font-semibold">14-day money-back guarantee</strong> from
          the date of the first subscription payment. During this period, the Customer may request
          a full refund without providing a reason.
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">How to request a refund:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Send a refund request to{' '}
            <a href="mailto:support@tubeforge.co" className="text-brand-500">support@tubeforge.co</a>{' '}
            with the account email and reason for the request
          </li>
          <li>Requests are processed within 5 business days</li>
          <li>Refunds are issued to the original payment method</li>
          <li>Refund processing time is up to 10 business days depending on the bank</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Cases where refunds are not provided:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>After 14 days from the date of payment</li>
          <li>If the Customer has violated the terms of this offer</li>
          <li>If the account has been blocked for terms of service violations</li>
        </ul>
      </div>

      {/* 7 */}
      <div className="mb-9">
        <h2 id="rights-and-obligations" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">7. Rights and Obligations</h2>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Provider obligations:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Ensure Service availability of at least 99.5% per month</li>
          <li>Protect the Customer&apos;s personal data in accordance with applicable law</li>
          <li>Notify the Customer in advance of planned maintenance</li>
          <li>Process Customer inquiries within a reasonable timeframe</li>
          <li>Provide access to functionality in accordance with the selected plan</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Provider rights:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Suspend access to the Service for maintenance with prior notice</li>
          <li>Block the Customer&apos;s account for violations of this offer</li>
          <li>Modify plans and pricing with at least 30 days&apos; notice</li>
          <li>Engage third parties to fulfill obligations under this offer</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Customer obligations:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Provide accurate information during registration</li>
          <li>Maintain account security and not share access with third parties</li>
          <li>Pay for the selected plan on time</li>
          <li>Not use the Service to create illegal content</li>
          <li>Comply with the terms of this offer and applicable law</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Customer rights:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Use all Service features within the selected plan</li>
          <li>Contact support regarding Service-related issues</li>
          <li>Cancel the subscription and request a refund as described herein</li>
          <li>Request deletion of their account and personal data</li>
        </ul>
      </div>

      {/* 8 */}
      <div className="mb-9">
        <h2 id="limitation-of-liability" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">8. Limitation of Liability</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Service is provided on an &quot;as is&quot; basis. The Provider does not guarantee:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Uninterrupted and error-free operation of the Service</li>
          <li>Achievement of specific results from using AI tools</li>
          <li>Growth of metrics or monetization of the Customer&apos;s YouTube channel</li>
          <li>Compatibility with all hardware and software</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Provider&apos;s maximum aggregate liability to the Customer is limited to the amount
          actually paid by the Customer over the last 12 months of using the Service.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Provider is not liable for indirect, incidental, special, or punitive damages,
          including lost profits, data loss, business interruption, or other damages
          arising from the use or inability to use the Service.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Provider is not liable for the actions of third parties (payment systems,
          hosting providers, API services) affecting the operation of the Service.
        </p>
      </div>

      {/* 9 */}
      <div className="mb-9">
        <h2 id="intellectual-property" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">9. Intellectual Property</h2>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Customer Content:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          All rights to content created by the Customer using the Service tools
          (thumbnails, texts, metadata, scripts, and other materials) belong to the Customer.
          The Provider does not claim intellectual property rights over user content.
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Provider Platform:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The TubeForge platform, including its design, source code, logos, trademarks,
          documentation, and other elements, is the intellectual property of the Provider
          and is protected by copyright law. Copying, modification, or distribution
          of any part of the platform without written consent from the Provider is prohibited.
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">License to Use:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Customer grants the Provider a limited, non-exclusive license to store
          and process Customer content solely for the purpose of providing Service functionality.
          This license terminates upon deletion of the Customer&apos;s account.
        </p>
      </div>

      {/* 10 */}
      <div className="mb-9">
        <h2 id="amendments" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">10. Amendments to the Offer</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Provider reserves the right to make changes to this offer.
          The Customer will be notified of material changes{' '}
          <strong className="text-foreground font-semibold">at least 30 days</strong> before the changes
          take effect through one of the following methods:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Via email registered with the Customer&apos;s account</li>
          <li>Through a notification in the Account dashboard</li>
          <li>By updating the date on this page</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Continued use of the Service after changes take effect constitutes the Customer&apos;s
          agreement to the updated terms. If the Customer does not agree with the changes,
          they may discontinue use of the Service and request account deletion before the new
          terms take effect.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The current version of this offer is always available at{' '}
          <a href="https://tubeforge.co/oferta" className="text-brand-500">tubeforge.co/oferta</a>.
        </p>
      </div>

      {/* 11 */}
      <div className="mb-9">
        <h2 id="contact-information" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">11. Contact Information</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          For all questions related to this offer and the Service, please contact:
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Support:{' '}
          <a href="mailto:support@tubeforge.co" className="text-brand-500">
            support@tubeforge.co
          </a>
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Legal inquiries:{' '}
          <a href="mailto:legal@tubeforge.co" className="text-brand-500">
            legal@tubeforge.co
          </a>
        </p>
      </div>
    </div>
  );
}
