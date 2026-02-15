import { z } from "zod/v4";

export const parseTransactionResponseSchema = z.object({
  amount: z.number().positive(),
  payeeName: z.string().min(1),
  categoryName: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type ParseTransactionResponse = z.infer<typeof parseTransactionResponseSchema>;

export function buildParsePrompt(
  text: string,
  context: {
    categories: { id: string; name: string }[];
    payees: { id: string; name: string }[];
  }
): string {
  const categoryNames = context.categories.map((c) => c.name).join(", ");
  const payeeNames = context.payees.map((p) => p.name).join(", ");

  return `Parse this transaction description into structured data.

Input: "${text}"

Available categories: ${categoryNames || "none"}
Known payees: ${payeeNames || "none"}

Return JSON with:
- amount: number (positive, the dollar/currency amount)
- payeeName: string (the merchant/payee — match to a known payee if close, otherwise use what's described)
- categoryName: string or omit (match to an available category if obvious)
- date: string in YYYY-MM-DD format (use today's date if not specified: ${new Date().toISOString().split("T")[0]})

Return ONLY valid JSON, no markdown fences or explanation.`;
}
