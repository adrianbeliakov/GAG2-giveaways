/**
 * Discord webhook announcements — completely optional and fail-safe.
 *
 * Set DISCORD_WEBHOOK_URL in the environment (Discord server → channel →
 * Edit Channel → Integrations → Webhooks → New Webhook → Copy URL) and the
 * site announces new giveaways and winners automatically. Without the
 * variable, everything is silently skipped.
 *
 * Announcements must NEVER break the admin action that triggered them:
 * every network problem is caught and only logged.
 */

const WEBHOOK_URL = () => process.env.DISCORD_WEBHOOK_URL;
const SITE_URL = () =>
  process.env.NEXTAUTH_URL ?? "https://gag-2-giveaways-smoky.vercel.app";

const LEAF = 0x6ee7a0; // brand green
const GOLD = 0xf2c14e; // brand gold

type DiscordEmbed = {
  title: string;
  description?: string;
  url?: string;
  color: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  timestamp?: string;
  image?: { url: string };
};

/** Fires a webhook with the given embed; never throws. */
async function send(embed: DiscordEmbed, content?: string): Promise<void> {
  const url = WEBHOOK_URL();
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "GAG2 Giveaways",
        content: content ?? "",
        embeds: [embed],
        // Never ping @everyone/@here or roles from an automated hook.
        allowed_mentions: { parse: [] },
      }),
    });
    if (!res.ok) {
      console.error(`Discord webhook responded ${res.status}`);
    }
  } catch (err) {
    console.error("Discord webhook failed:", err);
  }
}

/** Announces a newly created giveaway. */
export async function announceGiveaway(g: {
  id: string;
  title: string;
  prize: string;
  description: string;
  endsAt: Date;
  startsAt?: Date | null;
  winnersCount: number;
  imageUrl?: string | null;
}): Promise<void> {
  const link = `${SITE_URL()}/giveaways/${g.id}`;
  const upcoming = Boolean(g.startsAt && g.startsAt > new Date());
  await send(
    {
      title: upcoming ? `📅 Upcoming giveaway: ${g.title}` : `🌱 New giveaway: ${g.title}`,
      url: link,
      description: g.description.length > 180 ? `${g.description.slice(0, 177)}…` : g.description,
      color: LEAF,
      ...(g.imageUrl ? { image: { url: g.imageUrl } } : {}),
      fields: [
        { name: "🏆 Prize", value: g.prize, inline: true },
        {
          name: "👑 Winners",
          value: String(g.winnersCount),
          inline: true,
        },
        ...(upcoming
          ? [
              {
                name: "🚀 Starts",
                value: `<t:${Math.floor(g.startsAt!.getTime() / 1000)}:R>`,
                inline: true,
              },
            ]
          : []),
        {
          name: "⏰ Closes",
          value: `<t:${Math.floor(g.endsAt.getTime() / 1000)}:R>`,
          inline: true,
        },
        { name: upcoming ? "Get ready here" : "Enter here", value: link },
      ],
      footer: { text: "Free to enter · winners drawn randomly" },
      timestamp: new Date().toISOString(),
    },
    upcoming ? "📅 A new giveaway is scheduled — set your alarms!" : "🎁 A new giveaway just went live!"
  );
}

/** Announces drawn winners for a giveaway. */
export async function announceWinners(
  g: { id: string; title: string; prize: string; imageUrl?: string | null },
  winnerUsernames: string[]
): Promise<void> {
  if (winnerUsernames.length === 0) return;
  const link = `${SITE_URL()}/giveaways/${g.id}`;
  const names = winnerUsernames.map((u) => `🎉 **${u}**`).join("\n");

  await send(
    {
      title: `🏆 Winner${winnerUsernames.length > 1 ? "s" : ""}: ${g.title}`,
      url: link,
      description: names,
      color: GOLD,
      ...(g.imageUrl ? { image: { url: g.imageUrl } } : {}),
      fields: [
        { name: "Prize", value: g.prize, inline: true },
        { name: "Details", value: link },
      ],
      footer: { text: "Drawn randomly from all valid entries · congratulations!" },
      timestamp: new Date().toISOString(),
    },
    "The results are in! 🥁"
  );
}
