import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cloud,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BIOMARKER_FIELDS,
  CARE_TRACKS,
  DOMAIN_LABELS,
  PROTOCOL_LIBRARY,
  SEX_OPTIONS,
  analyzeRecodeSignals,
  buildTrendSeries,
  getProtocolById,
} from './clinicalModel';
import { Button, Card, EmptyState, MetricCard, Pill, SectionHeading } from './components';
import DatabaseService from './services/database';

const domainKeys = Object.keys(DOMAIN_LABELS);
const biomarkerKeys = ['fastingInsulin', 'fastingGlucose', 'hbA1c', 'hsCRP', 'homocysteine', 'vitaminD'];

const blankPatient = {
  patientCode: '',
  ageAtBaseline: 62,
  educationYears: 16,
  sex: '',
  careTrack: CARE_TRACKS[0],
  preferredProtocolId: PROTOCOL_LIBRARY[0].id,
  isDeidentified: true,
};

const blankScores = {
  orientationLanguage: 55,
  processingSpeed: 55,
  executiveControl: 55,
  workingMemory: 55,
  memory: 55,
};

const blankBiomarkers = {
  fastingInsulin: '',
  fastingGlucose: '',
  hbA1c: '',
  hsCRP: '',
  homocysteine: '',
  vitaminD: '',
};

const averageScore = (values) => {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
};

const parseNumericFields = (values) =>
  Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, value === '' ? null : Number(value)])
      .filter(([, value]) => Number.isFinite(value)),
  );

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending';

const scoreTone = (value) => {
  if (!Number.isFinite(value)) return 'neutral';
  if (value >= 40) return 'accent';
  if (value >= 20) return 'warning';
  return 'neutral';
};

