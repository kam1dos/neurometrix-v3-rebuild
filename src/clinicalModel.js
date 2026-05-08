const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const average = (values) => {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
};

const zPercentile = (z, reverse = false) => {
  const raw = reverse ? 50 * (1 - erf(z / Math.sqrt(2))) : 50 * (1 + erf(z / Math.sqrt(2)));
  return clamp(Math.round(raw), 1, 99);
};

const erf = (x) => {
  const sign = x >= 0 ? 1 : -1;
  const value = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * value);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-(value * value));
  return sign * y;
};

export const CARE_TRACKS = [
  'ReCODE prevention',
  'Mild cognitive symptoms',
  'Longitudinal follow-up',
  'Post-concussion recovery',
  'Research cohort',
];

export const SEX_OPTIONS = [
  { value: 'F', label: 'Female' },
  { value: 'M', label: 'Male' },
  { value: 'O', label: 'Other / undisclosed' },
];

export const DOMAIN_LABELS = {
  orientationLanguage: 'Orientation + Language',
  processingSpeed: 'Processing Speed',
  executiveControl: 'Executive Control',
  workingMemory: 'Working Memory',
  memory: 'Learning + Memory',
};

export const BIOMARKER_FIELDS = {
  fastingInsulin: { label: 'Fasting insulin', unit: 'µIU/mL', optimal: '< 5', concern: 10, severe: 15, direction: 'lower' },
  fastingGlucose: { label: 'Fasting glucose', unit: 'mg/dL', optimal: '< 90', concern: 100, severe: 126, direction: 'lower' },
  hbA1c: { label: 'HbA1c', unit: '%', optimal: '< 5.3', concern: 5.7, severe: 6.5, direction: 'lower' },
  hsCRP: { label: 'hs-CRP', unit: 'mg/L', optimal: '< 0.9', concern: 1.0, severe: 3.0, direction: 'lower' },
  homocysteine: { label: 'Homocysteine', unit: 'µmol/L', optimal: '< 7', concern: 10, severe: 15, direction: 'lower' },
  vitaminD: { label: 'Vitamin D', unit: 'ng/mL', optimal: '> 50', concern: 40, severe: 30, direction: 'higher' },
  vitaminB12: { label: 'Vitamin B12', unit: 'pg/mL', optimal: '> 500', concern: 500, severe: 300, direction: 'higher' },
  tsh: { label: 'TSH', unit: 'mIU/L', optimal: '1.0 - 2.0', concern: 2.5, severe: 4.0, direction: 'lower' },
  freeT3: { label: 'Free T3', unit: 'pg/mL', optimal: '> 3.2', concern: 3.0, severe: 2.5, direction: 'higher' },
  testosterone: { label: 'Testosterone', unit: 'ng/dL', optimal: '> 500', concern: 400, severe: 300, direction: 'higher' },
  dheas: { label: 'DHEA-S', unit: 'µg/dL', optimal: '> 150', concern: 100, severe: 50, direction: 'higher' },
  omega3Index: { label: 'Omega-3 index', unit: '%', optimal: '> 8', concern: 6, severe: 4, direction: 'higher' },
  ldl: { label: 'LDL-C', unit: 'mg/dL', optimal: '< 80', concern: 100, severe: 130, direction: 'lower' },
};

export const ASSESSMENT_LIBRARY = {
  orientation: {
    id: 'orientation',
    title: 'Orientation screen',
    subtitle: 'MoCA-aligned domain coverage without reproducing the proprietary instrument.',
    domain: 'orientationLanguage',
    duration: '3 min',
    mode: 'clinician-scored',
  },
  symbolMatch: {
    id: 'symbolMatch',
    title: 'Symbol match',
    subtitle: 'Creyos-style digital speed and sustained attention task.',
    domain: 'processingSpeed',
    duration: '2 min',
    mode: 'digital',
  },
  trailA: {
    id: 'trailA',
    title: 'Trail connect A',
    subtitle: 'Visual scanning and sequencing speed.',
    domain: 'processingSpeed',
    duration: '2 min',
    mode: 'digital',
  },
  trailB: {
    id: 'trailB',
    title: 'Trail connect B',
    subtitle: 'Set shifting and cognitive flexibility.',
    domain: 'executiveControl',
    duration: '3 min',
    mode: 'digital',
  },
  stroop: {
    id: 'stroop',
    title: 'Color-word interference',
    subtitle: 'Digital inhibitory control and interference cost.',
    domain: 'executiveControl',
    duration: '3 min',
    mode: 'digital',
  },
  spanForward: {
    id: 'spanForward',
    title: 'Pattern span forward',
    subtitle: 'Visuospatial attention and immediate span.',
    domain: 'workingMemory',
    duration: '2 min',
    mode: 'digital',
  },
  spanBackward: {
    id: 'spanBackward',
    title: 'Pattern span backward',
    subtitle: 'Manipulation and working memory load.',
    domain: 'workingMemory',
    duration: '2 min',
    mode: 'digital',
  },
  fluency: {
    id: 'fluency',
    title: 'Category fluency',
    subtitle: 'Timed semantic generation with perseveration tracking.',
    domain: 'orientationLanguage',
    duration: '1 min',
    mode: 'digital',
  },
  verbalLearning: {
    id: 'verbalLearning',
    title: 'List learning + delayed recall',
    subtitle: 'Clinician-entered memory summary for multi-trial encoding and delayed recall.',
    domain: 'memory',
    duration: '4 min',
    mode: 'clinician-scored',
  },
};

