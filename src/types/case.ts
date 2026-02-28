export type InheritanceHint =
  | "unknown"
  | "de_novo"
  | "ad"
  | "ar"
  | "x_linked"
  | "mitochondrial";

export type PriorTestType = "none" | "panel" | "exome" | "genome";

export type PriorTestResult = "na" | "negative" | "vus" | "positive";

export type HpoTerm = {
  id: string;      // e.g., HP:0001250
  label: string;   // e.g., Seizures
};

export type Severity = "unknown" | "mild" | "moderate" | "severe";

export type PatientCase = {
  id: string;
  title: string;

  severity?: Severity;

  onsetAgeYears?: number; // optional
  phenotypes: HpoTerm[];

  familyHistory: {
    consanguinity: boolean;
    affectedRelatives: boolean;
    inheritanceHint: InheritanceHint;
  };

  priorTesting: {
    type: PriorTestType;
    year?: number; // optional
    result: PriorTestResult;
    notes?: string;
  };
};