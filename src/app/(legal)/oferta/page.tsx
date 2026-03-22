'use client';

import { useThemeStore } from '@/stores/useThemeStore';

export default function OfertaPage() {
  const C = useThemeStore((s) => s.theme);

  const sectionStyle: React.CSSProperties = { marginBottom: 36 };
  const headingStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginBottom: 12, color: C.text };
  const paraStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.8, color: C.sub, marginBottom: 12 };
  const listStyle: React.CSSProperties = { fontSize: 14, lineHeight: 2, color: C.sub, paddingLeft: 24, margin: '8px 0 12px' };

  return (
    <div>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-.02em',
          marginBottom: 8,
        }}
      >
        Public Offer Agreement
      </h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 40 }}>
        Effective date: March 20, 2026
      </p>

      {/* 1 */}
      <div style={sectionStyle}>
        <h2 id="general-provisions" style={headingStyle}>1. General Provisions</h2>
        <p style={paraStyle}>
          This document constitutes an official public offer from TubeForge
          (hereinafter referred to as the &quot;Provider&quot;), addressed to any individual or legal entity
          (hereinafter referred to as the &quot;Customer&quot;), and contains all essential terms for granting access
          to the TubeForge SaaS platform located at{' '}
          <a href="https://tubeforge.co" style={{ color: C.accent }}>tubeforge.co</a>{' '}
          (hereinafter referred to as the &quot;Service&quot;).
        </p>
        <p style={paraStyle}>
          Acceptance of this offer is achieved by registering on the Service and/or paying for any subscription plan.
          Upon acceptance, the Customer is considered to have entered into an agreement under the terms set forth in this offer.
        </p>
        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Definitions:</p>
        <ul style={listStyle}>
          <li><strong style={{ color: C.text }}>Service</strong> — the TubeForge SaaS platform available at tubeforge.co</li>
          <li><strong style={{ color: C.text }}>Provider</strong> — TubeForge, the owner and operator of the Service</li>
          <li><strong style={{ color: C.text }}>Customer</strong> — an individual or legal entity that has accepted the terms of this offer</li>
          <li><strong style={{ color: C.text }}>Subscription</strong> — paid access to the Service features for a defined period</li>
          <li><strong style={{ color: C.text }}>Account</strong> — the Customer&apos;s personal section on the Service</li>
          <li><strong style={{ color: C.text }}>Content</strong> — any materials created or uploaded by the Customer</li>
        </ul>
      </div>

      {/* 2 */}
      <div style={sectionStyle}>
        <h2 id="subject" style={headingStyle}>2. Subject of the Offer</h2>
        <p style={paraStyle}>
          The Provider agrees to grant the Customer access to the TubeForge SaaS platform —
          an AI-powered platform for YouTube content creators — and the Customer agrees to pay for
          services according to the selected plan (if a paid plan is chosen).
        </p>
        <p style={paraStyle}>
          The platform provides a suite of tools for creating, optimizing, and promoting
          video content using artificial intelligence technologies.
        </p>
      </div>

      {/* 3 */}
      <div style={sectionStyle}>
        <h2 id="service-description" style={headingStyle}>3. Service Description</h2>
        <p style={paraStyle}>
          Under this offer, the Provider grants the Customer access to the following
          tools and features (availability may vary by plan):
        </p>
        <ul style={listStyle}>
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
        <p style={paraStyle}>
          The Provider reserves the right to add, modify, or remove individual
          features of the Service without prior notice, provided the core functionality
          of the selected plan is maintained.
        </p>
      </div>

      {/* 4 */}
      <div style={sectionStyle}>
        <h2 id="pricing-plans" style={headingStyle}>4. Pricing Plans</h2>
        <p style={paraStyle}>
          The Service is provided under the following pricing plans:
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Free ($0/month):</p>
        <ul style={listStyle}>
          <li>Limited access to basic tools</li>
          <li>Up to 3 thumbnail generations per day</li>
          <li>Up to 5 text generations (titles, descriptions) per day</li>
          <li>Video compression and conversion — up to 3 files per day</li>
          <li>Basic channel analytics</li>
          <li>TubeForge watermark on generated thumbnails</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Pro ($12/month):</p>
        <ul style={listStyle}>
          <li>Extended access to all tools</li>
          <li>Up to 50 thumbnail generations per day</li>
          <li>Unlimited text generation</li>
          <li>Video translation and dubbing — up to 10 videos per month</li>
          <li>Unlimited video compression and conversion</li>
          <li>Advanced analytics and SEO recommendations</li>
          <li>No watermark</li>
          <li>Priority request processing</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Studio ($30/month):</p>
        <ul style={listStyle}>
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
      <div style={sectionStyle}>
        <h2 id="payment-terms" style={headingStyle}>5. Payment Terms</h2>
        <p style={paraStyle}>
          Payment for paid plans is processed in US Dollars (USD) through the payment system
          integrated into the Service. We accept Visa, MasterCard, and other payment methods
          available through our payment provider (Stripe).
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Automatic Renewal:</p>
        <p style={paraStyle}>
          The subscription renews automatically at the end of each billing period (1 month).
          Payment is charged automatically from the linked payment method at the beginning of each
          new billing period. The Customer receives a notification about the upcoming charge
          via the email address provided at registration.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Subscription Cancellation:</p>
        <p style={paraStyle}>
          The Customer may cancel the subscription at any time through the &quot;Billing&quot; section in the Account.
          After cancellation, access to paid features is retained until the end of the current paid period.
          Automatic renewal ceases from the moment of cancellation.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Plan Changes:</p>
        <p style={paraStyle}>
          The Customer may change the subscription plan at any time. When upgrading to a more expensive plan,
          the price difference is calculated proportionally to the remaining time in the current period.
          When downgrading, changes take effect at the beginning of the next billing period.
        </p>
      </div>

      {/* 6 */}
      <div style={sectionStyle}>
        <h2 id="refund-policy" style={headingStyle}>6. Refund Policy</h2>
        <p style={paraStyle}>
          The Provider offers a <strong style={{ color: C.text }}>14-day money-back guarantee</strong> from
          the date of the first subscription payment. During this period, the Customer may request
          a full refund without providing a reason.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>How to request a refund:</p>
        <ul style={listStyle}>
          <li>Send a refund request to{' '}
            <a href="mailto:support@tubeforge.co" style={{ color: C.accent }}>support@tubeforge.co</a>{' '}
            with the account email and reason for the request
          </li>
          <li>Requests are processed within 5 business days</li>
          <li>Refunds are issued to the original payment method</li>
          <li>Refund processing time is up to 10 business days depending on the bank</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Cases where refunds are not provided:</p>
        <ul style={listStyle}>
          <li>After 14 days from the date of payment</li>
          <li>If the Customer has violated the terms of this offer</li>
          <li>If the account has been blocked for terms of service violations</li>
        </ul>
      </div>

      {/* 7 */}
      <div style={sectionStyle}>
        <h2 id="rights-and-obligations" style={headingStyle}>7. Rights and Obligations</h2>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Provider obligations:</p>
        <ul style={listStyle}>
          <li>Ensure Service availability of at least 99.5% per month</li>
          <li>Protect the Customer&apos;s personal data in accordance with applicable law</li>
          <li>Notify the Customer in advance of planned maintenance</li>
          <li>Process Customer inquiries within a reasonable timeframe</li>
          <li>Provide access to functionality in accordance with the selected plan</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Provider rights:</p>
        <ul style={listStyle}>
          <li>Suspend access to the Service for maintenance with prior notice</li>
          <li>Block the Customer&apos;s account for violations of this offer</li>
          <li>Modify plans and pricing with at least 30 days&apos; notice</li>
          <li>Engage third parties to fulfill obligations under this offer</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Customer obligations:</p>
        <ul style={listStyle}>
          <li>Provide accurate information during registration</li>
          <li>Maintain account security and not share access with third parties</li>
          <li>Pay for the selected plan on time</li>
          <li>Not use the Service to create illegal content</li>
          <li>Comply with the terms of this offer and applicable law</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Customer rights:</p>
        <ul style={listStyle}>
          <li>Use all Service features within the selected plan</li>
          <li>Contact support regarding Service-related issues</li>
          <li>Cancel the subscription and request a refund as described herein</li>
          <li>Request deletion of their account and personal data</li>
        </ul>
      </div>

      {/* 8 */}
      <div style={sectionStyle}>
        <h2 id="limitation-of-liability" style={headingStyle}>8. Limitation of Liability</h2>
        <p style={paraStyle}>
          The Service is provided on an &quot;as is&quot; basis. The Provider does not guarantee:
        </p>
        <ul style={listStyle}>
          <li>Uninterrupted and error-free operation of the Service</li>
          <li>Achievement of specific results from using AI tools</li>
          <li>Growth of metrics or monetization of the Customer&apos;s YouTube channel</li>
          <li>Compatibility with all hardware and software</li>
        </ul>
        <p style={paraStyle}>
          The Provider&apos;s maximum aggregate liability to the Customer is limited to the amount
          actually paid by the Customer over the last 12 months of using the Service.
        </p>
        <p style={paraStyle}>
          The Provider is not liable for indirect, incidental, special, or punitive damages,
          including lost profits, data loss, business interruption, or other damages
          arising from the use or inability to use the Service.
        </p>
        <p style={paraStyle}>
          The Provider is not liable for the actions of third parties (payment systems,
          hosting providers, API services) affecting the operation of the Service.
        </p>
      </div>

      {/* 9 */}
      <div style={sectionStyle}>
        <h2 id="intellectual-property" style={headingStyle}>9. Intellectual Property</h2>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Customer Content:</p>
        <p style={paraStyle}>
          All rights to content created by the Customer using the Service tools
          (thumbnails, texts, metadata, scripts, and other materials) belong to the Customer.
          The Provider does not claim intellectual property rights over user content.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Provider Platform:</p>
        <p style={paraStyle}>
          The TubeForge platform, including its design, source code, logos, trademarks,
          documentation, and other elements, is the intellectual property of the Provider
          and is protected by copyright law. Copying, modification, or distribution
          of any part of the platform without written consent from the Provider is prohibited.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>License to Use:</p>
        <p style={paraStyle}>
          The Customer grants the Provider a limited, non-exclusive license to store
          and process Customer content solely for the purpose of providing Service functionality.
          This license terminates upon deletion of the Customer&apos;s account.
        </p>
      </div>

      {/* 10 */}
      <div style={sectionStyle}>
        <h2 id="amendments" style={headingStyle}>10. Amendments to the Offer</h2>
        <p style={paraStyle}>
          The Provider reserves the right to make changes to this offer.
          The Customer will be notified of material changes{' '}
          <strong style={{ color: C.text }}>at least 30 days</strong> before the changes
          take effect through one of the following methods:
        </p>
        <ul style={listStyle}>
          <li>Via email registered with the Customer&apos;s account</li>
          <li>Through a notification in the Account dashboard</li>
          <li>By updating the date on this page</li>
        </ul>
        <p style={paraStyle}>
          Continued use of the Service after changes take effect constitutes the Customer&apos;s
          agreement to the updated terms. If the Customer does not agree with the changes,
          they may discontinue use of the Service and request account deletion before the new
          terms take effect.
        </p>
        <p style={paraStyle}>
          The current version of this offer is always available at{' '}
          <a href="https://tubeforge.co/oferta" style={{ color: C.accent }}>tubeforge.co/oferta</a>.
        </p>
      </div>

      {/* 11 */}
      <div style={sectionStyle}>
        <h2 id="contact-information" style={headingStyle}>11. Contact Information</h2>
        <p style={paraStyle}>
          For all questions related to this offer and the Service, please contact:
        </p>
        <p style={paraStyle}>
          Support:{' '}
          <a href="mailto:support@tubeforge.co" style={{ color: C.accent }}>
            support@tubeforge.co
          </a>
        </p>
        <p style={paraStyle}>
          Legal inquiries:{' '}
          <a href="mailto:legal@tubeforge.co" style={{ color: C.accent }}>
            legal@tubeforge.co
          </a>
        </p>
      </div>
    </div>
  );
}
