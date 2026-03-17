/**
 * AI Tool Contracts — typed interfaces for tools the model can call.
 *
 * These are NOT the implementations — they define the shape of tool
 * inputs and outputs so models, routers, and workers all agree.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Search Documents Tool
// ---------------------------------------------------------------------------

export const searchDocumentsInputSchema = z.object({
  query: z.string().describe('Natural language search query'),
  sourceTypes: z.array(z.string()).optional().describe('Filter by source type'),
  tickers: z.array(z.string()).optional().describe('Filter by related tickers'),
  since: z.string().optional().describe('ISO date, only docs after this'),
  limit: z.number().int().min(1).max(50).default(10),
});

export type SearchDocumentsInput = z.infer<typeof searchDocumentsInputSchema>;

export const searchDocumentsOutputSchema = z.object({
  results: z.array(
    z.object({
      documentId: z.string(),
      title: z.string(),
      source: z.string(),
      publishedAt: z.string().nullable(),
      relevanceScore: z.number(),
      snippet: z.string(),
    }),
  ),
});

export type SearchDocumentsOutput = z.infer<typeof searchDocumentsOutputSchema>;

// ---------------------------------------------------------------------------
// Get Price Snapshot Tool
// ---------------------------------------------------------------------------

export const getPriceSnapshotInputSchema = z.object({
  ticker: z.string(),
  exchange: z.string().optional(),
});

export type GetPriceSnapshotInput = z.infer<typeof getPriceSnapshotInputSchema>;

export const getPriceSnapshotOutputSchema = z.object({
  ticker: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number().optional(),
  marketCap: z.number().optional(),
  timestamp: z.string(),
});

export type GetPriceSnapshotOutput = z.infer<typeof getPriceSnapshotOutputSchema>;

// ---------------------------------------------------------------------------
// Get Company Profile Tool
// ---------------------------------------------------------------------------

export const getCompanyProfileInputSchema = z.object({
  ticker: z.string(),
});

export type GetCompanyProfileInput = z.infer<typeof getCompanyProfileInputSchema>;

export const getCompanyProfileOutputSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  sector: z.string().nullable(),
  industry: z.string().nullable(),
  country: z.string().nullable(),
  description: z.string().nullable(),
  marketCap: z.number().nullable(),
  employees: z.number().nullable(),
});

export type GetCompanyProfileOutput = z.infer<typeof getCompanyProfileOutputSchema>;

// ---------------------------------------------------------------------------
// Tool Registry Type
// ---------------------------------------------------------------------------

export interface ToolDefinition<TInput extends z.ZodTypeAny, TOutput extends z.ZodTypeAny> {
  name: string;
  description: string;
  inputSchema: TInput;
  outputSchema: TOutput;
}

export const tools = {
  searchDocuments: {
    name: 'search_documents',
    description: 'Search indexed financial documents by query, source type, or ticker.',
    inputSchema: searchDocumentsInputSchema,
    outputSchema: searchDocumentsOutputSchema,
  },
  getPriceSnapshot: {
    name: 'get_price_snapshot',
    description: 'Get the latest price snapshot for a stock ticker.',
    inputSchema: getPriceSnapshotInputSchema,
    outputSchema: getPriceSnapshotOutputSchema,
  },
  getCompanyProfile: {
    name: 'get_company_profile',
    description: 'Get company profile information for a stock ticker.',
    inputSchema: getCompanyProfileInputSchema,
    outputSchema: getCompanyProfileOutputSchema,
  },
} as const;
