import React from 'react';
import { Link } from 'react-router-dom';

const LAST_UPDATED = 'March 17, 2026';
const COMPANY = 'SmartStrategy';
const CONTACT_EMAIL = 'princeleepraise@gmail.com';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 py-16 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-10">
          <Link to="/" className="text-blue-400 text-sm hover:underline">← Back to Home</Link>
          <h1 className="text-4xl font-bold text-white mt-4 mb-2">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using {COMPANY} ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use the Service. These terms apply to all users
              including free and premium subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Not Financial Advice</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-200">
              <p className="font-semibold mb-1">IMPORTANT DISCLAIMER</p>
              <p>
                All trading signals, arbitrage alerts, analysis, and content provided by {COMPANY} are for
                <span className="font-bold"> informational and educational purposes only</span>. Nothing on this
                platform constitutes financial advice, investment advice, trading advice, or any other form of
                professional advice. {COMPANY} is not a licensed financial advisor, broker, or investment firm.
              </p>
              <p className="mt-2">
                Cryptocurrency trading involves <span className="font-bold">substantial risk of loss</span>.
                Past performance of signals does not guarantee future results. You may lose some or all of
                your capital. Only trade with money you can afford to lose. Always do your own research (DYOR)
                before making any financial decision.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Eligibility</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>You must be at least 18 years old to use the Service</li>
              <li>You must be legally permitted to trade cryptocurrencies in your jurisdiction</li>
              <li>You are responsible for ensuring crypto trading is legal where you live</li>
              <li>Users from jurisdictions where crypto trading is banned use the Service at their own risk</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Account Responsibility</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>You are responsible for keeping your login credentials secure</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>You must not share your account with others</li>
              <li>You must not use the Service for any illegal purpose</li>
              <li>One account per person — duplicate accounts may be terminated</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Exchange API Keys & Bot Trading</h2>
            <p className="mb-2">
              If you connect exchange API keys for automated bot trading:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>You grant {COMPANY} permission to place trades on the connected exchange on your behalf</li>
              <li>You are solely responsible for all trades executed by your bots</li>
              <li>We strongly recommend using API keys with <span className="text-white font-medium">trade-only permissions</span> and no withdrawal permissions</li>
              <li>{COMPANY} is not liable for any losses resulting from bot trading, including losses due to exchange downtime, API errors, slippage, or market conditions</li>
              <li>Bot trading results shown in demos or backtests do not guarantee real-world performance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Subscriptions & Payments</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Premium subscriptions are priced at $20/month, paid in cryptocurrency</li>
              <li>Each payment grants 30 days of premium access from the payment date</li>
              <li>Subscriptions are <span className="text-white font-medium">not auto-renewed</span> — you choose to renew manually</li>
              <li>All payments are <span className="text-white font-medium">non-refundable</span> once premium access has been granted, given the digital nature of the service</li>
              <li>If a payment fails to be confirmed on-chain, access will not be granted. Contact support with your transaction hash</li>
              <li>We reserve the right to change pricing with at least 14 days notice to existing subscribers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Referral Program</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>You earn a $5 credit when someone signs up using your referral link and makes a payment</li>
              <li>Referral credits can be applied to your own subscription renewal</li>
              <li>Self-referrals or fraudulent referrals will result in account termination and forfeiture of credits</li>
              <li>We reserve the right to modify or discontinue the referral program at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Prohibited Conduct</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Scrape, copy, or redistribute our signals or data without permission</li>
              <li>Attempt to reverse-engineer our AI models or algorithms</li>
              <li>Use the Service to manipulate markets or engage in pump-and-dump schemes</li>
              <li>Abuse the free tier by creating multiple accounts to bypass limits</li>
              <li>Attempt to hack, disrupt, or overload our servers</li>
              <li>Resell or sublicense access to the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, {COMPANY} and its operators shall not be liable for any
              direct, indirect, incidental, special, or consequential damages arising from:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-gray-300">
              <li>Trading losses based on signals or analysis from the Service</li>
              <li>Bot trading losses or errors</li>
              <li>Exchange downtime, API failures, or connectivity issues</li>
              <li>Unauthorized access to your account</li>
              <li>Any interruption or cessation of the Service</li>
            </ul>
            <p className="mt-3">
              Your use of the Service is entirely at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Service Availability</h2>
            <p>
              We aim to maintain high availability but do not guarantee uninterrupted access to the Service.
              Scheduled maintenance, technical issues, or third-party exchange outages may temporarily affect
              signal delivery or bot operation. No refunds will be issued for temporary service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">11. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate any account that violates these Terms, engages in
              fraudulent activity, or poses a risk to other users or the platform. Terminated accounts forfeit
              any unused subscription period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">12. Changes to Terms</h2>
            <p>
              We may update these Terms at any time. We will notify you of material changes via email or
              in-app notice. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">13. Governing Law</h2>
            <p>
              These Terms are governed by applicable international laws. Any disputes shall be resolved
              through good-faith negotiation first. If unresolved, disputes shall be settled by binding
              arbitration rather than in court.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">14. Contact</h2>
            <p className="mb-3">For questions about these Terms, contact us at:</p>
            <ul className="space-y-1 text-gray-300">
              <li>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">{CONTACT_EMAIL}</a></li>
              <li>WhatsApp: <a href="https://wa.me/2348035421019" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">+234 803 542 1019</a></li>
            </ul>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex gap-4 text-sm text-gray-500">
          <Link to="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
          <Link to="/" className="hover:text-gray-300">Home</Link>
        </div>

      </div>
    </div>
  );
}
