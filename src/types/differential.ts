export type DifferentialDomainId =
  | "neurodevelopmental"
  | "metabolic_mito"
  | "neuromuscular"
  | "connective_skeletal"
  | "ophthalmologic"
  | "other";

export type DifferentialItem = {
  id: DifferentialDomainId;
  title: string;
  score: number; // 0-100

  supporting: string[]; // phenotype labels
  missingDiscriminators: string[]; // what would clarify
  notes: string[]; // short, neutral explanations
};