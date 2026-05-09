import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseKey) &&
  supabaseUrl !== 'your-supabase-url' &&
  supabaseKey !== 'your-supabase-key';

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

const LOCAL_KEYS = {
  patients: 'neurometrix_patients_v5',
  biomarkers: 'neurometrix_biomarkers_v5',
  sessions: 'neurometrix_sessions_v5',
  appState: 'neurometrix_app_state_v5',
};

const localStore = {
  read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error(`Failed reading ${key}`, error);
      return [];
    }
  },

  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed writing ${key}`, error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

const now = () => new Date().toISOString();

const buildPatientRecord = (input) => ({
  id: input.id ?? crypto.randomUUID(),
  patientCode: input.patientCode?.trim() ?? '',
  studyId: input.studyId?.trim() || null,
  firstName: input.firstName?.trim() || null,
  lastName: input.lastName?.trim() || null,
  dateOfBirth: input.dateOfBirth || null,
  ageAtBaseline: Number(input.ageAtBaseline ?? input.age ?? 0),
  educationYears: Number(input.educationYears ?? input.education ?? 0),
  sex: input.sex || null,
  careTrack: input.careTrack || 'ReCODE prevention',
  preferredProtocolId: input.preferredProtocolId || 'recode-baseline',
  isDeidentified: Boolean(input.isDeidentified),
  notes: input.notes?.trim() || '',
  tags: Array.isArray(input.tags) ? input.tags : [],
  createdAt: input.createdAt ?? now(),
  updatedAt: now(),
});

const buildBiomarkerPanel = (patientId, values, previous = {}) => ({
  id: previous.id ?? crypto.randomUUID(),
  patientId,
  capturedAt: previous.capturedAt ?? now(),
  values,
  createdAt: previous.createdAt ?? now(),
  updatedAt: now(),
});

const buildSessionRecord = (patient, protocolId, sessionNumber, previous = {}) => ({
  id: previous.id ?? crypto.randomUUID(),
  patientId: patient.id,
  patientCode: patient.patientCode,
  protocolId,
  sessionNumber,
  status: previous.status ?? 'in_progress',
  startedAt: previous.startedAt ?? now(),
  completedAt: previous.completedAt ?? null,
  ageAtAssessment: previous.ageAtAssessment ?? patient.ageAtBaseline,
  assessmentResults: previous.assessmentResults ?? {},
  domainScores: previous.domainScores ?? {},
  summary: previous.summary ?? null,
  recommendations: previous.recommendations ?? [],
  createdAt: previous.createdAt ?? now(),
  updatedAt: now(),
});

const patientToRemote = (patient) => ({
  id: patient.id,
  patient_code: patient.patientCode,
  study_id: patient.studyId,
  first_name: patient.firstName,
  last_name: patient.lastName,
  date_of_birth: patient.dateOfBirth,
  age_at_baseline: patient.ageAtBaseline,
  education_years: patient.educationYears,
  sex: patient.sex,
  care_track: patient.careTrack,
  preferred_protocol_id: patient.preferredProtocolId,
  is_deidentified: patient.isDeidentified,
  notes: patient.notes,
  tags: patient.tags,
  updated_at: patient.updatedAt,
});

const patientFromRemote = (patient) => ({
  id: patient.id,
  patientCode: patient.patient_code,
  studyId: patient.study_id,
  firstName: patient.first_name,
  lastName: patient.last_name,
  dateOfBirth: patient.date_of_birth,
  ageAtBaseline: patient.age_at_baseline,
  educationYears: patient.education_years,
  sex: patient.sex,
  careTrack: patient.care_track,
  preferredProtocolId: patient.preferred_protocol_id,
  isDeidentified: patient.is_deidentified,
  notes: patient.notes ?? '',
  tags: patient.tags ?? [],
  createdAt: patient.created_at,
  updatedAt: patient.updated_at ?? patient.created_at,
});

const panelToRemote = (panel) => ({
  id: panel.id,
  patient_id: panel.patientId,
  captured_at: panel.capturedAt,
  panel_values: panel.values,
  updated_at: panel.updatedAt,
});

const panelFromRemote = (panel) => ({
  id: panel.id,
  patientId: panel.patient_id,
  capturedAt: panel.captured_at,
  values: panel.panel_values ?? {},
  createdAt: panel.created_at,
  updatedAt: panel.updated_at ?? panel.created_at,
});

const sessionToRemote = (session) => ({
  id: session.id,
  patient_id: session.patientId,
  patient_code: session.patientCode,
  protocol_id: session.protocolId,
  session_number: session.sessionNumber,
  status: session.status,
  started_at: session.startedAt,
  completed_at: session.completedAt,
  age_at_assessment: session.ageAtAssessment,
  assessment_results: session.assessmentResults,
  domain_scores: session.domainScores,
  summary: session.summary,
  recommendations: session.recommendations,
  updated_at: session.updatedAt,
});

const sessionFromRemote = (session) => ({
  id: session.id,
  patientId: session.patient_id,
  patientCode: session.patient_code,
  protocolId: session.protocol_id,
  sessionNumber: session.session_number,
  status: session.status,
  startedAt: session.started_at,
  completedAt: session.completed_at,
  ageAtAssessment: session.age_at_assessment,
  assessmentResults: session.assessment_results ?? {},
  domainScores: session.domain_scores ?? {},
  summary: session.summary ?? null,
  recommendations: session.recommendations ?? [],
  createdAt: session.created_at,
  updatedAt: session.updated_at ?? session.created_at,
});

const listLocal = (key) => localStore.read(key);

const writeLocalList = (key, next) => {
  localStore.write(key, next);
  return next;
};

const safeAppState = (value = {}) => ({
  currentScreen: value.currentScreen ?? 'overview',
  currentPatientId: value.currentPatientId ?? null,
  currentProtocolId: value.currentProtocolId ?? null,
  lastUpdated: now(),
});

export const DatabaseService = {
  isRemote() {
    return isSupabaseConfigured && supabase !== null;
  },

  async getAuthSession() {
    if (!this.isRemote()) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback) {
    if (!this.isRemote()) return () => {};
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return () => data.subscription.unsubscribe();
  },

  async signIn(email, password) {
    if (!this.isRemote()) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  },

  async signUp(email, password) {
    if (!this.isRemote()) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!this.isRemote()) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async listPatients() {
    if (this.isRemote()) {
      const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(patientFromRemote);
    }
    return listLocal(LOCAL_KEYS.patients).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  },

  async getPatient(patientId) {
    if (this.isRemote()) {
      const { data, error } = await supabase.from('patients').select('*').eq('id', patientId).single();
      if (error) throw error;
      return patientFromRemote(data);
    }
    return listLocal(LOCAL_KEYS.patients).find((patient) => patient.id === patientId) ?? null;
  },

  async createPatient(input) {
    const patient = buildPatientRecord(input);
    if (this.isRemote()) {
      const { data, error } = await supabase.from('patients').insert(patientToRemote(patient)).select('*').single();
      if (error) throw error;
      return patientFromRemote(data);
    }

    const patients = listLocal(LOCAL_KEYS.patients);
    patients.unshift(patient);
    writeLocalList(LOCAL_KEYS.patients, patients);
    return patient;
  },

  async updatePatient(patientId, updates) {
    const current = await this.getPatient(patientId);
    if (!current) return null;
    const patient = buildPatientRecord({ ...current, ...updates, id: patientId, createdAt: current.createdAt });
    if (this.isRemote()) {
      const { data, error } = await supabase.from('patients').update(patientToRemote(patient)).eq('id', patientId).select('*').single();
      if (error) throw error;
      return patientFromRemote(data);
    }
    const patients = listLocal(LOCAL_KEYS.patients).map((entry) => (entry.id === patientId ? patient : entry));
    writeLocalList(LOCAL_KEYS.patients, patients);
    return patient;
  },

  async listPatientSessions(patientId) {
    if (this.isRemote()) {
      const { data, error } = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data.map(sessionFromRemote);
    }
    return listLocal(LOCAL_KEYS.sessions)
      .filter((session) => session.patientId === patientId)
      .sort((left, right) => new Date(right.startedAt) - new Date(left.startedAt));
  },

  async getSession(sessionId) {
    if (this.isRemote()) {
      const { data, error } = await supabase.from('assessment_sessions').select('*').eq('id', sessionId).single();
      if (error) throw error;
      return sessionFromRemote(data);
    }
    return listLocal(LOCAL_KEYS.sessions).find((session) => session.id === sessionId) ?? null;
  },

  async createSession(patient, protocolId) {
    const existing = await this.listPatientSessions(patient.id);
    const sessionNumber = existing.length ? Math.max(...existing.map((session) => session.sessionNumber)) + 1 : 1;
    const session = buildSessionRecord(patient, protocolId, sessionNumber);
    if (this.isRemote()) {
      const { data, error } = await supabase.from('assessment_sessions').insert(sessionToRemote(session)).select('*').single();
      if (error) throw error;
      return sessionFromRemote(data);
    }
    const sessions = listLocal(LOCAL_KEYS.sessions);
    sessions.unshift(session);
    writeLocalList(LOCAL_KEYS.sessions, sessions);
    return session;
  },

  async saveAssessmentResult(sessionId, assessmentId, result) {
    const session = await this.getSession(sessionId);
    if (!session) return null;
    const nextSession = buildSessionRecord({ id: session.patientId, patientCode: session.patientCode, ageAtBaseline: session.ageAtAssessment }, session.protocolId, session.sessionNumber, {
      ...session,
      assessmentResults: {
        ...session.assessmentResults,
        [assessmentId]: result,
      },
    });

    if (this.isRemote()) {
      const { data, error } = await supabase
        .from('assessment_sessions')
        .update(sessionToRemote(nextSession))
        .eq('id', sessionId)
        .select('*')
        .single();
      if (error) throw error;
      return sessionFromRemote(data);
    }

    const sessions = listLocal(LOCAL_KEYS.sessions).map((entry) => (entry.id === sessionId ? nextSession : entry));
    writeLocalList(LOCAL_KEYS.sessions, sessions);
    return nextSession;
  },

  async completeSession(sessionId, completion) {
    const session = await this.getSession(sessionId);
    if (!session) return null;
    const nextSession = buildSessionRecord({ id: session.patientId, patientCode: session.patientCode, ageAtBaseline: session.ageAtAssessment }, session.protocolId, session.sessionNumber, {
      ...session,
      status: 'completed',
      completedAt: now(),
      domainScores: completion.domainScores ?? {},
      summary: completion.summary ?? null,
      recommendations: completion.recommendations ?? [],
    });

    if (this.isRemote()) {
      const { data, error } = await supabase
        .from('assessment_sessions')
        .update(sessionToRemote(nextSession))
        .eq('id', sessionId)
        .select('*')
        .single();
      if (error) throw error;
      return sessionFromRemote(data);
    }

    const sessions = listLocal(LOCAL_KEYS.sessions).map((entry) => (entry.id === sessionId ? nextSession : entry));
    writeLocalList(LOCAL_KEYS.sessions, sessions);
    return nextSession;
  },

  async saveBiomarkerPanel(patientId, values) {
    const panel = buildBiomarkerPanel(patientId, values);
    if (this.isRemote()) {
      const { data, error } = await supabase.from('biomarker_panels').insert(panelToRemote(panel)).select('*').single();
      if (error) throw error;
      return panelFromRemote(data);
    }
    const panels = listLocal(LOCAL_KEYS.biomarkers);
    writeLocalList(LOCAL_KEYS.biomarkers, [panel, ...panels]);
    return panel;
  },

  async getLatestBiomarkerPanel(patientId) {
    if (this.isRemote()) {
      const { data, error } = await supabase
        .from('biomarker_panels')
        .select('*')
        .eq('patient_id', patientId)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? panelFromRemote(data) : null;
    }
    return (
      listLocal(LOCAL_KEYS.biomarkers)
        .filter((panel) => panel.patientId === patientId)
        .sort((left, right) => new Date(right.capturedAt) - new Date(left.capturedAt))[0] ?? null
    );
  },

  async getBiomarkerHistory(patientId) {
    if (this.isRemote()) {
      const { data, error } = await supabase
        .from('biomarker_panels')
        .select('*')
        .eq('patient_id', patientId)
        .order('captured_at', { ascending: false });
      if (error) throw error;
      return data.map(panelFromRemote);
    }
    return listLocal(LOCAL_KEYS.biomarkers)
      .filter((panel) => panel.patientId === patientId)
      .sort((left, right) => new Date(right.capturedAt) - new Date(left.capturedAt));
  },

  async exportPatientPackage(patientId) {
    const patient = await this.getPatient(patientId);
    const sessions = await this.listPatientSessions(patientId);
    const biomarkers = await this.getBiomarkerHistory(patientId);
    return {
      exportedAt: now(),
      patient,
      sessions,
      biomarkers,
    };
  },

  async exportPatientCsv(patientId) {
    const patient = await this.getPatient(patientId);
    const sessions = await this.listPatientSessions(patientId);
    const rows = sessions.map((session) => {
      const r = session.assessmentResults ?? {};
      const trailATime = r.trailA?.completionTimeMs;
      const trailBTime = r.trailB?.completionTimeMs;
      const baRatio = trailATime && trailBTime ? Number((trailBTime / trailATime).toFixed(2)) : '';
      return {
        patient_code: patient.patientCode,
        study_id: patient.studyId ?? '',
        is_deidentified: patient.isDeidentified ? 'true' : 'false',
        age_at_baseline: patient.ageAtBaseline,
        education_years: patient.educationYears,
        sex: patient.sex ?? '',
        session_number: session.sessionNumber,
        protocol_id: session.protocolId,
        started_at: session.startedAt,
        completed_at: session.completedAt ?? '',
        status: session.status,
        overall: session.summary?.overall ?? '',
        // Domain composites
        orientation_language: session.domainScores?.orientationLanguage ?? '',
        processing_speed: session.domainScores?.processingSpeed ?? '',
        executive_control: session.domainScores?.executiveControl ?? '',
        working_memory: session.domainScores?.workingMemory ?? '',
        memory: session.domainScores?.memory ?? '',
        // Stroop detail
        stroop_interference_ms: r.stroop?.interferenceMs ?? '',
        stroop_accuracy: r.stroop?.accuracy ?? '',
        stroop_mean_rt_ms: r.stroop?.meanRtMs ?? '',
        stroop_percentile: r.stroop?.percentile ?? '',
        // SDMT detail
        symbol_throughput: r.symbolMatch?.throughput ?? '',
        symbol_cv_rt: r.symbolMatch?.cvRt ?? '',
        symbol_errors: r.symbolMatch?.errors ?? '',
        symbol_percentile: r.symbolMatch?.percentile ?? '',
        // Trail Making
        trail_a_time_ms: trailATime ?? '',
        trail_a_errors: r.trailA?.errors ?? '',
        trail_a_percentile: r.trailA?.percentile ?? '',
        trail_b_time_ms: trailBTime ?? '',
        trail_b_errors: r.trailB?.errors ?? '',
        trail_b_percentile: r.trailB?.percentile ?? '',
        trail_ba_ratio: baRatio,
        // Span
        span_forward: r.spanForward?.maxSpan ?? '',
        span_forward_percentile: r.spanForward?.percentile ?? '',
        span_backward: r.spanBackward?.maxSpan ?? '',
        span_backward_percentile: r.spanBackward?.percentile ?? '',
        // Verbal learning
        verbal_learning_total: r.verbalLearning?.learningTotal ?? '',
        verbal_delayed_recall: r.verbalLearning?.delayedRecall ?? '',
        verbal_recognition_hits: r.verbalLearning?.recognitionHits ?? '',
        verbal_intrusions: r.verbalLearning?.intrusions ?? '',
        verbal_retention_rate: r.verbalLearning?.retentionRate ?? '',
        verbal_percentile: r.verbalLearning?.percentile ?? '',
        // Fluency
        fluency_unique: r.fluency?.uniqueResponses ?? '',
        fluency_perseverations: r.fluency?.perseverations ?? '',
        fluency_percentile: r.fluency?.percentile ?? '',
        // Orientation
        orientation_score: r.orientation?.score ?? '',
        orientation_percentile: r.orientation?.percentile ?? '',
      };
    });

    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    return [headers.join(','), ...rows.map((row) => headers.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n');
  },

  saveAppState(state) {
    localStore.write(LOCAL_KEYS.appState, safeAppState(state));
  },

  loadAppState() {
    try {
      const raw = localStorage.getItem(LOCAL_KEYS.appState);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearAppState() {
    localStore.remove(LOCAL_KEYS.appState);
  },
};

export default DatabaseService;