export const PROTOCOL_LIBRARY = [
  {
    id: 'recode-baseline',
    name: 'ReCODE Baseline',
    audience: 'Prevention and longitudinal functional medicine programs',
    summary: 'Broad baseline spanning processing speed, executive control, memory, language, orientation, and biomarker risk context.',
    assessments: ['orientation', 'symbolMatch', 'trailA', 'trailB', 'stroop', 'spanForward', 'spanBackward', 'fluency', 'verbalLearning'],
    emphasis: ['Metabolic', 'Inflammatory', 'Atrophic', 'Toxic pattern watch'],
  },
  {
    id: 'moca-aligned-screen',
    name: 'MoCA-Aligned Screen',
    audience: 'Office screening and quick triage',
    summary: 'A brief, domain-oriented screen inspired by common office cognitive screens without reproducing licensed test content.',
    assessments: ['orientation', 'trailB', 'spanForward', 'fluency', 'verbalLearning'],
    emphasis: ['Language', 'Executive switching', 'Delayed recall'],
  },
  {
    id: 'digital-follow-up',
    name: 'Digital Follow-up',
    audience: 'Repeat testing and high-frequency monitoring',
    summary: 'Creyos-style digital follow-up emphasizing repeatable speed, inhibition, and working-memory measures.',
    assessments: ['symbolMatch', 'trailA', 'trailB', 'stroop', 'spanForward', 'spanBackward', 'fluency'],
    emphasis: ['Repeatability', 'Reaction time', 'Longitudinal trend sensitivity'],
  },
];

export const VERBAL_WORD_BANK = [
  'BUTTER',
  'ARM',
  'SHORE',
  'LETTER',
  'QUEEN',
  'CABIN',
  'POLE',
  'TICKET',
  'GRASS',
  'ENGINE',
];

export const STROOP_COLORS = [
  { name: 'RED', hex: '#d9485f' },
  { name: 'BLUE', hex: '#2c6bed' },
  { name: 'GREEN', hex: '#18976d' },
  { name: 'YELLOW', hex: '#d8a11c' },
];

export const SDMT_KEY_MAP = [
  { num: 1, sym: '◇' },
  { num: 2, sym: '△' },
  { num: 3, sym: '○' },
  { num: 4, sym: '□' },
  { num: 5, sym: '☆' },
  { num: 6, sym: '◈' },
  { num: 7, sym: '▽' },
  { num: 8, sym: '⬡' },
  { num: 9, sym: '⬢' },
];

export const getProtocolById = (protocolId) =>
  PROTOCOL_LIBRARY.find((protocol) => protocol.id === protocolId) ?? PROTOCOL_LIBRARY[0];

export const percentileDescriptor = (percentile) => {
  if (percentile == null) return 'Pending';
  if (percentile >= 75) return 'Strong';
  if (percentile >= 40) return 'Expected';
  if (percentile >= 20) return 'Watch';
  return 'Concern';
};

export const biomarkerStatus = (field, value) => {
  const config = BIOMARKER_FIELDS[field];
  if (!config || value == null || Number.isNaN(value)) return 'neutral';
  if (config.direction === 'higher') {
    if (value < config.severe) return 'severe';
    if (value < config.concern) return 'concern';
    return 'optimal';
  }
  if (value >= config.severe) return 'severe';
  if (value >= config.concern) return 'concern';
  return 'optimal';
};

const scoreByDistribution = ({ rawScore, expected, sd, reverse = false }) => {
  if (!Number.isFinite(rawScore) || !Number.isFinite(expected) || !Number.isFinite(sd) || sd <= 0) return null;
  const z = (rawScore - expected) / sd;
  return zPercentile(z, reverse);
};

const orientationPercentile = (score) => {
  const lookup = [1, 3, 8, 16, 37, 63, 84];
  return lookup[clamp(score, 0, 6)];
};

