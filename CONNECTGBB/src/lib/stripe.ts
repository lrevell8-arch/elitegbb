import { loadStripe } from "@stripe/stripe-js";

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

export const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

export const MEMBERSHIP_TIERS = [
  {
    key: "free",
    label: "Free",
    description: "Claim a profile and access starter training.",
    priceId: null as string | null,
  },
  {
    key: "development",
    label: "Development",
    description: "Full training hub access and progress tracking.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_DEVELOPMENT || null,
  },
  {
    key: "elite",
    label: "Elite Recruiting",
    description: "Visibility boosts, coach messaging, and analytics.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE || null,
  },
] as const;

export const TIER_PRICE_MAP = MEMBERSHIP_TIERS.reduce<Record<string, string | null>>(
  (acc, tier) => {
    acc[tier.key] = tier.priceId;
    return acc;
  },
  {}
);
