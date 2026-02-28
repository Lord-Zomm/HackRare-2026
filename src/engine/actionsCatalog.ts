import type { RecommendedAction } from "../types/reco";

export const ACTIONS_CATALOG: Omit<
  RecommendedAction,
  "score" | "confidence" | "reasons" | "whatWouldChange"
>[] = [
  {
    id: "refine_targeted_phenotyping",
    title: "Refine phenotyping: confirm key discriminating findings",
    category: "refine_phenotyping",
    suggestedQuestions: [
      "Any regression (loss of previously acquired skills)?",
      "Any episodic worsening with illness/fasting?",
      "Any vision, hearing, or swallowing concerns?",
    ],
  },
  {
    id: "clarify_prior_testing",
    title: "Clarify prior testing (what was done, when, and what was covered)",
    category: "refine_phenotyping",
    suggestedQuestions: [
      "Was testing panel vs exome vs genome?",
      "Were CNVs assessed?",
      "Was trio sequencing performed (parents)?",
    ],
  },
  {
    id: "genetic_test_exome",
    title: "Genetic testing: consider exome sequencing as the next test",
    category: "genetic_testing",
    safetyNotes: [
      "Confirm consent and counseling for secondary findings and limitations.",
    ],
  },
  {
    id: "genetic_test_panel",
    title: "Genetic testing: consider a targeted panel if phenotype is narrow and specific",
    category: "genetic_testing",
    safetyNotes: ["Ensure the panel matches the phenotype and is up to date."],
  },
  {
    id: "gen_trio_exome",
    title: "Genetic testing: trio exome sequencing (add parental samples if possible)",
    category: "genetic_testing",
    safetyNotes: [
      "Trio improves interpretation for de novo and inheritance analysis.",
    ],
  },
  {
    id: "reanalysis_exome_if_done",
    title: "Sequencing reanalysis: updated pipeline + updated phenotype review",
    category: "reanalysis",
    suggestedQuestions: [
      "Any new phenotypes since the original test?",
      "Was CNV/mtDNA/coverage review included previously?",
    ],
  },
  {
    id: "gen_cnv_focus",
    title: "Review/ensure CNV analysis (a common gap depending on lab/pipeline)",
    category: "genetic_testing",
  },
  {
    id: "urgent_metabolic_workup",
    title: "Urgent action: metabolic risk features present—do not delay assessment",
    category: "urgent",
    safetyNotes: ["If acutely ill, use an urgent care pathway."],
  },
  {
    id: "lab_metabolic_screen",
    title: "Order basic metabolic screening labs (high-yield first pass)",
    category: "lab_or_imaging",
    suggestedQuestions: ["Any lactate/ammonia/ketone abnormalities?"],
  },
  {
    id: "ref_metabolic",
    title: "Referral: metabolic genetics clinic",
    category: "referral",
  },
  {
    id: "ref_neurogenetics",
    title: "Referral: neurogenetics / epilepsy genetics clinic",
    category: "referral",
  },
];