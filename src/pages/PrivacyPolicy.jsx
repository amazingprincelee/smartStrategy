import React from 'react';
import { Link } from 'react-router-dom';

const LAST_UPDATED = 'March 17, 2026';
const COMPANY = 'SmartStrategy';
const CONTACT_EMAIL = 'princeleepraise@gmail.com';
const SITE_URL = 'https://smartstrategy.app';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen px-4 py-16 text-gray-200 bg-gray-950">
      <div className="max-w-3xl mx-auto">

        <div className="mb-10">
          <Link to="/" className="text-sm text-blue-400 hover:underline">← Back to Home</Link>
          <h1 className="mt-4 mb-2 text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">1. Introduction</h2>
            <p>
              {COMPANY} ("{COMPANY}", "we", "our", or "us") operates the website {SITE_URL} and provides
              AI-powered crypto trading signals, arbitrage scanning, and automated bot services (the "Service").
              This Privacy Policy explains how we collect, use, and protect your personal information when you
              use our Service. By using {COMPANY}, you agree to this policy.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">2. Information We Collect</h2>
            <ul className="space-y-2 text-gray-300 list-disc list-inside">
              <li><span className="font-medium text-white">Account data:</span> Email address, full name, and password (hashed — never stored in plain text).</li>
              <li><span className="font-medium text-white">Google OAuth data:</span> If you sign in with Google, we receive your name and email from Google. We do not receive your Google password.</li>
              <li><span className="font-medium text-white">Exchange API keys:</span> If you connect an exchange account for bot trading, your API keys are stored encrypted. We only use them to place trades on your behalf.</li>
              <li><span className="font-medium text-white">Usage data:</span> Pages visited, signals viewed, bot activity logs. Used to improve the Service.</li>
              <li><span className="font-medium text-white">Payment data:</span> Crypto payment transaction IDs and amounts. We do not store credit card numbers — payments are processed by third-party crypto payment providers.</li>
              <li><span className="font-medium text-white">Referral data:</span> If you were referred by another user or shared a referral link, we track referral codes to credit rewards.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">3. How We Use Your Information</h2>
            <ul className="space-y-2 text-gray-300 list-disc list-inside">
              <li>To create and manage your account</li>
              <li>To deliver trading signals, arbitrage alerts, and bot services</li>
              <li>To process subscription payments and send payment receipts</li>
              <li>To send subscription renewal reminder emails</li>
              <li>To provide customer support</li>
              <li>To improve and maintain the Service</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
            <p className="mt-3">We do <span className="font-medium text-white">not</span> sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">4. Data Storage & Security</h2>
            <p>
              Your data is stored on secure servers. Passwords are hashed using bcrypt. Exchange API keys
              are stored encrypted. We use HTTPS for all data transmission. While we take reasonable security
              measures, no system is 100% secure and we cannot guarantee absolute security of your data.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">5. Third-Party Services</h2>
            <p className="mb-2">We use the following third-party services which have their own privacy policies:</p>
            <ul className="space-y-1 text-gray-300 list-disc list-inside">
              <li>Google OAuth — for sign-in authentication</li>
              <li>Coinbase Commerce / NOWPayments / CryptoPay — for crypto payment processing</li>
              <li>Cryptocurrency exchanges (Gate.io, KuCoin, etc.) — for market data and bot trading</li>
              <li>DigitalOcean — for server hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">6. Cookies</h2>
            <p>
              We use minimal cookies and localStorage to keep you logged in (JWT tokens) and remember your
              theme preference. We do not use advertising cookies or tracking cookies from ad networks.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">7. Your Rights</h2>
            <ul className="space-y-2 text-gray-300 list-disc list-inside">
              <li>You can request a copy of your personal data at any time</li>
              <li>You can request deletion of your account and associated data</li>
              <li>You can disconnect your Google account from your profile settings</li>
              <li>You can opt out of email notifications in your profile settings</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">{CONTACT_EMAIL}</a>.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">8. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. If you delete your account,
              we remove your personal data within 30 days, except where we are legally required to retain it
              (e.g. payment records).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">9. Children's Privacy</h2>
            <p>
              {COMPANY} is not intended for users under the age of 18. We do not knowingly collect personal
              information from minors. If you believe a minor has provided us data, contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              by email or by a notice on the platform. Continued use of the Service after changes means you
              accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">11. Contact Us</h2>
            <p className="mb-3">
              For any privacy-related questions or requests, contact us at:
            </p>
            <ul className="space-y-1 text-gray-300">
              <li>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">{CONTACT_EMAIL}</a></li>
              <li>WhatsApp: <a href="https://wa.me/2348035421019" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">+234 803 542 1019</a></li>
            </ul>
          </section>

        </div>

        <div className="flex gap-4 pt-8 mt-12 text-sm text-gray-500 border-t border-white/10">
          <Link to="/terms" className="hover:text-gray-300">Terms of Service</Link>
          <Link to="/" className="hover:text-gray-300">Home</Link>
        </div>

      </div>
    </div>
  );
}
