export type ActionCategory =
  | "refine_phenotyping"
  | "lab_or_imaging"
  | "genetic_testing"
  | "reanalysis"
  | "referral"
  | "urgent";

export type RecommendedAction = {
  id: string;
  title: string;
  category: ActionCategory;

  score: number; // 0-100
  confidence: "low" | "medium" | "high";

  reasons: string[];
  whatWouldChange: string[];

  safetyNotes?: string[];
  suggestedQuestions?: string[];
};