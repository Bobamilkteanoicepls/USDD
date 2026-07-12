export type DemoRole = "becky" | "elijah" | "public";
export type CaseClassification = "unfiled" | "hazardous" | "recyclable" | "provisionally_recyclable" | "certified_recyclable" | "expunged";
export type NoticeState = "not_sent" | "delivered" | "read";
export type AppealState = "not_filed" | "filed" | "hearing" | "decided";
export type HearingPhase = "not_started" | "arguments" | "voting" | "decided";
export type SchoolState = "not_enrolled" | "lessons" | "exam" | "failed" | "passed";

export type EvidenceItem = {
  id: string;
  owner: DemoRole;
  fileName: string;
  caption: string;
  dataUrl: string;
  submittedAt: string;
};

export type Juror = {
  id: string;
  name: string;
  vote: "guilty" | "not_guilty" | null;
};

export type QuizQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type CaseNotification = {
  id: string;
  recipient: DemoRole;
  channel: "email" | "sms" | "in_app";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type DatingRecordItem = {
  id: string;
  name: string;
  caseNumber?: string;
  archived: boolean;
};

export type DemoCaseState = {
  version: 5;
  activeRole: DemoRole;
  activeService: "dashboard" | "notifications" | "evidence" | "court" | "school" | "record" | "documents" | "jury";
  caseNumber: string;
  claimant: { name: "Becky"; statement: string };
  respondent: { name: "Elijah"; statement: string; defense: string };
  violations: string[];
  classification: CaseClassification;
  filedAt: string | null;
  notice: NoticeState;
  notifications: CaseNotification[];
  appeal: AppealState;
  evidence: EvidenceItem[];
  hearing: { phase: HearingPhase; startedAt: number | null; durationSeconds: number; revealCount: number };
  jurors: Juror[];
  publicJury: { joined: boolean; oathAccepted: boolean; alias: string; jurorId: string; joinedAt: string | null };
  verdict: null | { result: "guilty" | "appeal_granted" | "hung_jury"; reasoning: string; decidedAt: string };
  school: { state: SchoolState; lessonIndex: number; questionIndex: number; answers: number[]; score: number; attempts: number };
  documents: { rehabilitationNumber: string | null; rehabilitationIssuedAt: string | null; expungementNumber: string | null; expungementIssuedAt: string | null; shared: boolean };
  beckyRecords: DatingRecordItem[];
  completed: { filed: boolean; noticed: boolean; evidence: boolean; heard: boolean; voted: boolean; school: boolean; expunged: boolean };
};

const now = () => new Date().toISOString();
export const DEMO_STORAGE_KEY = "usdd-shared-case-v5";
export const DEMO_EVENT_KEY = "usdd-shared-case-updated";

export const DEMO_QUIZ: QuizQuestion[] = [
  { prompt: "Your partner says, “We need to talk.”", options: ["Reply in three business days", "Disappear", "Talk to them"], correctIndex: 2 },
  { prompt: "After six dates, they ask: “What are we?”", options: ["Change the topic", "Avoid labels", "Answer honestly"], correctIndex: 2 },
  { prompt: "You forgot their birthday.", options: ["Blame Mercury retrograde", "Apologize", "Block them"], correctIndex: 1 },
];

export function createInitialDemoCase(): DemoCaseState {
  return {
    version: 5,
    activeRole: "becky",
    activeService: "dashboard",
    caseNumber: "EX-2026-00421",
    claimant: { name: "Becky", statement: "Elijah disappeared for four business days and returned with a meme." },
    respondent: { name: "Elijah", statement: "I was not ghosting. I was emotionally buffering and my phone was on 2%.", defense: "I did not ghost. I was emotionally buffering." },
    violations: ["Alleged Ghosting", "Mixed Signals", "Failure to Define the Relationship"],
    classification: "unfiled",
    filedAt: null,
    notice: "not_sent",
    notifications: [],
    appeal: "not_filed",
    evidence: [],
    hearing: { phase: "not_started", startedAt: null, durationSeconds: 60, revealCount: 0 },
    jurors: ["JuryDutyBae92", "Patricia from HR", "@redflagdetective", "The Group Chat", "A Therapist-ish"].map((name, index) => ({ id: `juror-${index + 1}`, name, vote: null })),
    publicJury: { joined: false, oathAccepted: false, alias: "@CivicDutyCutie482", jurorId: "juror-5", joinedAt: null },
    verdict: null,
    school: { state: "not_enrolled", lessonIndex: 0, questionIndex: 0, answers: [], score: 0, attempts: 0 },
    documents: { rehabilitationNumber: null, rehabilitationIssuedAt: null, expungementNumber: null, expungementIssuedAt: null, shared: false },
    beckyRecords: ["Noah", "Marcus", "Jamie", "Elijah"].map((name, index) => ({ id: `record-${index + 1}`, name, caseNumber: name === "Elijah" ? "EX-2026-00421" : undefined, archived: false })),
    completed: { filed: false, noticed: false, evidence: false, heard: false, voted: false, school: false, expunged: false },
  };
}

export function saveDemoCase(state: DemoCaseState) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(DEMO_EVENT_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

export function loadDemoCase(): DemoCaseState {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return createInitialDemoCase();
    const parsed = JSON.parse(raw) as Partial<DemoCaseState>;
    if (parsed.version !== 5) return createInitialDemoCase();
    return { ...createInitialDemoCase(), ...parsed } as DemoCaseState;
  } catch {
    return createInitialDemoCase();
  }
}

export function caseAwareReasoning(state: DemoCaseState) {
  const guiltyVotes = state.jurors.filter((juror) => juror.vote === "guilty").length;
  const exhibitText = state.evidence.length === 1 ? "one screenshot exhibit" : `${state.evidence.length} screenshot exhibits`;
  const captions = state.evidence.length ? ` Filed exhibits were described as: ${state.evidence.map((item) => item.caption).join("; ")}.` : "";
  return `The simulated court reviewed ${exhibitText}, Becky’s statement (“${state.claimant.statement}”), Elijah’s response (“${state.respondent.statement}”), the allegation of ${state.violations[0].toLowerCase()}, and Elijah’s defense that “${state.respondent.defense}”${captions} The five-person jury returned ${guiltyVotes} guilty vote${guiltyVotes === 1 ? "" : "s"}. USDD therefore finds that emotional buffering is not a recognized substitute for communication. This is a fictional demonstration outcome, not a factual finding.`;
}

export function officialRelationshipCount(state: DemoCaseState) {
  return state.beckyRecords.filter((record) => !record.archived).length;
}

export function formatDemoDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Pending";
}

export function issueNumber(prefix: string) {
  return `${prefix}-2026-${String(Math.floor(10000 + Math.random() * 89999))}`;
}

export function buildNotice(state: DemoCaseState): CaseNotification[] {
  const createdAt = now();
  const message = `Becky classified you as Hazardous Non-Recyclable in fictional case ${state.caseNumber}. Log in to appeal or enroll in Ex Traffic School.`;
  return (["email", "sms", "in_app"] as const).map((channel) => ({ id: `notice-${channel}-${Date.now()}`, recipient: "elijah", channel, title: "Official USDD Classification Notice", message, createdAt, read: false }));
}
