import { XMLParser } from "fast-xml-parser";

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  image: string | null;
};

const RSS_URL =
  "https://news.google.com/rss/search?q=caregiver+when:14d&hl=en-US&gl=US&ceid=US:en";

/**
 * Pulls live "og:image" from an article page. Google News RSS links are
 * redirect URLs — fetch() follows redirects by default in the Node runtime,
 * so this lands on the real publisher page. Best-effort: returns null on any
 * failure (blocked, timeout, no og:image tag) rather than throwing, since a
 * missing thumbnail shouldn't take down the whole news feed.
 */
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ReliviaBot/1.0; +https://relivia.example/bot)",
      },
      signal: AbortSignal.timeout(4500),
      redirect: "follow",
    });
    if (!res.ok) return null;
    // Only read the first chunk of HTML — og:image is always in <head>,
    // no need to download the entire page body.
    const reader = res.body?.getReader();
    if (!reader) return null;
    let html = "";
    const decoder = new TextDecoder();
    for (let i = 0; i < 20; i++) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>") || html.length > 60000) break;
    }
    reader.cancel().catch(() => {});

    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Fetches live "caregiver" news from Google News RSS (a public syndication
 * feed, not an authenticated API) and enriches the top results with a
 * scraped thumbnail image from each article page.
 */
export async function fetchCaregiverNews(limit = 3): Promise<NewsItem[]> {
  try {
    const res = await fetch(RSS_URL, {
      next: { revalidate: 3600 }, // re-scrape at most once an hour
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ReliviaBot/1.0)" },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xml);
    const rawItems = parsed?.rss?.channel?.item;
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    const top = items.slice(0, limit).map((item: any) => ({
      title: String(item.title ?? "").trim(),
      link: String(item.link ?? "").trim(),
      source: typeof item.source === "object" ? String(item.source["#text"] ?? "") : String(item.source ?? ""),
      publishedAt: String(item.pubDate ?? ""),
    }));

    const withImages = await Promise.all(
      top.map(async (item) => ({ ...item, image: await fetchOgImage(item.link) }))
    );

    return withImages.filter((item) => item.title && item.link);
  } catch {
    return [];
  }
}
