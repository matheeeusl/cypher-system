/**
 * What a user's plan allows. Every limit check goes through here so that when
 * free/paid tiers exist (a subscription table, or Better Auth's Stripe
 * plugin), this is the only file that has to learn about plans.
 */
export async function characterLimit(userId: string): Promise<number | null> {
  void userId
  // null = unlimited. A future free tier returns a number here.
  return null
}
