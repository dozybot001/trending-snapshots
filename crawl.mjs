// GitHub trending: top N of the daily, weekly and monthly lists.
// Parses the public trending page; GitHub has no API for this list.
export const LISTS = ['daily', 'weekly', 'monthly'];
export const TOP = 15;

const text = html => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const number = value => Number(String(value || '0').replace(/,/g, '')) || 0;

export function parseTrending(html) {
  const articles = html.match(/<article class="Box-row">[\s\S]*?<\/article>/g) || [];
  return articles.map((article, index) => {
    const name = article.match(/<h2 class="h3 lh-condensed">[\s\S]*?href="\/([^"/]+\/[^"/]+)"/)?.[1];
    if (!name) return null;
    const description = text(article.match(/<p class="col-9 color-fg-muted[^"]*">([\s\S]*?)<\/p>/)?.[1] || '');
    const language = text(article.match(/<span itemprop="programmingLanguage">([\s\S]*?)<\/span>/)?.[1] || '');
    const stars = number(text(article.match(/href="\/[^"]+\/stargazers"[^>]*>([\s\S]*?)<\/a>/)?.[1]));
    const forks = number(text(article.match(/href="\/[^"]+\/forks"[^>]*>([\s\S]*?)<\/a>/)?.[1]));
    const periodStars = number(article.match(/([\d,]+)\s+stars\s+(?:today|this week|this month)/)?.[1]);
    return { rank: index + 1, name, url: 'https://github.com/' + name, description, language, stars, forks, periodStars };
  }).filter(Boolean);
}

// github.com is often unreachable from the server, so a relay publishes each day's lists
// as JSON (TREND_LISTS_URL with {date} and {list} placeholders). The page is the fallback
// when the snapshot is missing or late.
export async function fetchTrending(list, { fetcher = fetch, top = TOP, date, relay = process.env.TREND_LISTS_URL } = {}) {
  if (relay && date) {
    try {
      const response = await fetcher(relay.replace('{date}', date).replace('{list}', list), { headers: { accept: 'application/vnd.github.raw', 'user-agent': 'tenon-trending' }, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`trending relay ${list} ${date}: HTTP ${response.status}`);
      const repos = await response.json();
      if (!Array.isArray(repos) || repos.length < 5) throw new Error(`trending relay ${list} ${date}: unexpected payload`);
      return repos.slice(0, top);
    } catch (error) { console.warn(`${error.message}; reading the trending page instead`); }
  }
  const response = await fetcher(`https://github.com/trending?since=${list}`, { headers: { 'user-agent': 'Mozilla/5.0 (tenon-trending)' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`trending ${list}: HTTP ${response.status}`);
  const repos = parseTrending(await response.text());
  if (repos.length < 5) throw new Error(`trending ${list}: only ${repos.length} repositories parsed; page layout may have changed`);
  return repos.slice(0, top);
}

export async function fetchAll(options) {
  const entries = await Promise.all(LISTS.map(async list => [list, await fetchTrending(list, options)]));
  return Object.fromEntries(entries);
}
