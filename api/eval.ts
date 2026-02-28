import { VIGNETTES } from "../src/data/vignettes";
import { recommendNextSteps } from "../src/engine/recommender";

// Baseline “disease/domain ranking-only” proxy:
// returns a single generic action policy that does NOT adapt well.
function baselineActionIds() {
  return ["refine_targeted_phenotyping"]; // intentionally generic baseline
}

function topKHit(recoIds: string[], gold: string[], k: number) {
  const top = new Set(recoIds.slice(0, k));
  return gold.some((g) => top.has(g));
}

// Stepwise replay: start with 1 phenotype, then add one at a time
function stepsUntilHit(fullCase: any, gold: string[], k: number, policy: (c: any) => string[]) {
  const phenos = fullCase.phenotypes ?? [];
  for (let step = 1; step <= Math.max(1, phenos.length); step++) {
    const partial = { ...fullCase, phenotypes: phenos.slice(0, step) };
    const ids = policy(partial);
    if (topKHit(ids, gold, k)) return step;
  }
  return Infinity;
}

// Robustness: drop X% phenotypes randomly (seeded)
function dropPhenotypes(fullCase: any, dropRate: number) {
  const phenos = [...(fullCase.phenotypes ?? [])];
  // deterministic shuffle-ish
  phenos.sort((a, b) => (a.id > b.id ? 1 : -1));
  const keepCount = Math.max(1, Math.round(phenos.length * (1 - dropRate)));
  return { ...fullCase, phenotypes: phenos.slice(0, keepCount) };
}

function policyOur(c: any) {
  return recommendNextSteps(c).map((r) => r.id);
}

function confidenceOfTop1(c: any): "low" | "medium" | "high" {
  const r = recommendNextSteps(c)[0];
  return r?.confidence ?? "low";
}

function main() {
  const n = VIGNETTES.length;

  let top1 = 0, top3 = 0, top5 = 0;

  let stepsOur = 0, stepsBase = 0;
  let stepsOurCount = 0, stepsBaseCount = 0;

  const robustRates: Record<string, number> = { "0.3": 0, "0.6": 0 };
  const confBins: Record<string, { correct: number; total: number }> = {
    low: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    high: { correct: 0, total: 0 },
  };

  for (const v of VIGNETTES) {
    const ids = policyOur(v.caseData);

    if (topKHit(ids, v.goldNextActionIds, 1)) top1++;
    if (topKHit(ids, v.goldNextActionIds, 3)) top3++;
    if (topKHit(ids, v.goldNextActionIds, 5)) top5++;

    // stepwise replay (top-3)
    const sOur = stepsUntilHit(v.caseData, v.goldNextActionIds, 3, policyOur);
    const sBase = stepsUntilHit(v.caseData, v.goldNextActionIds, 3, () => baselineActionIds());
    if (Number.isFinite(sOur)) { stepsOur += sOur; stepsOurCount++; }
    if (Number.isFinite(sBase)) { stepsBase += sBase; stepsBaseCount++; }

    // robustness drop tests
    for (const r of [0.3, 0.6]) {
      const dropped = dropPhenotypes(v.caseData, r);
      const idsDropped = policyOur(dropped);
      if (topKHit(idsDropped, v.goldNextActionIds, 3)) robustRates[String(r)]++;
    }

    // calibration: does confidence correlate with correctness? (top-1 correctness)
    const conf = confidenceOfTop1(v.caseData);
    confBins[conf].total++;
    if (topKHit(ids, v.goldNextActionIds, 1)) confBins[conf].correct++;
  }

  console.log("== Next-Best-Step Copilot Evaluation ==");
  console.log(`Cases: ${n}`);
  console.log("");
  console.log(`Top-1 hit: ${top1}/${n}`);
  console.log(`Top-3 hit: ${top3}/${n}`);
  console.log(`Top-5 hit: ${top5}/${n}`);
  console.log("");

  console.log("Stepwise replay (steps until gold action appears in Top-3):");
  console.log(`Our policy avg steps: ${stepsOurCount ? (stepsOur / stepsOurCount).toFixed(2) : "n/a"}`);
  console.log(`Baseline avg steps:   ${stepsBaseCount ? (stepsBase / stepsBaseCount).toFixed(2) : "n/a"}`);
  console.log("");

  console.log("Robustness (Top-3 hit after phenotype drop):");
  console.log(`Drop 30%: ${robustRates["0.3"]}/${n}`);
  console.log(`Drop 60%: ${robustRates["0.6"]}/${n}`);
  console.log("");

  console.log("Calibration proxy (Top-1 correctness by confidence bucket):");
  (["low", "medium", "high"] as const).forEach((k) => {
    const b = confBins[k];
    const rate = b.total ? (b.correct / b.total) : 0;
    console.log(`${k}: ${b.correct}/${b.total} (${(rate * 100).toFixed(1)}%)`);
  });

  console.log("");
  console.log("Note: This is an MVP evaluation harness; expand vignettes for stronger evidence.");
}

main();