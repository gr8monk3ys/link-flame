export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-10">
      <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Privacy Policy
      </h1>

      <div className="prose prose-lg">
        <p>
          At LinkFlame, we take your privacy seriously. This Privacy Policy explains how we
          collect, use, and protect your personal information.
        </p>

        <h2>Information We Collect</h2>
        <p>
          We collect information that you voluntarily provide to us when you:
        </p>
        <ul>
          <li>Subscribe to our newsletter</li>
          <li>Leave comments on our blog</li>
          <li>Contact us through our contact form</li>
          <li>Create an account</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
        <ul>
          <li>Send you our newsletter and updates</li>
          <li>Respond to your inquiries</li>
          <li>Improve our website and services</li>
          <li>Analyze website usage</li>
        </ul>

        <h2>Cookies and Tracking</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our website
          and store certain information. You can instruct your browser to refuse all cookies
          or to indicate when a cookie is being sent.
        </p>

        <h2>Third-Party Disclosure</h2>
        <p>
          We do not sell, trade, or otherwise transfer your personally identifiable
          information to third parties without your consent, except as described in this
          policy.
        </p>

        <h2>Affiliate Links</h2>
        <p>
          Our website contains affiliate links. When you click on these links and make a
          purchase, we may receive a commission. These affiliate relationships do not affect
          the products we choose to feature or our reviews.
        </p>

        <h2>Analytics</h2>
        <p>
          We use analytics tools to understand how visitors use our website. These tools may
          collect information such as your IP address, browser type, and pages visited.
        </p>

        <h2>Email Communications</h2>
        <p>
          If you subscribe to our newsletter, we will send you emails about our content,
          products, and services. You can unsubscribe at any time using the link provided
          in each email.
        </p>

        <h2>Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information.
          However, no method of transmission over the internet is 100% secure.
        </p>

        <h2>Children&apos;s Privacy</h2>
        <p>
          Our website is not intended for children under 13 years of age. We do not
          knowingly collect personal information from children under 13.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any
          changes by posting the new Privacy Policy on this page.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact us
          </a>
          .
        </p>
      </div>
    </div>
  )
}
