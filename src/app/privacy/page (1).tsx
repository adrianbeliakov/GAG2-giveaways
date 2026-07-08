export const metadata = {
  title: "Privacy Policy — GAG2 Giveaways",
  description: "How GAG2 Giveaways collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-gray-200">
      <h1 className="mb-2 text-3xl font-bold text-green-400">
        Privacy Policy
      </h1>
      <p className="mb-8 text-sm text-gray-400">Last updated: July 8, 2026</p>

      <section className="space-y-6 leading-relaxed">
        <p>
          GAG2 Giveaways (&quot;we&quot;, &quot;us&quot;, the &quot;Site&quot;)
          is a community giveaway website for the Roblox game Grow a Garden 2.
          This policy explains what information we collect, why we collect it,
          and how it is handled. We collect only what is needed to run fair
          giveaways.
        </p>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-green-300">
            1. Information we collect
          </h2>
          <p className="mb-2">
            Depending on how you sign up and use the Site, we may collect:
          </p>
          <p>
            <strong>Account information.</strong> A username, and (if you
            register with email) your email address and a password. Passwords
            are stored only as secure one-way hashes — we cannot see them.
          </p>
          <p className="mt-2">
            <strong>Linked accounts.</strong> If you log in with Discord or
            Roblox, we receive your public identity from that service (such as
            your user ID and username, and for Discord your verified email
            address). We never receive your Discord or Roblox password.
          </p>
          <p className="mt-2">
            <strong>Giveaway activity.</strong> Which giveaways you enter and
            whether you win, so results can be drawn and displayed.
          </p>
          <p className="mt-2">
            <strong>Technical data.</strong> Your IP address at registration
            and when entering giveaways. This is used only as a fraud signal to
            keep giveaways fair (for example, detecting mass fake signups). It
            is reviewed manually and never used for automatic bans.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-green-300">
            2. How we use your information
          </h2>
          <p>
            We use your information to operate your account, run and draw
            giveaways, display winners publicly (by username), send
            account-related emails (such as verification and password reset),
            prevent fraud and abuse, and deliver prizes to winners in Roblox.
          </p>
          <p className="mt-2">
            We do not sell your data, show ads, or use your data for
            marketing.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-green-300">
            3. Cookies
          </h2>
          <p>
            The Site uses only essential cookies: a session cookie that keeps
            you logged in, and security cookies used by Cloudflare Turnstile to
            protect the registration form from bots. We do not use advertising
            or tracking cookies.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-green-300">
            4. Service providers
          </h2>
          <p>
            The Site runs on trusted infrastructure providers that process
            data on our behalf: Vercel (hosting), Neon (database), Brevo
            (transactional email), and Cloudflare Turnstile (bot protection).
            If you use social login, Discord or Roblox process your login on
            their own platforms under their own privacy policies.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-green-300">
            5. Data retention and deletion
          </h2>
          <p>
            Account data is kept while your account exists. Security tokens
            (email verification and password reset) expire automatically and
            are stored only as hashes. If you want your account and its data
            deleted, contact us (see below) and we will remove it.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-green-300">
            6. Children
          </h2>
          <p>
            The Site is intended for users who meet the minimum age required
            to use Roblox and to consent to data processing in their country.
            We do not knowingly collect more data from anyone than described
            above.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-green-300">
            7. Your rights
          </h2>
          <p>
            You can ask us to access, correct, or delete the personal data we
            hold about you at any time.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-green-300">
            8. Contact
          </h2>
          <p>
            For any privacy question or request, contact the site owner
            through the official GAG2 Giveaways community, or reply to any
            email sent by the Site.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold text-green-300">
            9. Changes
          </h2>
          <p>
            If this policy changes, the new version will be posted on this
            page with an updated date.
          </p>
        </div>

        <p className="text-sm text-gray-400">
          GAG2 Giveaways is a fan-made community site and is not endorsed by,
          affiliated with, or sponsored by Roblox Corporation or Discord Inc.
        </p>
      </section>
    </main>
  );
}
