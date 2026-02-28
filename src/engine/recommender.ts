import type { PatientCase } from "../types/case";
import type { RecommendedAction } from "../types/reco";
import { ACTIONS_CATALOG } from "./actionsCatalog";

function hasTerm(c: PatientCase, id: string) {
  return c.phenotypes.some((p) => p.id === id);
}

function yearNow() {
  return new Date().getFullYear();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function confidenceFromScore(score: number): "low" | "medium" | "high" {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

type Draft = Omit<RecommendedAction, "confidence">;

function actionBase(id: string) {
  const a = ACTIONS_CATALOG.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown action id: ${id}`);
  return a;
}

export function recommendNextSteps(c: PatientCase): RecommendedAction[] {
  const drafts: Draft[] = [];

  const priorType = c.priorTesting.type;
  const priorResult = c.priorTesting.result;
  const priorYear = c.priorTesting.year;

  const hasSeizures = hasTerm(c, "HP:0001250");
  const hasGDD = hasTerm(c, "HP:0001263");
  const hasEpisodic = hasTerm(c, "HP:0002376");
  const hasHypoglycemia = hasTerm(c, "HP:0001943");
  const hasAtaxia = hasTerm(c, "HP:0001276");
  const hasRegression = hasTerm(c, "HP:0001268");

  // ---------- Completeness / uncertainty ----------
  const missing: string[] = [];
  if (c.onsetAgeYears === undefined) missing.push("onset age");
  if (c.phenotypes.length < 2) missing.push("additional phenotypes");
  if (priorType === "none") missing.push("prior testing details");

  // ---------- Baseline actions (always present) ----------
  // 1) Refining phenotype is always useful, but score depends on missingness
  drafts.push({
    ...actionBase("refine_targeted_phenotyping"),
    score: 55 + (missing.length >= 1 ? 10 : 0),
    reasons: [
      missing.length
        ? `Key information missing (${missing.join(", ")}).`
        : "Improves discrimination and reduces unnecessary testing.",
    ],
    whatWouldChange: [
      "If key features are confirmed or explicitly excluded, testing and referral can be more targeted.",
    ],
  });

  // 2) If prior testing unknown/none, explicitly recommend clarification
  if (priorType === "none") {
    drafts.push({
      ...actionBase("clarify_prior_testing"),
      score: 75,
      reasons: ["The next best step depends strongly on what has already been tested and how."],
      whatWouldChange: [
        "If exome/genome has already been done, reanalysis may be higher value than repeating testing.",
      ],
    });
  }

  // 3) Suggest an appropriate “next genetic test” baseline when nothing has been done
  const phenotypeBreadth = c.phenotypes.length;
  const broadCase = phenotypeBreadth >= 3 || hasGDD || hasRegression || hasAtaxia || hasSeizures;

  if (priorType === "none") {
    if (broadCase) {
      drafts.push({
        ...actionBase("genetic_test_exome"),
        score: 70,
        reasons: ["Broad or multisystem presentations often benefit from a broader genetic test."],
        whatWouldChange: [
          "If phenotype becomes narrow and specific, a targeted panel may be sufficient.",
        ],
      });
    } else {
      drafts.push({
        ...actionBase("genetic_test_panel"),
        score: 62,
        reasons: ["If the phenotype is narrow and well-defined, a targeted panel can be efficient."],
        whatWouldChange: [
          "If additional features emerge or the phenotype broadens, exome may become a better next test.",
        ],
      });
    }
  }

  // ---------- Pattern-based urgency / referral ----------
  if (hasEpisodic || hasHypoglycemia) {
    drafts.push({
      ...actionBase("urgent_metabolic_workup"),
      score: hasEpisodic && hasHypoglycemia ? 95 : 85,
      reasons: [
        hasEpisodic ? "Episodic decompensation can indicate time-sensitive metabolic risk." : "",
        hasHypoglycemia ? "Hypoglycemia increases concern for metabolic/endocrine emergencies." : "",
      ].filter(Boolean),
      whatWouldChange: [
        "If there are current acute symptoms, escalate immediately.",
        "Screening lab results strongly influence next steps.",
      ],
    });

    drafts.push({
      ...actionBase("lab_metabolic_screen"),
      score: 78,
      reasons: ["A targeted screening set can quickly support or reduce metabolic concern."],
      whatWouldChange: ["Abnormal results increase priority for metabolic genetics and focused analysis."],
    });

    drafts.push({
      ...actionBase("ref_metabolic"),
      score: 70,
      reasons: ["Specialty input is high-yield when episodic/metabolic features are suspected."],
      whatWouldChange: ["If screening labs are normal and episodes are not metabolic-like, urgency decreases."],
    });
  }

  // ---------- Neurodevelopmental + seizures ----------
  if ((hasGDD || hasRegression) && hasSeizures) {
    let score = 72;
    const reasons: string[] = [
      "Neurodevelopmental features with seizures often benefit from broader genetic testing.",
    ];

    if (priorType === "panel" && priorResult === "negative") {
      score += 10;
      reasons.push("Prior targeted panel was negative; broader sequencing is a common next step.");
    }

    if (c.familyHistory.inheritanceHint === "de_novo") {
      score += 8;
      reasons.push("Trio sequencing increases interpretability for suspected de novo events.");
    }

    drafts.push({
      ...actionBase("gen_trio_exome"),
      score,
      reasons,
      whatWouldChange: [
        "If parents are not available, consider alternative strategies or careful singleton interpretation.",
      ],
    });

    drafts.push({
      ...actionBase("ref_neurogenetics"),
      score: 65,
      reasons: ["Specialty clinics can refine phenotype and interpret complex results faster."],
      whatWouldChange: ["If symptoms are mild/stable with comprehensive workup, urgency may be lower."],
    });
  }

  // ---------- Reanalysis trigger ----------
  if (priorType === "exome" || priorType === "genome") {
    const age = priorYear ? yearNow() - priorYear : undefined;
    let score = 65;
    const reasons: string[] = ["Reanalysis can convert past negatives as knowledge and pipelines improve."];

    if (age !== undefined && age >= 2) {
      score += 10;
      reasons.push(`Original test is ${age} years old; yield increases over time.`);
    }
    if (hasAtaxia || hasRegression) {
      score += 10;
      reasons.push("Evolving phenotype increases reanalysis value.");
    }
    if (priorResult === "vus") {
      score += 5;
      reasons.push("Existing VUS list is a strong reanalysis target.");
    }

    drafts.push({
      ...actionBase("reanalysis_exome_if_done"),
      score,
      reasons,
      whatWouldChange: [
        "If a recent reanalysis was already done with updated phenotype, value is lower.",
        "If CNV/mtDNA review was not included, broaden scope.",
      ],
    });

    drafts.push({
      ...actionBase("gen_cnv_focus"),
      score: 55,
      reasons: ["CNV analysis is a common gap depending on lab/pipeline."],
      whatWouldChange: ["If CNV calling was already performed and reviewed, deprioritize."],
    });
  }

  // ---------- Merge + ensure minimum actions ----------
  const merged = new Map<string, Draft>();
  for (const d of drafts) {
    const existing = merged.get(d.id);
    if (!existing) merged.set(d.id, d);
    else {
      merged.set(d.id, {
        ...d,
        score: Math.max(d.score, existing.score),
        reasons: Array.from(new Set([...existing.reasons, ...d.reasons])),
        whatWouldChange: Array.from(new Set([...existing.whatWouldChange, ...d.whatWouldChange])),
        safetyNotes: d.safetyNotes ?? existing.safetyNotes,
        suggestedQuestions: d.suggestedQuestions ?? existing.suggestedQuestions,
      });
    }
  }

  // Safe defaults if somehow still <3
  const fallbackIds = ["refine_targeted_phenotyping", "clarify_prior_testing", "genetic_test_exome"];
  for (const id of fallbackIds) {
    if (merged.size >= 3) break;
    if (!merged.has(id)) {
      merged.set(id, {
        ...actionBase(id),
        score: 50,
        reasons: ["Baseline recommendation when limited information is available."],
        whatWouldChange: ["Providing additional clinical detail will refine recommendations."],
      });
    }
  }

  const results: RecommendedAction[] = Array.from(merged.values())
    .map((d) => ({
      ...d,
      score: clamp(Math.round(d.score), 0, 100),
      confidence: confidenceFromScore(d.score),
    }))
    .sort((a, b) => b.score - a.score);

  return results;
}