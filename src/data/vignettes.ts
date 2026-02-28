import type { PatientCase } from "../types/case";

export type Vignette = {
  caseData: PatientCase;
  goldNextActionIds: string[]; // acceptable correct actions
};

export const VIGNETTES: Vignette[] = [
  {
    caseData: {
      id: "v1",
      title: "Neurodevelopmental delay + seizures, prior panel negative",
      onsetAgeYears: 1,
      phenotypes: [
        { id: "HP:0001263", label: "Global developmental delay" },
        { id: "HP:0001250", label: "Seizures" },
        { id: "HP:0004322", label: "Muscular hypotonia" },
      ],
      familyHistory: {
        consanguinity: false,
        affectedRelatives: false,
        inheritanceHint: "de_novo",
      },
      priorTesting: {
        type: "panel",
        year: 2022,
        result: "negative",
        notes: "Epilepsy panel negative; no CNV analysis reported",
      },
    },
    goldNextActionIds: ["gen_trio_exome", "reanalysis_exome_if_done"],
  },
  {
    caseData: {
      id: "v2",
      title: "Episodic decompensation + hypoglycemia",
      onsetAgeYears: 2,
      phenotypes: [
        { id: "HP:0002376", label: "Episodic decompensation" },
        { id: "HP:0001943", label: "Hypoglycemia" },
      ],
      familyHistory: {
        consanguinity: false,
        affectedRelatives: false,
        inheritanceHint: "unknown",
      },
      priorTesting: {
        type: "none",
        result: "na",
      },
    },
    goldNextActionIds: ["urgent_metabolic_workup", "ref_metabolic"],
  },
  {
    caseData: {
      id: "v3",
      title: "Negative exome from years ago + new phenotype (ataxia)",
      onsetAgeYears: 5,
      phenotypes: [
        { id: "HP:0001263", label: "Global developmental delay" },
        { id: "HP:0001276", label: "Ataxia" },
      ],
      familyHistory: {
        consanguinity: false,
        affectedRelatives: false,
        inheritanceHint: "unknown",
      },
      priorTesting: {
        type: "exome",
        year: 2019,
        result: "negative",
        notes: "Singleton exome; no reanalysis since ordering",
      },
    },
    goldNextActionIds: ["reanalysis_exome_if_done"],
  },
];