const AuthScreen = ({ onSession }) => {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const data = await DatabaseService.signUp(email.trim(), password);
        if (data.session) {
          onSession(data.session);
        } else {
          setMessage('Account created. Confirm the email address, then sign in.');
        }
      } else {
        const session = await DatabaseService.signIn(email.trim(), password);
        onSession(session);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef7f5_100%)] px-5 py-8 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
            <ShieldCheck size={14} />
            Supabase Online Mode
          </div>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-normal text-slate-950 md:text-6xl">
            NeuroMetrix Clinical Studio
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Sign in to create patients, record repeat cognitive sessions, and trend domain
            scores from the same iPad workflow your clinic will use.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {['Authenticated access', 'Patient sessions', 'Longitudinal trends'].map((item) => (
              <div key={item} className="rounded-2xl border border-white bg-white/80 p-4 text-sm font-semibold text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <Card className="p-6">
          <div className="flex rounded-full bg-slate-100 p-1">
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'signin' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
              onClick={() => setMode('signin')}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'signup' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
              onClick={() => setMode('signup')}
              type="button"
            >
              Create account
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-teal-400"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-teal-400"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            {message ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                {message}
              </div>
            ) : null}
            <Button className="w-full" disabled={busy} type="submit">
              {busy ? 'Working...' : mode === 'signup' ? 'Create account' : 'Sign in'}
              <ArrowRight size={16} />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

const PatientForm = ({ onCreate }) => {
  const [form, setForm] = useState(blankPatient);
  const [busy, setBusy] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    await onCreate(form);
    setForm({ ...blankPatient, patientCode: '' });
    setBusy(false);
  };

  return (
    <Card className="p-5">
      <SectionHeading eyebrow="Registry" title="New Patient" body="Use de-identified patient codes for testing and early pilots." />
      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <input
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-400"
          onChange={(event) => update('patientCode', event.target.value)}
          placeholder="Patient code"
          required
          value={form.patientCode}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-400"
            max="120"
            min="18"
            onChange={(event) => update('ageAtBaseline', Number(event.target.value))}
            placeholder="Age"
            required
            type="number"
            value={form.ageAtBaseline}
          />
          <input
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-400"
            max="30"
            min="0"
            onChange={(event) => update('educationYears', Number(event.target.value))}
            placeholder="Education years"
            required
            type="number"
            value={form.educationYears}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-400"
            onChange={(event) => update('sex', event.target.value)}
            value={form.sex}
          >
            <option value="">Sex</option>
            {SEX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-400"
            onChange={(event) => update('preferredProtocolId', event.target.value)}
            value={form.preferredProtocolId}
          >
            {PROTOCOL_LIBRARY.map((protocol) => (
              <option key={protocol.id} value={protocol.id}>
                {protocol.name}
              </option>
            ))}
          </select>
        </div>
        <select
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-400"
          onChange={(event) => update('careTrack', event.target.value)}
          value={form.careTrack}
        >
          {CARE_TRACKS.map((track) => (
            <option key={track} value={track}>
              {track}
            </option>
          ))}
        </select>
        <Button className="w-full" disabled={busy} type="submit" variant="secondary">
          <UserPlus size={16} />
          {busy ? 'Creating...' : 'Create patient'}
        </Button>
      </form>
    </Card>
  );
};

const SessionRecorder = ({ latestBiomarkerPanel, onSave, patient }) => {
  const [protocolId, setProtocolId] = useState(patient?.preferredProtocolId ?? PROTOCOL_LIBRARY[0].id);
  const [scores, setScores] = useState(blankScores);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProtocolId(patient?.preferredProtocolId ?? PROTOCOL_LIBRARY[0].id);
  }, [patient]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const domainScores = Object.fromEntries(
      domainKeys.map((key) => [key, Math.max(1, Math.min(99, Number(scores[key])))]),
    );
    const overall = averageScore(Object.values(domainScores));
    const recodeSignals = analyzeRecodeSignals(domainScores, latestBiomarkerPanel);
    await onSave({
      protocolId,
      completion: {
        domainScores,
        summary: {
          overall,
          domainScores,
          recodeSignals,
          narrative: `${patient.patientCode} completed the ${getProtocolById(protocolId).name} battery with an overall domain composite of ${overall}.`,
        },
        recommendations: recodeSignals.map((signal) => signal.recommendation),
      },
    });
    setBusy(false);
  };

  return (
    <Card className="p-5">
      <SectionHeading
        eyebrow="Follow-up"
        title="Record Session"
        body="For this emulator pass, enter the final domain percentiles. Full task screens can feed these values next."
      />
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <select
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-400"
          onChange={(event) => setProtocolId(event.target.value)}
          value={protocolId}
        >
          {PROTOCOL_LIBRARY.map((protocol) => (
            <option key={protocol.id} value={protocol.id}>
              {protocol.name}
            </option>
          ))}
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          {domainKeys.map((key) => (
            <label key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {DOMAIN_LABELS[key]}
              </span>
              <input
                className="mt-2 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-400"
                max="99"
                min="1"
                onChange={(event) => setScores((current) => ({ ...current, [key]: event.target.value }))}
                type="number"
                value={scores[key]}
              />
            </label>
          ))}
        </div>
        <Button className="w-full" disabled={busy} type="submit">
          <CheckCircle2 size={16} />
          {busy ? 'Saving...' : 'Save completed session'}
        </Button>
      </form>
    </Card>
  );
};

