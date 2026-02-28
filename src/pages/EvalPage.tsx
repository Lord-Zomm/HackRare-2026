import { Card, CardContent, Typography, Divider, Button, Stack } from "@mui/material";
import { useMemo, useState } from "react";
import { VIGNETTES } from "../data/vignettes";
import { recommendNextSteps } from "../engine/recommender";
import type { PatientCase } from "../types/case";

function topKHit(recoIds: string[], gold: string[], k: number) {
  const top = new Set(recoIds.slice(0, k));
  return gold.some((g) => top.has(g));
}

function dropSomePhenotypes(c: PatientCase, dropRate: number): PatientCase {
  const kept = c.phenotypes.filter((_, idx) => (idx % 10) / 10 >= dropRate); // deterministic-ish
  const safeKept = kept.length === 0 ? c.phenotypes.slice(0, 1) : kept;
  return { ...c, phenotypes: safeKept };
}

export function EvalPage() {
  const [ran, setRan] = useState(false);

  const report = useMemo(() => {
    if (!ran) return null;

    let top1 = 0, top3 = 0, top5 = 0;
    let robustTop3 = 0;
    const n = VIGNETTES.length;

    for (const v of VIGNETTES) {
      const recs = recommendNextSteps(v.caseData);
      const ids = recs.map((r) => r.id);

      if (topKHit(ids, v.goldNextActionIds, 1)) top1++;
      if (topKHit(ids, v.goldNextActionIds, 3)) top3++;
      if (topKHit(ids, v.goldNextActionIds, 5)) top5++;

      // robustness: drop 50% of phenotypes and see if still hits top3
      const dropped = dropSomePhenotypes(v.caseData, 0.5);
      const recsDropped = recommendNextSteps(dropped).map((r) => r.id);
      if (topKHit(recsDropped, v.goldNextActionIds, 3)) robustTop3++;
    }

    return {
      cases: n,
      top1: `${top1}/${n}`,
      top3: `${top3}/${n}`,
      top5: `${top5}/${n}`,
      robustTop3: `${robustTop3}/${n}`,
    };
  }, [ran]);

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ color: "#202124", fontWeight: 700 }}>
        Evaluation
      </Typography>
      <Typography sx={{ color: "#5f6368" }}>
        Simple “case replay” on built-in vignettes. Metrics are intentionally straightforward for a hackathon MVP.
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Typography sx={{ fontWeight: 800, color: "#202124" }}>Run evaluation</Typography>
          <Typography sx={{ color: "#5f6368", mb: 2 }}>
            Computes Top-K accuracy for the “correct next step” and a robustness check (drop ~50% phenotypes).
          </Typography>

          <Button variant="contained" onClick={() => setRan(true)} sx={{ textTransform: "none" }}>
            Run
          </Button>

          {report && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography sx={{ fontWeight: 800, color: "#202124" }}>Results</Typography>
              <Typography sx={{ color: "#3c4043" }}>Cases: {report.cases}</Typography>
              <Typography sx={{ color: "#3c4043" }}>Top-1 hit rate: {report.top1}</Typography>
              <Typography sx={{ color: "#3c4043" }}>Top-3 hit rate: {report.top3}</Typography>
              <Typography sx={{ color: "#3c4043" }}>Top-5 hit rate: {report.top5}</Typography>
              <Typography sx={{ color: "#3c4043" }}>Robust Top-3 (50% phenotype drop): {report.robustTop3}</Typography>
            </>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography sx={{ fontWeight: 800, color: "#202124" }}>What to improve next</Typography>
          <ul style={{ marginTop: 8, color: "#3c4043" }}>
            <li>Add more vignettes and stratify by record completeness.</li>
            <li>Add action cost/invasiveness and tailor rankings.</li>
            <li>Add explicit “unknown vs absent” fields and show them in UI.</li>
          </ul>
        </CardContent>
      </Card>
    </Stack>
  );
}