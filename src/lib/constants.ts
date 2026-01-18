export const PETITION_THRESHOLD = 150;

export const PETITION_TIERS = [
  {
    id: 1,
    name: "Tier 1 (Quick Fix)",
    threshold: 60,
    description: "Quick Fix",
  },
  {
    id: 2,
    name: "Tier 2 (Service/Experience)",
    threshold: 120,
    description: "Service/Experience",
  },
  {
    id: 3,
    name: "Tier 3 (Major Operational)",
    threshold: 200,
    description: "Major Operational / Policy or Budget Significant",
  },
] as const;

export const PETITION_DURATION_DAYS = 180;
export const PETITION_DURATION_MS =
  PETITION_DURATION_DAYS * 24 * 60 * 60 * 1000;
