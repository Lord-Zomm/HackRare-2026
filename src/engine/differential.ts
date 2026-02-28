import type { PatientCase } from "../types/case";
import type { DifferentialItem, DifferentialDomainId } from "../types/differential";

function has(c: PatientCase, id: string) {
  return c.phenotypes.some((p) => p.id === id);
}
function labelsFor(c: PatientCase, ids: string[]) {
  const set = new Set(ids);
  return c.phenotypes.filter((p) => set.has(p.id)).map((p) => p.label);
}
function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function buildDifferential(c: PatientCase): DifferentialItem[] {
  // phenotype “signals”
  const seizures = has(c, "HP:0001250");
  const gdd = has(c, "HP:0001263");
  const hypotonia = has(c, "HP:0004322") || has(c, "HP:0001290");
  const episodic = has(c, "HP:0002376");
  const hypoglycemia = has(c, "HP:0001943");
  const lactate = has(c, "HP:0002151");
  const ataxia = has(c, "HP:0001276");
  const regression = has(c, "HP:0001268");
  const skeletal = has(c, "HP:0000924");
  const eye = has(c, "HP:0000478");
  const dysphagia = has(c, "HP:0002015");

  // domain scores (heuristic but explainable)
  let neuro = 10;
  if (gdd) neuro += 30;
  if (seizures) neuro += 25;
  if (ataxia) neuro += 15;
  if (regression) neuro += 15;
  if (hypotonia) neuro += 10;

  let metabolic = 10;
  if (episodic) metabolic += 30;
  if (hypoglycemia) metabolic += 30;
  if (lactate) metabolic += 20;
  if (regression) metabolic += 10;

  let neuromuscular = 10;
  if (hypotonia) neuromuscular += 25;
  if (dysphagia) neuromuscular += 20;
  if (ataxia) neuromuscular += 10;

  let connective = 10;
  if (skeletal) connective += 35;
  if (growthDelay(c)) connective += 10;

  let oph = 10;
  if (eye) oph += 35;

  const items: DifferentialItem[] = [
    {
      id: "neurodevelopmental",
      title: "Neurodevelopmental / epilepsy genetics",
      score: clamp(neuro),
      supporting: labelsFor(c, ["HP:0001263", "HP:0001250", "HP:0001276", "HP:0001268", "HP:0004322", "HP:0001290"]),
      missingDiscriminators: [
        "Regression vs static course",
        "Seizure semiology and EEG summary",
        "Head growth pattern (micro/macrocephaly)",
      ],
      notes: [
        "Prioritizes when developmental delay, seizures, ataxia, or regression features are present.",
      ],
    },
    {
      id: "metabolic_mito",
      title: "Metabolic / mitochondrial",
      score: clamp(metabolic),
      supporting: labelsFor(c, ["HP:0002376", "HP:0001943", "HP:0002151", "HP:0001268"]),
      missingDiscriminators: [
        "Triggers (fasting/illness/exertion)",
        "Ammonia, lactate, ketones, acylcarnitine/urine organic acids",
        "Episodic vs progressive pattern",
      ],
      notes: [
        "Prioritizes when episodic decompensation, hypoglycemia, or lactate abnormalities are present.",
      ],
    },
    {
      id: "neuromuscular",
      title: "Neuromuscular",
      score: clamp(neuromuscular),
      supporting: labelsFor(c, ["HP:0004322", "HP:0001290", "HP:0002015", "HP:0001276"]),
      missingDiscriminators: [
        "Weakness distribution (proximal/distal)",
        "CK level and EMG/NCS summary (if done)",
        "Respiratory/bulbar involvement",
      ],
      notes: ["Prioritizes when hypotonia, weakness, dysphagia, or motor concerns cluster."],
    },
    {
      id: "connective_skeletal",
      title: "Connective tissue / skeletal dysplasia",
      score: clamp(connective),
      supporting: labelsFor(c, ["HP:0000924", "HP:0001510"]),
      missingDiscriminators: [
        "Joint hypermobility, fractures, scoliosis",
        "Radiology summary (skeletal survey if indicated)",
        "Cardiac findings (echo if connective tissue concern)",
      ],
      notes: ["Prioritizes when skeletal system findings or growth delay are prominent."],
    },
    {
      id: "ophthalmologic",
      title: "Ophthalmologic / syndromic",
      score: clamp(oph),
      supporting: labelsFor(c, ["HP:0000478"]),
      missingDiscriminators: [
        "Retina/optic nerve findings",
        "Hearing status",
        "Any syndromic features across systems",
      ],
      notes: ["Prioritizes when eye findings are part of the presentation."],
    },
  ];

  // Ensure stable ordering and drop low-value clutter
  return items
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score >= 20);
}

function growthDelay(c: PatientCase) {
  return c.phenotypes.some((p) => p.id === "HP:0001510");
}