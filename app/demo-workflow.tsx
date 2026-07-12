"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AIJudgeVerdictPanel,
  DashboardShell,
  EvidenceUploader,
  ExpungementCertificate,
  JuryPanel,
  LiveHearing,
  NotificationInboxCard,
  RehabilitationDocuments,
  RoleSwitch,
  TrafficSchoolFlow,
  shareCertificate,
} from "./demo-components";
import {
  DEMO_EVENT_KEY,
  DEMO_QUIZ,
  DEMO_STORAGE_KEY,
  buildNotice,
  caseAwareReasoning,
  createInitialDemoCase,
  formatDemoDate,
  issueNumber,
  loadDemoCase,
  officialRelationshipCount,
  saveDemoCase,
  type DemoCaseState,
  type DemoRole,
  type EvidenceItem,
  type Juror,
} from "./demo-case";

type Props = { onSyncElijah?: (classification: "hazardous" | "provisionally_recyclable" | "expunged") => void };

const services: Array<[DemoCaseState["activeService"], string]> = [
  ["dashboard", "Dashboard"], ["notifications", "Notifications"], ["evidence", "Evidence"],
  ["court", "Traffic Court"], ["school", "Traffic School"], ["record", "Dating Record"], ["documents", "Documents"],
];

export default function DemoWorkflow({ onSyncElijah }: Props) {
  const [state, setState] = useState<DemoCaseState>(() => createInitialDemoCase());
  const [ready, setReady] = useState(false);
  const [shareError, setShareError] = useState("");
  const update = (fn: (previous: DemoCaseState) => DemoCaseState) => setState((previous) => fn(previous));

  useEffect(() => { const frame = window.requestAnimationFrame(() => { setState(loadDemoCase()); setReady(true); }); return () => window.cancelAnimationFrame(frame); }, []);
  useEffect(() => { if (ready) saveDemoCase(state); }, [ready, state]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === DEMO_STORAGE_KEY || event.key === DEMO_EVENT_KEY) setState(loadDemoCase()); };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (state.hearing.phase !== "decided" || state.hearing.revealCount >= 5) return;
    const timer = window.setTimeout(() => update((s) => ({ ...s, hearing: { ...s.hearing, revealCount: Math.min(5, s.hearing.revealCount + 1) } })), 420);
    return () => window.clearTimeout(timer);
  }, [state.hearing.phase, state.hearing.revealCount]);

  const setRole = (role: DemoRole) => update((s) => ({ ...s, activeRole: role, activeService: role === "elijah" && s.notice !== "not_sent" ? "notifications" : "dashboard" }));
  const setService = (activeService: DemoCaseState["activeService"]) => update((s) => ({ ...s, activeService }));
  const unread = state.notifications.filter((notice) => notice.recipient === state.activeRole && !notice.read).length;
  const previousCount = state.beckyRecords.length;
  const currentCount = officialRelationshipCount(state);
  const guiltyVotes = state.jurors.filter((juror) => juror.vote === "guilty").length;
  const totalVotes = state.jurors.filter((juror) => juror.vote).length;
  const canExpunge = state.verdict?.result === "guilty" && !state.completed.expunged;
  const milestones = useMemo(() => [
    ["Case filed", state.completed.filed], ["Notice served", state.completed.noticed], ["Evidence filed", state.completed.evidence],
    ["Hearing held", state.completed.heard], ["Jury voted", state.completed.voted], ["School completed", state.completed.school], ["Record expunged", state.completed.expunged],
  ] as Array<[string, boolean]>, [state.completed]);

  const fileCase = () => update((s) => {
    const filedAt = new Date().toISOString();
    const next = { ...s, classification: "hazardous" as const, filedAt, notice: "delivered" as const, notifications: buildNotice(s), completed: { ...s.completed, filed: true, noticed: true } };
    onSyncElijah?.("hazardous"); return next;
  });
  const markNoticeRead = () => update((s) => ({ ...s, notice: "read", notifications: s.notifications.map((notice) => notice.recipient === "elijah" ? { ...notice, read: true } : notice) }));
  const fileAppeal = () => update((s) => ({ ...s, appeal: "filed", activeService: "evidence" }));
  const enrollSchool = () => update((s) => ({ ...s, activeService: "school", school: { ...s.school, state: "lessons", lessonIndex: 0, questionIndex: 0, answers: [], score: 0 } }));
  const addEvidence = (owner: DemoRole, draft: { file: File; dataUrl: string; caption: string }) => {
    const item: EvidenceItem = { id: `evidence-${Date.now()}`, owner, fileName: draft.file.name, caption: draft.caption, dataUrl: draft.dataUrl, submittedAt: new Date().toISOString() };
    update((s) => ({ ...s, evidence: [...s.evidence, item], completed: { ...s.completed, evidence: true } }));
  };
  const removeEvidence = (id: string) => update((s) => ({ ...s, evidence: s.evidence.filter((item) => item.id !== id) }));
  const enterCourt = () => update((s) => ({ ...s, appeal: "hearing", activeService: "court", hearing: { ...s.hearing, phase: "arguments", startedAt: Date.now(), revealCount: 0 }, completed: { ...s.completed, heard: true } }));
  const openVoting = () => update((s) => ({ ...s, hearing: { ...s.hearing, phase: "voting" } }));
  const vote = (jurorId: string, voteValue: Juror["vote"]) => update((s) => ({ ...s, jurors: s.jurors.map((juror) => juror.id === jurorId ? { ...juror, vote: voteValue } : juror) }));
  const simulateVotes = () => update((s) => ({ ...s, jurors: s.jurors.map((juror, index) => ({ ...juror, vote: index === 3 ? "not_guilty" : "guilty" })) }));
  const decide = () => update((s) => {
    const voted = s.jurors.filter((juror) => juror.vote);
    const guilty = voted.filter((juror) => juror.vote === "guilty").length;
    const result: "guilty" | "appeal_granted" | "hung_jury" = voted.length < 5 ? "hung_jury" : guilty >= 3 ? "guilty" : "appeal_granted";
    const next = { ...s, appeal: "decided" as const, hearing: { ...s.hearing, phase: "decided" as const, revealCount: 0 }, verdict: { result, reasoning: caseAwareReasoning(s), decidedAt: new Date().toISOString() }, completed: { ...s.completed, voted: true } };
    return next;
  });
  const completeLesson = () => update((s) => {
    const nextIndex = s.school.lessonIndex + 1;
    return { ...s, school: { ...s.school, lessonIndex: nextIndex, state: nextIndex >= 3 ? "exam" : "lessons" } };
  });
  const answer = (questionIndex: number, answerIndex: number) => update((s) => {
    if (s.school.answers[questionIndex] != null) return s;
    const answers = [...s.school.answers]; answers[questionIndex] = answerIndex;
    const isLast = questionIndex === DEMO_QUIZ.length - 1;
    const score = answers.filter((value, index) => value === DEMO_QUIZ[index]?.correctIndex).length;
    return { ...s, school: { ...s.school, answers, questionIndex: isLast ? questionIndex : questionIndex + 1, score, state: isLast ? (score >= 2 ? "passed" : "failed") : "exam", attempts: isLast ? s.school.attempts + 1 : s.school.attempts } };
  });
  const retrySchool = () => update((s) => ({ ...s, school: { ...s.school, state: "exam", questionIndex: 0, answers: [], score: 0 } }));
  const graduate = () => update((s) => {
    const issuedAt = new Date().toISOString(); onSyncElijah?.("provisionally_recyclable");
    return { ...s, classification: "provisionally_recyclable", activeService: "documents", documents: { ...s.documents, rehabilitationNumber: s.documents.rehabilitationNumber || issueNumber("REHAB"), issuedAt }, completed: { ...s.completed, school: true } };
  });
  const expunge = () => update((s) => {
    const issuedAt = new Date().toISOString(); onSyncElijah?.("expunged");
    return { ...s, classification: "expunged", activeService: "record", beckyRecords: s.beckyRecords.map((record) => record.name === "Elijah" ? { ...record, archived: true } : record), documents: { ...s.documents, expungementNumber: s.documents.expungementNumber || issueNumber("EXP"), issuedAt }, notifications: [...s.notifications, { id: `notice-expunged-${Date.now()}`, recipient: "elijah", channel: "in_app", title: "Case Record Expunged", message: `Becky expunged case ${s.caseNumber} from her official dating history. The archived record remains visible to the parties.`, createdAt: issuedAt, read: false }], completed: { ...s.completed, expunged: true } };
  });
  const reset = () => { const fresh = createInitialDemoCase(); setState(fresh); saveDemoCase(fresh); onSyncElijah?.("hazardous"); };
  const share = async () => shareCertificate("USDD Expungement Certificate", `Becky’s official relationship count is now ${currentCount}. Fictional case ${state.caseNumber} was expunged.`, window.location.href, () => update((s) => ({ ...s, documents: { ...s.documents, shared: true } })), setShareError);

  const renderDashboard = () => state.activeRole === "becky" ? (
    <DashboardShell role="becky" onSwitch={() => setRole("elijah")} status={`Official relationships: ${currentCount}`}>
      {!state.completed.filed ? <section className="filing"><span className="formCode">FORM USDD-EX01 · REVIEW BEFORE FILING</span><h2>Classify Elijah as emotional waste</h2><div className="allegations">{state.violations.map((item) => <span key={item}>🚩 {item}</span>)}</div><label>CLAIMANT STATEMENT<textarea value={state.claimant.statement} onChange={(event) => update((s) => ({ ...s, claimant: { ...s.claimant, statement: event.target.value } }))}/></label><button className="dangerBtn" type="button" onClick={fileCase}>FILE & SERVE HAZARDOUS CLASSIFICATION</button></section>
      : <section className="claimantStatus"><h2>Case {state.caseNumber}</h2><p>Becky can review both parties’ evidence, observe the hearing, view the verdict, and expunge Elijah after a final guilty ruling.</p><div className="caseActions"><button className="outline" onClick={() => setService("evidence")}>REVIEW EVIDENCE</button><button className="outline" onClick={() => setService("court")}>OPEN COURTROOM</button>{canExpunge && <button className="dangerBtn" onClick={expunge}>EXPUNGE ELIJAH NOW</button>}</div></section>}
    </DashboardShell>
  ) : (
    <DashboardShell role="elijah" onSwitch={() => setRole("becky")} status={`Classification: ${state.classification.replaceAll("_", " ")}`}>
      {state.notice === "not_sent" ? <div className="empty"><b>NO ACTIVE CASE</b><p>Switch to Becky to file the demonstration case.</p></div> : <div className="claimantStatus"><h2>Respond to case {state.caseNumber}</h2><p>You may open the official notice, file evidence, monitor the court, or enter rehabilitation.</p><div className="caseActions"><button className="primary" onClick={() => setService("notifications")}>OPEN NOTIFICATION INBOX {unread ? `(${unread})` : ""}</button><button className="outline" onClick={() => setService("evidence")}>EVIDENCE CENTER</button><button className="outline" onClick={() => setService("court")}>TRAFFIC COURT</button></div></div>}
    </DashboardShell>
  );

  return <section className="demoShell fullDemo">
    <div className="demoNotice"><b>⚑ INTERACTIVE DEMO</b><span>Two simulated accounts share one persistent case. Open this site in two tabs to watch updates synchronize.</span><button type="button" onClick={reset}>RESET EVERYTHING</button></div>
    <div className="demoTop"><div><span>CASE {state.caseNumber}</span><h2>Becky <em>v.</em> Elijah</h2><p>{state.violations.join(" · ")}</p></div><div className={`caseStatus ${state.classification}`}>{state.classification.replaceAll("_", " ").toUpperCase()}</div></div>
    <RoleSwitch activeRole={state.activeRole} notificationCount={state.activeRole === "elijah" ? unread : 0} onSwitch={setRole}/>
    <nav className="caseNav" aria-label="Case services">{services.map(([value, text]) => <button key={value} className={state.activeService === value ? "active" : ""} onClick={() => setService(value)}>{text}{value === "notifications" && unread > 0 ? <b>{unread}</b> : null}</button>)}</nav>
    <div className="journey">{milestones.map(([text, done], index) => <span className={done ? "done" : ""} key={text}><i>{done ? "✓" : index + 1}</i>{text.toUpperCase()}</span>)}</div>

    {state.activeService === "dashboard" && renderDashboard()}
    {state.activeService === "notifications" && <DashboardShell role={state.activeRole} onSwitch={() => setRole(state.activeRole === "becky" ? "elijah" : "becky")} eyebrow="USDD NOTIFICATION CENTER" title={`${state.activeRole === "becky" ? "Becky" : "Elijah"}’s Inbox`}>
      {state.activeRole === "elijah" && state.notice !== "not_sent" ? <><div className="deliveryChannels">{state.notifications.filter((notice) => notice.title.includes("Classification")).map((notice) => <article key={notice.id}><b>{notice.channel === "email" ? "✉ EMAIL" : notice.channel === "sms" ? "▣ SMS" : "● IN-APP"}</b><span>DELIVERED</span><small>{formatDemoDate(notice.createdAt)}</small></article>)}</div><NotificationInboxCard caseNumber={state.caseNumber} claimantName="Becky" filedAt={formatDemoDate(state.filedAt)} isRead={state.notice === "read"} onOpen={markNoticeRead} onAppeal={fileAppeal} onSchool={enrollSchool}/>{state.notifications.filter((notice) => notice.recipient === "elijah" && notice.title.includes("Expunged")).map((notice) => <div className="sentNotice" key={notice.id}><b>{notice.title}</b><span>{notice.message}</span></div>)}</> : <div className="empty"><b>NO NEW NOTICES</b><p>Official silence. Enjoy it while it lasts.</p></div>}
    </DashboardShell>}
    {state.activeService === "evidence" && <DashboardShell role={state.activeRole} onSwitch={() => setRole(state.activeRole === "becky" ? "elijah" : "becky")} eyebrow="SHARED EVIDENCE CENTER" title={`${state.activeRole === "becky" ? "Claimant" : "Respondent"} Exhibits`}><EvidenceUploader evidence={state.evidence} owner={state.activeRole} disabled={state.hearing.phase !== "not_started"} onAdd={(draft) => addEvidence(state.activeRole, draft)} onRemove={removeEvidence} onContinue={enterCourt}/></DashboardShell>}
    {state.activeService === "court" && <DashboardShell role={state.activeRole} onSwitch={() => setRole(state.activeRole === "becky" ? "elijah" : "becky")} eyebrow="COURT OF ROMANTIC APPEALS" title="Becky v. Elijah">
      {state.hearing.phase === "not_started" ? <div className="claimantStatus"><h2>Hearing not yet opened.</h2><p>Both parties may file evidence before arguments are sealed.</p><button className="primary" onClick={enterCourt}>OPEN 10-MINUTE HEARING (60-SECOND DEMO)</button></div> : state.hearing.phase === "arguments" ? <LiveHearing durationSeconds={state.hearing.durationSeconds} startedAt={state.hearing.startedAt} claimantStatement={state.claimant.statement} respondentStatement={state.respondent.statement} evidence={state.evidence} jurors={state.jurors} onTimeExpired={openVoting} onSkip={openVoting} onJurorVote={vote}/> : state.hearing.phase === "voting" ? <section className="liveCourt"><div className="courtLive"><span>● JURY VOTING OPEN</span><b>{totalVotes}/5</b><small>AUDIENCE MODE</small></div><h2>Cast five fictional jury votes</h2><p>Invite hackathon judges to choose G or NG, or simulate the remaining ballots.</p><JuryPanel jurors={state.jurors} votingOpen onVote={vote}/><div className="caseActions"><button className="outline" onClick={simulateVotes}>SIMULATE REMAINING VOTES</button><button className="primary" disabled={totalVotes < 5} onClick={decide}>SEAL VOTE & SUMMON AI JUDGE</button></div></section> : state.verdict ? <AIJudgeVerdictPanel verdict={state.verdict.result} reasoning={state.verdict.reasoning} guiltyVotes={guiltyVotes} totalVotes={totalVotes} revealCount={state.hearing.revealCount} jurors={state.jurors} onContinue={state.verdict.result === "guilty" ? enrollSchool : () => setService("dashboard")}/> : null}
    </DashboardShell>}
    {state.activeService === "school" && <DashboardShell role={state.activeRole} onSwitch={() => setRole(state.activeRole === "becky" ? "elijah" : "becky")} eyebrow="EX TRAFFIC SCHOOL" title={state.activeRole === "elijah" ? "Elijah’s Rehabilitation" : "Becky’s Observer View"}>
      {state.activeRole === "becky" ? <div className="claimantStatus"><h2>School progress: {state.school.state.replaceAll("_", " ")}</h2><p>Becky may observe progress, but only Elijah can complete coursework.</p></div> : state.completed.school ? <RehabilitationDocuments name="Elijah" caseNumber={state.caseNumber} certificateNumber={state.documents.rehabilitationNumber || "Pending"} issuedAt={formatDemoDate(state.documents.issuedAt)} probationEndsAt="90 days after issue" onPrint={() => window.print()} onReturn={() => setRole("becky")}/> : <TrafficSchoolFlow questions={DEMO_QUIZ} lessonIndex={state.school.lessonIndex} questionIndex={state.school.questionIndex} answers={state.school.answers} passed={state.school.state === "passed" ? true : state.school.state === "failed" ? false : null} score={state.school.score} onCompleteLesson={completeLesson} onAnswer={answer} onRetry={retrySchool} onGraduate={graduate}/>} 
    </DashboardShell>}
    {state.activeService === "record" && <DashboardShell role={state.activeRole} onSwitch={() => setRole(state.activeRole === "becky" ? "elijah" : "becky")} eyebrow="PERMANENT DATING RECORD" title={state.activeRole === "becky" ? "Becky’s Official History" : "Elijah’s Case Record"}>
      {state.activeRole === "becky" ? <>{!state.completed.expunged ? <div className="recordGrid demoRecord"><section className="panel"><h2>Official relationships: {currentCount}</h2>{state.beckyRecords.map((record) => <div className={`recordRow ${record.archived ? "expunged" : ""}`} key={record.id}><b>{record.caseNumber || "PRE-USDD"}</b><span>{record.name}</span><em>{record.archived ? "EXPUNGED" : record.name === "Elijah" ? state.classification.toUpperCase() : "ARCHIVED EX"}</em></div>)}</section><section className="expunge"><span>POLICY §420.69</span><h2>Expunge Elijah</h2><p>A final guilty classification is eligible for specific-case expungement. The record will be archived, never deleted.</p><button className="dangerBtn" disabled={!canExpunge} onClick={expunge}>{canExpunge ? "EXPUNGE CASE" : "AWAITING FINAL GUILTY VERDICT"}</button></section></div> : <ExpungementCertificate holderName="Becky" expungedName="Elijah" caseNumber={state.caseNumber} certificateNumber={state.documents.expungementNumber || "Pending"} previousCount={previousCount} officialCount={currentCount} issuedAt={formatDemoDate(state.documents.issuedAt)} shared={state.documents.shared} onShare={share} onPrint={() => window.print()}/>} {shareError && <div className="notice" role="alert">{shareError}</div>}</> : <div className="claimantStatus"><h2>Case classification: {state.classification.replaceAll("_", " ")}</h2><p>Expungement changes Becky’s official count but preserves this archived case for both parties.</p></div>}
    </DashboardShell>}
    {state.activeService === "documents" && <DashboardShell role={state.activeRole} onSwitch={() => setRole(state.activeRole === "becky" ? "elijah" : "becky")} eyebrow="USDD DOCUMENT WALLET" title={`${state.activeRole === "becky" ? "Becky" : "Elijah"}’s Documents`}>
      {state.activeRole === "elijah" && state.documents.rehabilitationNumber ? <RehabilitationDocuments name="Elijah" caseNumber={state.caseNumber} certificateNumber={state.documents.rehabilitationNumber} issuedAt={formatDemoDate(state.documents.issuedAt)} probationEndsAt="90 days after issue" onPrint={() => window.print()} onReturn={() => setRole("becky")}/> : state.activeRole === "becky" && state.documents.expungementNumber ? <ExpungementCertificate holderName="Becky" expungedName="Elijah" caseNumber={state.caseNumber} certificateNumber={state.documents.expungementNumber} previousCount={previousCount} officialCount={currentCount} issuedAt={formatDemoDate(state.documents.issuedAt)} shared={state.documents.shared} onShare={share} onPrint={() => window.print()}/> : <div className="empty"><b>NO DOCUMENTS ISSUED</b><p>Complete the applicable court, school, or expungement process.</p></div>}
    </DashboardShell>}
  </section>;
}