export const scoreAssessment = (assessmentId, result, patient) => {
  const age = Number(patient.ageAtBaseline ?? patient.age ?? 55);
  const education = Number(patient.educationYears ?? patient.education ?? 16);
  let percentile = null;

  switch (assessmentId) {
    case 'symbolMatch':
      percentile = scoreByDistribution({
        rawScore: result.throughput,
        expected: Math.max(18, 58 - 0.35 * (age - 50) + 0.7 * (education - 12)),
        sd: 10,
      });
      break;
    case 'trailA':
      percentile = scoreByDistribution({
        rawScore: result.completionTimeMs,
        expected: 29000 + 900 * (age - 50) - 500 * (education - 12),
        sd: 9000,
        reverse: true,
      });
      break;
    case 'trailB':
      percentile = scoreByDistribution({
        rawScore: result.completionTimeMs,
        expected: 75000 + 2000 * (age - 50) - 1000 * (education - 12),
        sd: 25000,
        reverse: true,
      });
      break;
    case 'stroop':
      percentile = scoreByDistribution({
        rawScore: result.interferenceMs,
        expected: 120 + 1.5 * (age - 50) - 2.0 * (education - 12),
        sd: 45,
        reverse: true,
      });
      break;
    case 'spanForward':
      percentile = scoreByDistribution({
        rawScore: result.maxSpan,
        expected: Math.max(3, 6.5 - 0.025 * (age - 50) + 0.05 * (education - 12)),
        sd: 1.2,
      });
      break;
    case 'spanBackward':
      percentile = scoreByDistribution({
        rawScore: result.maxSpan,
        expected: Math.max(2, 5.5 - 0.03 * (age - 50) + 0.06 * (education - 12)),
        sd: 1.2,
      });
      break;
    case 'fluency':
      percentile = scoreByDistribution({
        rawScore: result.uniqueResponses,
        expected: Math.max(8, 22 - 0.12 * (age - 55) + 0.28 * (education - 12)),
        sd: 5,
      });
      break;
    case 'verbalLearning':
      percentile = scoreByDistribution({
        rawScore: result.delayedRecall,
        expected: Math.max(2, 6.5 - 0.04 * (age - 60) + 0.1 * (education - 12)),
        sd: 2,
      });
      break;
    case 'orientation':
      percentile = orientationPercentile(result.score);
      break;
    default:
      percentile = null;
      break;
  }

  return {
    ...result,
    percentile,
    descriptor: percentileDescriptor(percentile),
    completedAt: new Date().toISOString(),
  };
};

export const deriveDomainScores = (assessmentResults) => {
  const get = (assessmentId) => assessmentResults?.[assessmentId]?.percentile ?? null;
  return {
    orientationLanguage: average([get('orientation'), get('fluency')]),
    processingSpeed: average([get('symbolMatch'), get('trailA')]),
    executiveControl: average([get('trailB'), get('stroop')]),
    workingMemory: average([get('spanForward'), get('spanBackward')]),
    memory: average([get('verbalLearning')]),
  };
};

const summarizeBiomarkerSignal = (field, values) => {
  const value = values?.[field];
  if (!Number.isFinite(value)) return null;
  return `${BIOMARKER_FIELDS[field].label}: ${value}${BIOMARKER_FIELDS[field].unit ? ` ${BIOMARKER_FIELDS[field].unit}` : ''}`;
};

