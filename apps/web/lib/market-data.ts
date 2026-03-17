/**
 * Real-time market data fetching via Yahoo Finance.
 *
 * Used by briefing generation and research APIs to provide
 * actual price data instead of hardcoded zeros.
 */

import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export interface QuoteSnapshot {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  previousClose: number;
  name: string;
  timestamp: string;
}

/**
 * Fetch real-time quotes for a list of tickers.
 * Gracefully returns partial results — failed tickers are skipped.
 */
export async function fetchQuotes(tickers: string[]): Promise<QuoteSnapshot[]> {
  if (tickers.length === 0) return [];

  const results: QuoteSnapshot[] = [];

  // Fetch in parallel with individual error handling
  const promises = tickers.map(async (ticker) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quote: any = await yf.quote(ticker);
      if (!quote || !quote.regularMarketPrice) return null;

      return {
        ticker: String(quote.symbol ?? ticker),
        price: Number(quote.regularMarketPrice ?? 0),
        change: Number(quote.regularMarketChange ?? 0),
        changePercent: Number(quote.regularMarketChangePercent ?? 0),
        volume: Number(quote.regularMarketVolume ?? 0),
        marketCap: Number(quote.marketCap ?? 0),
        previousClose: Number(quote.regularMarketPreviousClose ?? 0),
        name: String(quote.shortName ?? quote.longName ?? ticker),
        timestamp: new Date().toISOString(),
      } satisfies QuoteSnapshot;
    } catch {
      console.warn(`[market-data] Failed to fetch quote for ${ticker}`);
      return null;
    }
  });

  const settled = await Promise.all(promises);
  for (const r of settled) {
    if (r) results.push(r);
  }

  return results;
}

/**
 * Format quotes into a human-readable context string for AI prompts.
 */
export function formatQuotesForPrompt(quotes: QuoteSnapshot[]): string {
  if (quotes.length === 0) return '';

  const lines = quotes.map((q) => {
    const sign = q.changePercent >= 0 ? '+' : '';
    return `${q.ticker} (${q.name}): $${q.price.toFixed(2)} ${sign}${q.changePercent.toFixed(2)}% | 成交量: ${formatVolume(q.volume)} | 市值: ${formatMarketCap(q.marketCap)}`;
  });

  return `当前实时行情数据（来源: Yahoo Finance）:\n${lines.join('\n')}`;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function formatMarketCap(v: number): string {
  if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  return `$${v}`;
}
