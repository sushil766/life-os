// Banking integration stub.
// Plaid is the standard choice in the US/CA. SDK: `plaid` (Node).
// Flow: server-side /api/plaid/exchange route swaps a public token from
// Plaid Link for an access token; periodically pull transactions and map
// to Expense records (lib/types.ts).
export async function syncTransactions(_opts: { sinceIso: string }) {
  throw new Error("Not implemented. See lib/integrations/banking.ts");
}