export const analyzeRecodeSignals = (domainScores, biomarkerPanel) => {
  const biomarkers = biomarkerPanel?.values ?? biomarkerPanel ?? {};
  const flags = [];

  const low = (domain, threshold = 25) => Number.isFinite(domainScores?.[domain]) && domainScores[domain] < threshold;
  const severe = (field) => biomarkerStatus(field, biomarkers[field]) === 'severe';
  const concern = (field) => {
    const status = biomarkerStatus(field, biomarkers[field]);
    return status === 'concern' || status === 'severe';
  };

  if ((concern('fastingInsulin') || concern('hbA1c') || concern('fastingGlucose')) && (low('processingSpeed') || low('executiveControl'))) {
    flags.push({
      type: 'Type 1.5 metabolic pattern',
      severity: severe('hbA1c') || severe('fastingInsulin') ? 'High' : 'Moderate',
      evidence: [summarizeBiomarkerSignal('fastingInsulin', biomarkers), summarizeBiomarkerSignal('hbA1c', biomarkers), summarizeBiomarkerSignal('fastingGlucose', biomarkers), low('processingSpeed') ? 'Processing speed below expected range' : null, low('executiveControl') ? 'Executive control below expected range' : null].filter(Boolean),
      recommendation: 'Escalate insulin-sensitizing interventions, repeat metabolic labs, and monitor digital speed metrics at follow-up.',
    });
  }

  if ((concern('hsCRP') || concern('homocysteine')) && (low('memory') || low('orientationLanguage'))) {
    flags.push({
      type: 'Inflammatory pattern',
      severity: severe('hsCRP') ? 'High' : 'Moderate',
      evidence: [summarizeBiomarkerSignal('hsCRP', biomarkers), summarizeBiomarkerSignal('homocysteine', biomarkers), low('memory') ? 'Delayed memory below expected range' : null, low('orientationLanguage') ? 'Language/orientation inefficiency' : null].filter(Boolean),
      recommendation: 'Review inflammatory drivers, sleep quality, periodontal/infectious sources, and repeat memory-focused follow-up testing.',
    });
  }

  if ((concern('vitaminD') || concern('vitaminB12') || concern('tsh') || concern('freeT3')) && (low('memory') || low('workingMemory'))) {
    flags.push({
      type: 'Atrophic / trophic support pattern',
      severity: severe('vitaminD') || severe('vitaminB12') ? 'High' : 'Moderate',
      evidence: [summarizeBiomarkerSignal('vitaminD', biomarkers), summarizeBiomarkerSignal('vitaminB12', biomarkers), summarizeBiomarkerSignal('tsh', biomarkers), summarizeBiomarkerSignal('freeT3', biomarkers), low('workingMemory') ? 'Working memory span below expected range' : null, low('memory') ? 'Learning and delayed retention below expected range' : null].filter(Boolean),
      recommendation: 'Tighten trophic support plan: vitamin D, B12/folate pathway, thyroid optimization, and retest memory after correction.',
    });
  }

  if ((concern('ldl') || concern('homocysteine')) && (low('processingSpeed') || low('executiveControl'))) {
    flags.push({
      type: 'Vascular contribution watch',
      severity: severe('ldl') || severe('homocysteine') ? 'High' : 'Moderate',
      evidence: [summarizeBiomarkerSignal('ldl', biomarkers), summarizeBiomarkerSignal('homocysteine', biomarkers), low('processingSpeed') ? 'Speed-sensitive measures suppressed' : null, low('executiveControl') ? 'Switching/inhibition inefficiency' : null].filter(Boolean),
      recommendation: 'Consider vascular risk reduction, blood pressure review, exercise dosing, and repeat speed/executive metrics longitudinally.',
    });
  }

  if (low('executiveControl') && !low('processingSpeed') && flags.length === 0) {
    flags.push({
      type: 'Disproportionate executive pattern',
      severity: 'Moderate',
      evidence: ['Executive control weaker than processing speed baseline'],
      recommendation: 'Review toxic exposure, sleep apnea risk, medication burden, and frontally-loaded functional complaints.',
    });
  }

  if (!flags.length) {
    flags.push({
      type: 'Cognitive resilience profile',
      severity: 'Optimal',
      evidence: ['Current domain scores and biomarker context do not show a dominant ReCODE risk pattern.'],
      recommendation: 'Maintain baseline plan and schedule a longitudinal digital follow-up to track change over time.',
    });
  }

  return flags;
};

export const buildSessionSummary = (patient, session, biomarkerPanel) => {
  const domainScores = deriveDomainScores(session.assessmentResults);
  const recodeSignals = analyzeRecodeSignals(domainScores, biomarkerPanel);
  const overall = average(Object.values(domainScores));
  return {
    overall,
    domainScores,
    recodeSignals,
    narrative: `${patient.patientCode} completed the ${getProtocolById(session.protocolId).name} battery with an overall domain composite of ${overall ?? 'pending'}.`,
  };
};

export const buildTrendSeries = (sessions) =>
  sessions
    .filter((session) => session.status === 'completed')
    .slice()
    .sort((left, right) => new Date(left.startedAt) - new Date(right.startedAt))
    .map((session) => ({
      label: new Date(session.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      overall: session.summary?.overall ?? null,
      speed: session.domainScores?.processingSpeed ?? null,
      memory: session.domainScores?.memory ?? null,
      executive: session.domainScores?.executiveControl ?? null,
    }));

export const getAssessmentHighlights = (assessmentResults) =>
  Object.entries(assessmentResults ?? {})
    .map(([assessmentId, result]) => ({
      id: assessmentId,
      title: ASSESSMENT_LIBRARY[assessmentId]?.title ?? assessmentId,
      percentile: result.percentile,
      descriptor: result.descriptor,
    }))
    .sort((left, right) => (right.percentile ?? 0) - (left.percentile ?? 0));
