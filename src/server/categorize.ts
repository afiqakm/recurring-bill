const RULES: Array<{ keywords: string[]; category: string }> = [
  { keywords: ["asb", "stashaway"], category: "Savings / Investment" },
  { keywords: ["ibu"], category: "Family Transfer" },
  {
    keywords: ["spaylater", "gpaylater", "grabpaylater", "atome", "tiktok"],
    category: "BNPL",
  },
  {
    keywords: ["spotify", "youtube", "netflix", "xbox"],
    category: "Subscription",
  },
  {
    keywords: ["unifi", "celcom", "elektrik", "air", "cuckoo"],
    category: "Utilities",
  },
  { keywords: ["cpl loan", "car loan"], category: "Loan" },
  { keywords: ["credit card"], category: "Credit Card" },
];

export function categorizeName(name: string): string {
  const value = name.trim().toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => value.includes(keyword))) {
      return rule.category;
    }
  }
  return "Others";
}
