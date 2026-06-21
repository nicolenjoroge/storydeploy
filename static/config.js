// config.js — Static lookup tables and app-wide constants

export const API_BASE = "";

export const BADGE_CLASS = {
  RPA: "badge-rpa",
  "Power Apps": "badge-app",
  "Agentic AI": "badge-ai",
  LLM: "badge-llm",
};

export const TYPE_ICONS = {
  RPA: "🤖",
  "Power Apps": "🔷",
  "Agentic AI": "🧠",
  LLM: "💬",
};

export const CARD_BG = {
  RPA: "#1a2e1a",
  "Power Apps": "#1a3a4a",
  "Agentic AI": "#2e1a2e",
  LLM: "#3a1410",
};

// CSS variable accent colour per solution type — used for card drawer border
export const TYPE_ACCENT = {
  RPA: "var(--med)",
  "Power Apps": "var(--sky)",
  "Agentic AI": "var(--passion)",
  LLM: "var(--coral)",
};

export const METRIC_ICONS = [
  "💡", "⚙️", "⏱️", "💰", "✅",
  "📈", "🎯", "🔁", "📊", "🚀",
];

export const HOF_ACCENTS = [
  "var(--passion)",
  "var(--sky)",
  "var(--med)",
  "var(--coral)",
];

export const BENEFIT_LABELS = {
  man_hours:               { label: "man-hours saved",     format: (v) => v.toLocaleString() },
  cost_savings_kes:        { label: "cost savings",        format: (v) => `KES ${v.toLocaleString()}` },
  users:                   { label: "users",               format: (v) => v.toLocaleString() },
  papers_saved:            { label: "papers saved",        format: (v) => v.toLocaleString() },
  envelopes_processed:     { label: "envelopes processed", format: (v) => v.toLocaleString() },
  same_day_completion_pct: { label: "same-day completion", format: (v) => `${v}%` },
};

export const SEED = {
  section_2: {
    description: [
      "REA — Reduce, Eliminate, Automate — is a bank-wide initiative designed to challenge how we work, eliminate inefficiencies, and unlock new ways of delivering value.",
      "BPM created a platform for every staff member to contribute ideas. Since then, the programme has grown into a powerful engine for innovation — turning ideas into real solutions that improve customer experience, reduce costs, and increase efficiency.",
      "What started as an idea platform is now delivering tangible impact across the bank.",
    ],
    metrics: {
      ideas_submitted: 286,
      ideas_in_pipeline: 171,
      man_hours_saved: 45000,
      cost_savings_kes: 8500000,
    },
    closing: "From ideas to outcomes — REA is driving real impact across NCBA.",
  },
  section_3: {
    initiatives: [
      {
        name: "Customer to Bank Funds Reconciliation",
        business_area: "Retail Banking",
        solution_type: "RPA",
        description: "Manual reconciliation processes increased risk and delayed transaction matching.",
        tangible_benefits: [{ type: "man_hours", value: 3400 }],
        image: "",
      },
      {
        name: "Contact Centre Quality Management Tool",
        business_area: "Customer Service",
        solution_type: "Power Apps",
        description: "High licensing costs and fragmented QA processes limited consistency across teams.",
        tangible_benefits: [{ type: "cost_savings_kes", value: 3270000 }],
        image: "",
      },
    ],
    closing: "These initiatives represent just the beginning — more are progressing across the pipeline.",
  },
  section_4: {
    innovations: [
      {
        name: "EVA",
        description: "Our AI-powered digital assistant, always ready to help you find answers.",
        capabilities: ["Policy navigation", "Instant answers", "Available 24/7"],
        outcome: "3,300+ active users across NCBA.",
        image: "", video: "",
      },
      {
        name: "MARA",
        description: "NCBA's Agentic AI assistant, designed to handle intelligent queries autonomously.",
        capabilities: ["Agentic AI", "Natural language queries", "Multi-channel"],
        outcome: "Winner of the 2026 NCBA Group Technology hackathon.",
        image: "", video: "",
      },
    ],
  },
  section_5: {
    items: [
      {
        name: "Account dormancy rules updated",
        description: "Account dormancy has been extended to 18 months.",
        benefits: ["Accounts stay active longer", "Simplified reactivation"],
      },
      {
        name: "Instant statements on NCBA Now",
        description: "Customers can now generate account statements instantly on NCBA Now.",
        benefits: ["Faster service delivery", "Real-time access anywhere"],
      },
    ],
  },
};