const BiomarkerPanel = ({ latestPanel, onSave }) => {
  const [values, setValues] = useState(blankBiomarkers);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!latestPanel?.values) return;
    setValues((current) => ({
      ...current,
      ...Object.fromEntries(biomarkerKeys.map((key) => [key, latestPanel.values[key] ?? ''])),
    }));
  }, [latestPanel]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    await onSave(parseNumericFields(values));
    setBusy(false);
  };

  return (
    <Card className="p-5">
      <SectionHeading eyebrow="Context" title="Biomarkers" body="Save the latest lab context used in ReCODE pattern summaries." />
      <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
        {biomarkerKeys.map((key) => (
          <label key={key} className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {BIOMARKER_FIELDS[key].label}
            </span>
            <input
              className="mt-2 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-400"
              onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
              placeholder={BIOMARKER_FIELDS[key].unit}
              step="any"
              type="number"
              value={values[key]}
            />
          </label>
        ))}
        <div className="sm:col-span-2">
          <Button className="w-full" disabled={busy} type="submit" variant="secondary">
            {busy ? 'Saving...' : 'Save biomarker panel'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

const TrendCard = ({ sessions }) => {
  const trend = buildTrendSeries(sessions);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Longitudinal"
          title="Patient Trend"
          body="Completed sessions are plotted oldest to newest for same-patient follow-up."
        />
        <Pill tone="accent">{trend.length} completed</Pill>
      </div>
      {trend.length ? (
        <div className="mt-5 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={trend} margin={{ bottom: 8, left: -20, right: 16, top: 12 }}>
              <XAxis dataKey="label" tickLine={false} />
              <YAxis domain={[0, 100]} tickLine={false} />
              <Tooltip />
              <Line dataKey="overall" name="Overall" stroke="#0f766e" strokeWidth={3} type="monotone" />
              <Line dataKey="speed" name="Speed" stroke="#2563eb" strokeWidth={2} type="monotone" />
              <Line dataKey="memory" name="Memory" stroke="#b45309" strokeWidth={2} type="monotone" />
              <Line dataKey="executive" name="Executive" stroke="#7c3aed" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState title="No completed sessions yet" body="Save a session to begin the longitudinal trend line." />
        </div>
      )}
    </Card>
  );
};

const App = () => {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [latestBiomarkerPanel, setLatestBiomarkerPanel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? patients[0] ?? null,
    [patients, selectedPatientId],
  );

  useEffect(() => {
    document.title = 'NeuroMetrix Clinical Studio';
    let unsubscribe = () => {};

    const boot = async () => {
      try {
        const currentSession = await DatabaseService.getAuthSession();
        setSession(currentSession);
        unsubscribe = DatabaseService.onAuthStateChange(setSession);
      } catch (caught) {
        setError(caught.message);
      } finally {
        setAuthLoading(false);
      }
    };

    boot();
    return () => unsubscribe();
  }, []);

  const refreshPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const nextPatients = await DatabaseService.listPatients();
      setPatients(nextPatients);
      setSelectedPatientId((current) => current ?? nextPatients[0]?.id ?? null);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshPatientData = async (patientId) => {
    if (!patientId) {
      setSessions([]);
      setLatestBiomarkerPanel(null);
      return;
    }
    setError('');
    try {
      const [nextSessions, panel] = await Promise.all([
        DatabaseService.listPatientSessions(patientId),
        DatabaseService.getLatestBiomarkerPanel(patientId),
      ]);
      setSessions(nextSessions);
      setLatestBiomarkerPanel(panel);
    } catch (caught) {
      setError(caught.message);
    }
  };

  useEffect(() => {
    if (!session && DatabaseService.isRemote()) return;
    refreshPatients();
  }, [session]);

  useEffect(() => {
    refreshPatientData(selectedPatient?.id);
  }, [selectedPatient?.id]);

  const handleCreatePatient = async (input) => {
    setError('');
    try {
      const patient = await DatabaseService.createPatient(input);
      await refreshPatients();
      setSelectedPatientId(patient.id);
    } catch (caught) {
      setError(caught.message);
    }
  };

  const handleSaveSession = async ({ protocolId, completion }) => {
    if (!selectedPatient) return;
    setError('');
    try {
      const sessionRecord = await DatabaseService.createSession(selectedPatient, protocolId);
      await DatabaseService.completeSession(sessionRecord.id, completion);
      await refreshPatientData(selectedPatient.id);
    } catch (caught) {
      setError(caught.message);
    }
  };

  const handleSaveBiomarkers = async (values) => {
    if (!selectedPatient) return;
    setError('');
    try {
      await DatabaseService.saveBiomarkerPanel(selectedPatient.id, values);
      await refreshPatientData(selectedPatient.id);
    } catch (caught) {
      setError(caught.message);
    }
  };

  const handleSignOut = async () => {
    await DatabaseService.signOut();
    setPatients([]);
    setSelectedPatientId(null);
    setSessions([]);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading NeuroMetrix...
      </div>
    );
  }

  if (DatabaseService.isRemote() && !session) {
    return <AuthScreen onSession={setSession} />;
  }

  const completedSessions = sessions.filter((entry) => entry.status === 'completed');
  const latestSession = completedSessions[0] ?? null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef7f5_45%,#ffffff_100%)] text-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              <Cloud size={15} />
              Online iPad Emulator
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">NeuroMetrix Clinical Studio</h1>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="accent">{session?.user?.email ?? 'Local mode'}</Pill>
            <Button onClick={refreshPatients} size="sm" variant="secondary">
              <RefreshCw size={14} />
              Refresh
            </Button>
            {DatabaseService.isRemote() ? (
              <Button onClick={handleSignOut} size="sm" variant="quiet">
                <LogOut size={14} />
                Sign out
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[21rem_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-5">
          <PatientForm onCreate={handleCreatePatient} />
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <SectionHeading eyebrow="Patients" title="Registry" />
              <Pill tone="neutral">{patients.length}</Pill>
            </div>
            <div className="mt-5 space-y-2">
              {patients.map((patient) => {
                const active = patient.id === selectedPatient?.id;
                return (
                  <button
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      active ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    key={patient.id}
                    onClick={() => setSelectedPatientId(patient.id)}
                    type="button"
                  >
                    <div className="font-semibold text-slate-950">{patient.patientCode}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {patient.careTrack} · Age {patient.ageAtBaseline}
                    </div>
                  </button>
                );
              })}
              {!patients.length ? (
                <EmptyState body="Create a test patient to begin." icon={<Users size={24} />} title="No patients" />
              ) : null}
            </div>
          </Card>
        </aside>

        <section className="space-y-5">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard icon={<Users size={20} />} label="Patients" sublabel="Visible to signed-in user" value={loading ? '...' : patients.length} />
            <MetricCard icon={<Activity size={20} />} label="Sessions" sublabel="For selected patient" tone="accent" value={sessions.length} />
            <MetricCard icon={<Sparkles size={20} />} label="Latest overall" sublabel="Completed domain composite" tone="warning" value={latestSession?.summary?.overall ?? 'Pending'} />
          </div>

          {selectedPatient ? (
            <>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                      Selected Patient
                    </div>
                    <h2 className="mt-2 text-3xl font-semibold tracking-normal">{selectedPatient.patientCode}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedPatient.careTrack} · {getProtocolById(selectedPatient.preferredProtocolId).name} ·{' '}
                      {selectedPatient.isDeidentified ? 'De-identified' : 'Identified'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {domainKeys.map((key) => (
                      <Pill key={key} tone={scoreTone(latestSession?.domainScores?.[key])}>
                        {DOMAIN_LABELS[key]}: {latestSession?.domainScores?.[key] ?? 'Pending'}
                      </Pill>
                    ))}
                  </div>
                </div>
              </Card>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
                <TrendCard sessions={sessions} />
                <div className="space-y-5">
                  <SessionRecorder latestBiomarkerPanel={latestBiomarkerPanel} onSave={handleSaveSession} patient={selectedPatient} />
                  <BiomarkerPanel latestPanel={latestBiomarkerPanel} onSave={handleSaveBiomarkers} />
                </div>
              </div>

              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <SectionHeading eyebrow="History" title="Session Timeline" />
                  <Pill tone="neutral">{sessions.length} total</Pill>
                </div>
                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-[0.75fr_0.8fr_1fr_0.7fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <div>Date</div>
                    <div>Protocol</div>
                    <div>Pattern summary</div>
                    <div>Overall</div>
                  </div>
                  {sessions.map((entry) => (
                    <div className="grid grid-cols-[0.75fr_0.8fr_1fr_0.7fr] border-t border-slate-200 px-4 py-3 text-sm" key={entry.id}>
                      <div className="font-medium text-slate-900">{formatDate(entry.startedAt)}</div>
                      <div className="text-slate-600">{getProtocolById(entry.protocolId).name}</div>
                      <div className="truncate text-slate-600">{entry.summary?.recodeSignals?.[0]?.type ?? entry.status}</div>
                      <div className="font-semibold text-slate-900">{entry.summary?.overall ?? 'Pending'}</div>
                    </div>
                  ))}
                  {!sessions.length ? (
                    <div className="border-t border-slate-200 px-4 py-6 text-sm text-slate-500">
                      No sessions recorded for this patient yet.
                    </div>
                  ) : null}
                </div>
              </Card>
            </>
          ) : (
            <EmptyState
              body="Create or select a patient to record online sessions and trend progress over time."
              icon={<Plus size={28} />}
              title="Choose a patient"
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
