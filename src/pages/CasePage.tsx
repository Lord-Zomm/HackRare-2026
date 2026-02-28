import { useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import {
  CardActionArea,
  Collapse,
  IconButton,
} from "@mui/material";

import { HPO_LITE } from "../data/hpo-lite";
import type { PatientCase } from "../types/case";
import type { RecommendedAction } from "../types/reco";
import { recommendNextSteps } from "../engine/recommender";

import { buildDifferential } from "../engine/differential";
import type { DifferentialItem } from "../types/differential";

type ExpandMoreProps = {
  expanded: boolean;
};

function ExpandMore({ expanded }: ExpandMoreProps) {
  return (
    <IconButton
      size="small"
      disableRipple
      sx={{
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 150ms ease",
        color: "#5f6368",
      }}
      aria-label="expand"
    >
      <ExpandMoreIcon />
    </IconButton>
  );
}

const STORAGE_KEY = "genomic_copilot_saved_case_v1";

const inheritanceOptions = [
  { value: "unknown", label: "Unknown" },
  { value: "de_novo", label: "De novo suspected" },
  { value: "ad", label: "Autosomal dominant" },
  { value: "ar", label: "Autosomal recessive" },
  { value: "x_linked", label: "X-linked" },
  { value: "mitochondrial", label: "Mitochondrial" },
] as const;

const priorTestTypeOptions = [
  { value: "none", label: "None / unknown" },
  { value: "panel", label: "Targeted panel" },
  { value: "exome", label: "Exome" },
  { value: "genome", label: "Genome" },
] as const;

const priorResultOptions = [
  { value: "na", label: "N/A" },
  { value: "negative", label: "Negative" },
  { value: "vus", label: "VUS" },
  { value: "positive", label: "Positive" },
] as const;

function completenessScore(c: PatientCase) {
  let score = 0;
  if (c.title.trim().length > 0) score += 20;
  if (c.onsetAgeYears !== undefined) score += 20;
  if (c.phenotypes.length >= 2) score += 25;
  if (c.priorTesting.type !== "none") score += 20;
  if (c.familyHistory.inheritanceHint !== "unknown" || c.familyHistory.affectedRelatives) score += 15;
  return Math.min(100, score);
}

function confidenceChip(conf: RecommendedAction["confidence"]) {
  if (conf === "high") return <Chip label="High confidence" size="small" />;
  if (conf === "medium") return <Chip label="Medium confidence" size="small" />;
  return <Chip label="Low confidence" size="small" />;
}

export function CasePage() {
  const [title, setTitle] = useState("New case");
  const [onsetAgeYears, setOnsetAgeYears] = useState<string>("");
  const [phenotypes, setPhenotypes] = useState(HPO_LITE.slice(0, 0));
  const [severity, setSeverity] = useState<PatientCase["severity"]>("unknown");

  const [consanguinity, setConsanguinity] = useState(false);
  const [affectedRelatives, setAffectedRelatives] = useState(false);
  const [inheritanceHint, setInheritanceHint] =
    useState<PatientCase["familyHistory"]["inheritanceHint"]>("unknown");

  const [priorType, setPriorType] = useState<PatientCase["priorTesting"]["type"]>("none");
  const [priorYear, setPriorYear] = useState<string>("");
  const [priorResult, setPriorResult] = useState<PatientCase["priorTesting"]["result"]>("na");
  const [priorNotes, setPriorNotes] = useState("");

  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({});
    const [expandedDiff, setExpandedDiff] = useState<Record<string, boolean>>({});

    const toggleAction = (id: string) =>
    setExpandedActions((s) => ({ ...s, [id]: !s[id] }));

    const toggleDiff = (id: string) =>
    setExpandedDiff((s) => ({ ...s, [id]: !s[id] }));

  const patientCase: PatientCase = useMemo(
    () => ({
      id: "interactive",
      title,
      severity,
      onsetAgeYears: onsetAgeYears.trim() === "" ? undefined : Number(onsetAgeYears),
      phenotypes,
      familyHistory: { consanguinity, affectedRelatives, inheritanceHint },
      priorTesting: {
        type: priorType,
        year: priorYear.trim() === "" ? undefined : Number(priorYear),
        result: priorResult,
        notes: priorNotes.trim() === "" ? undefined : priorNotes,
      },
    }),
    [
      title,
      onsetAgeYears,
      phenotypes,
      consanguinity,
      affectedRelatives,
      inheritanceHint,
      priorType,
      priorYear,
      priorResult,
      priorNotes,
    ]
  );

  const diff: DifferentialItem[] = useMemo(() => buildDifferential(patientCase), [patientCase]);

  const recs = useMemo(() => recommendNextSteps(patientCase), [patientCase]);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (patientCase.onsetAgeYears === undefined) m.push("onset age");
    if (patientCase.phenotypes.length < 2) m.push("additional phenotypes");
    if (patientCase.priorTesting.type === "none") m.push("prior testing details");
    return m;
  }, [patientCase]);

  const completeness = useMemo(() => completenessScore(patientCase), [patientCase]);

  const loadExample = () => {
    setTitle("Example: GDD + seizures, prior panel negative");
    setOnsetAgeYears("1");
    setPhenotypes([
      HPO_LITE.find((x) => x.id === "HP:0001263")!,
      HPO_LITE.find((x) => x.id === "HP:0001250")!,
      HPO_LITE.find((x) => x.id === "HP:0004322")!,
    ]);
    setConsanguinity(false);
    setAffectedRelatives(false);
    setSeverity("moderate");
    setInheritanceHint("ad");
    setPriorType("panel");
    setPriorYear("2022");
    setPriorResult("negative");
    setPriorNotes("Epilepsy panel negative; CNV status unclear");
  };

  const reset = () => {
    setTitle("New case");
    setOnsetAgeYears("");
    setPhenotypes([]);
    setConsanguinity(false);
    setAffectedRelatives(false);
    setInheritanceHint("unknown");
    setPriorType("none");
    setPriorYear("");
    setPriorResult("na");
    setPriorNotes("");
    setSeverity("unknown");
  };

  const saveCase = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patientCase));
  };

  const loadSaved = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const c = JSON.parse(raw) as PatientCase;

    setTitle(c.title ?? "Loaded case");
    setOnsetAgeYears(c.onsetAgeYears === undefined ? "" : String(c.onsetAgeYears));
    setPhenotypes(c.phenotypes ?? []);
    setConsanguinity(!!c.familyHistory?.consanguinity);
    setAffectedRelatives(!!c.familyHistory?.affectedRelatives);
    setInheritanceHint((c.familyHistory?.inheritanceHint as any) ?? "unknown");
    setPriorType((c.priorTesting?.type as any) ?? "none");
    setPriorYear(c.priorTesting?.year === undefined ? "" : String(c.priorTesting.year));
    setPriorResult((c.priorTesting?.result as any) ?? "na");
    setPriorNotes(c.priorTesting?.notes ?? "");
  };

  const exportJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(patientCase, null, 2));
  };

  const top3 = recs.slice(0, 3);
  const others = recs.slice(3, 8);

  return (
    <Stack spacing={2}>
      {/* Summary header */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#202124" }}>
                Recommended next actions
              </Typography>
              <Typography sx={{ color: "#5f6368" }}>
                Enter case information to review suggested next actions and missing details.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
              <Button startIcon={<SaveIcon />} variant="outlined" onClick={saveCase} sx={{ textTransform: "none" }}>
                Save
              </Button>
              <Button startIcon={<RestoreIcon />} variant="outlined" onClick={loadSaved} sx={{ textTransform: "none" }}>
                Load
              </Button>
              <Tooltip title="Copies the case JSON to clipboard">
                <Button startIcon={<ContentCopyIcon />} variant="outlined" onClick={exportJson} sx={{ textTransform: "none" }}>
                  Export JSON
                </Button>
              </Tooltip>
              <Button startIcon={<RestartAltIcon />} variant="text" onClick={reset} sx={{ textTransform: "none" }}>
                Reset
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

        <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Typography sx={{ fontWeight: 700, color: "#202124", fontSize: 13 }}>
            Completeness
            </Typography>

            <Typography sx={{ color: "#5f6368", fontSize: 13 }}>
            {completeness}% • Phenotypes: {patientCase.phenotypes.length} • Prior testing: {patientCase.priorTesting.type}
            </Typography>

            {missing.length > 0 && (
            <Typography sx={{ color: "#5f6368", fontSize: 13 }}>
            •&nbsp;&nbsp;Missing: <b>{missing.join(", ")}</b>
            </Typography>
            )}
        </Stack>

        <LinearProgress variant="determinate" value={completeness} sx={{ height: 6, borderRadius: 999 }} />
        </Stack>
        </CardContent>
      </Card>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
        {/* Left: Inputs */}
        <Box sx={{ flex: 1, minWidth: 360 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography sx={{ fontWeight: 800, color: "#202124" }}>Case</Typography>
                <TextField fullWidth label="Case title" value={title} onChange={(e) => setTitle(e.target.value)} />

                <TextField
                select
                fullWidth
                label="Severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                helperText="Overall clinical severity; used to prioritize urgency/referral."
                >
                <MenuItem value="unknown">Unknown</MenuItem>
                <MenuItem value="mild">Mild</MenuItem>
                <MenuItem value="moderate">Moderate</MenuItem>
                <MenuItem value="severe">Severe</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  label="Onset age (years)"
                  value={onsetAgeYears}
                  onChange={(e) => setOnsetAgeYears(e.target.value)}
                  inputMode="numeric"
                  helperText="Leave blank if unknown."
                />

                <Autocomplete
                  multiple
                  options={HPO_LITE}
                  getOptionLabel={(o) => `${o.label} (${o.id})`}
                  value={phenotypes}
                  onChange={(_, v) => setPhenotypes(v)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Phenotypes"
                      placeholder="Search + add"
                      helperText="Start with 2–5 key findings."
                    />
                  )}
                />

                <Divider />

                <Typography sx={{ fontWeight: 800, color: "#202124" }}>Family history</Typography>

                <Stack direction="row" spacing={1}>
                  <Chip
                    label={consanguinity ? "Consanguinity: yes" : "Consanguinity: no"}
                    variant={consanguinity ? "filled" : "outlined"}
                    onClick={() => setConsanguinity((v) => !v)}
                  />
                  <Chip
                    label={affectedRelatives ? "Affected relatives: yes" : "Affected relatives: no"}
                    variant={affectedRelatives ? "filled" : "outlined"}
                    onClick={() => setAffectedRelatives((v) => !v)}
                  />
                </Stack>

                <TextField
                  select
                  fullWidth
                  label="Inheritance hint"
                  value={inheritanceHint}
                  onChange={(e) => setInheritanceHint(e.target.value as any)}
                >
                  {inheritanceOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>

                <Divider />

                <Typography sx={{ fontWeight: 800, color: "#202124" }}>Prior testing</Typography>

                <TextField select fullWidth label="Test type" value={priorType} onChange={(e) => setPriorType(e.target.value as any)}>
                  {priorTestTypeOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Test year (optional)"
                    value={priorYear}
                    onChange={(e) => setPriorYear(e.target.value)}
                    inputMode="numeric"
                  />
                  <TextField
                    select
                    fullWidth
                    label="Result"
                    value={priorResult}
                    onChange={(e) => setPriorResult(e.target.value as any)}
                  >
                    {priorResultOptions.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Notes (optional)"
                  value={priorNotes}
                  onChange={(e) => setPriorNotes(e.target.value)}
                />

                <Divider />

                <Button onClick={loadExample} variant="contained" sx={{ textTransform: "none" }}>
                  Load example case
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Right: Recommendations */}
        <Box sx={{ flex: 1.2 }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Typography sx={{ fontWeight: 900, color: "#202124", mb: 1 }}>
                  Top recommendations
                </Typography>

                <Stack spacing={1.5}>
                  {top3.map((r) => {
                    const isOpen = !!expandedActions[r.id];

                    return (
                        <Card key={r.id} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                        <CardActionArea onClick={() => toggleAction(r.id)} sx={{ p: 2 }}>
                            <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            >
                            <Box sx={{ pr: 1, flex: 1 }}>
                                <Typography sx={{ fontWeight: 900, color: "#202124" }}>{r.title}</Typography>

                                <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                                <Chip size="small" label={r.category.replaceAll("_", " ")} />
                                {confidenceChip(r.confidence)}
                                <Typography sx={{ color: "#5f6368", fontSize: 13 }}>
                                    {isOpen ? "Hide" : "More"}
                                </Typography>
                                </Stack>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{ minWidth: 140 }}>
                                <Typography sx={{ fontWeight: 900, color: "#202124" }}>{r.score}</Typography>
                                <LinearProgress variant="determinate" value={r.score} />
                                <Typography sx={{ color: "#5f6368", fontSize: 12, mt: 0.5 }}>Priority</Typography>
                                </Box>

                                <ExpandMore expanded={isOpen} />
                            </Stack>
                            </Stack>
                        </CardActionArea>

                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                            <Divider />
                            <Box sx={{ p: 2, bgcolor: "#fcfcfc" }}>
                            <Typography sx={{ fontWeight: 800, color: "#202124", mb: 0.5 }}>Why</Typography>
                            <ul style={{ marginTop: 6, color: "#3c4043" }}>
                                {r.reasons.map((x, i) => (
                                <li key={i}>{x}</li>
                                ))}
                            </ul>

                            <Typography sx={{ fontWeight: 800, color: "#202124", mb: 0.5 }}>What would change</Typography>
                            <ul style={{ marginTop: 6, color: "#3c4043" }}>
                                {r.whatWouldChange.map((x, i) => (
                                <li key={i}>{x}</li>
                                ))}
                            </ul>

                            {r.suggestedQuestions?.length ? (
                                <>
                                <Typography sx={{ fontWeight: 800, color: "#202124", mb: 0.5 }}>Suggested questions</Typography>
                                <ul style={{ marginTop: 6, color: "#3c4043" }}>
                                    {r.suggestedQuestions.map((x, i) => (
                                    <li key={i}>{x}</li>
                                    ))}
                                </ul>
                                </>
                            ) : null}

                            {r.safetyNotes?.length ? (
                                <>
                                <Typography sx={{ fontWeight: 800, color: "#202124", mb: 0.5 }}>Safety notes</Typography>
                                <ul style={{ marginTop: 6, color: "#3c4043" }}>
                                    {r.safetyNotes.map((x, i) => (
                                    <li key={i}>{x}</li>
                                    ))}
                                </ul>
                                </>
                            ) : null}
                            </Box>
                        </Collapse>
                        </Card>
                    );
                    })}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
  <CardContent>
    <Typography sx={{ fontWeight: 900, color: "#202124", mb: 1 }}>
      Differential focus areas
    </Typography>
    <Typography sx={{ color: "#5f6368", mb: 2 }}>
      Ranked diagnostic domains based on the current phenotype profile (not a diagnosis).
    </Typography>

    <Stack spacing={1}>
      {diff.slice(0, 4).map((d) => {
        const isOpen = !!expandedDiff[d.id];

        return (
            <Box key={d.id} sx={{ border: "1px solid #eee", borderRadius: 2, bgcolor: "white", overflow: "hidden" }}>
            <CardActionArea onClick={() => toggleDiff(d.id)} sx={{ p: 1.5 }}>
                <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                >
                <Box sx={{ pr: 1, flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, color: "#202124" }}>{d.title}</Typography>
                    <Typography sx={{ color: "#5f6368", fontSize: 12, mt: 0.5 }}>
                    Supporting: {d.supporting.length ? d.supporting.join(", ") : "—"}
                    </Typography>

                    <Typography sx={{ color: "#5f6368", fontSize: 13, mt: 0.75 }}>
                    {isOpen ? "Hide" : "More"}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ minWidth: 120 }}>
                    <Typography sx={{ fontWeight: 900, color: "#202124" }}>{d.score}</Typography>
                    <LinearProgress variant="determinate" value={d.score} />
                    </Box>

                    <ExpandMore expanded={isOpen} />
                </Stack>
                </Stack>
            </CardActionArea>

            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <Divider />
                <Box sx={{ p: 1.5, bgcolor: "#fcfcfc" }}>
                <Typography sx={{ fontWeight: 800, color: "#202124", mb: 0.5 }}>Why</Typography>
                <ul style={{ marginTop: 6, color: "#3c4043" }}>
                    {d.notes.map((x, i) => (
                    <li key={i}>{x}</li>
                    ))}
                </ul>

                <Typography sx={{ fontWeight: 800, color: "#202124", mb: 0.5 }}>What would change this</Typography>
                <ul style={{ marginTop: 6, color: "#3c4043" }}>
                    {d.missingDiscriminators.map((x, i) => (
                    <li key={i}>{x}</li>
                    ))}
                </ul>
                </Box>
            </Collapse>
            </Box>
        );
        })}
    </Stack>
  </CardContent>
</Card>

            {others.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography sx={{ fontWeight: 900, color: "#202124", mb: 1 }}>
                    Additional options
                  </Typography>
                  <Stack spacing={1}>
                    {others.map((r) => (
                      <Box key={r.id} sx={{ p: 1.5, border: "1px solid #eee", borderRadius: 2, bgcolor: "white" }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                          <Box>
                            <Typography sx={{ fontWeight: 800, color: "#202124" }}>{r.title}</Typography>
                            <Typography sx={{ color: "#5f6368", fontSize: 12 }}>
                              {r.category.replaceAll("_", " ")} • {r.confidence} confidence
                            </Typography>
                          </Box>
                          <Box sx={{ minWidth: 120 }}>
                            <Typography sx={{ fontWeight: 900, color: "#202124" }}>{r.score}</Typography>
                            <LinearProgress variant="determinate" value={r.score} />
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}