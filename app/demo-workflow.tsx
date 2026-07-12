"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
  const [activeRole, setActiveRole] = useState<DemoRole>("becky");
  const [activeService, setActiveService] = useState<DemoCaseState["activeService"]>("dashboard");
  const [ready, setReady] = useState(false);
  const [shareError, setShareError] = useState("");
  const update = (fn: (previous: DemoCaseState) => DemoCaseState) => setState((previous) => fn(previous));

  useEffect(() => { const frame = window.requestAnimationFrame(() => { setState(loadDemoCase()); setActiveRole((sessionStorage.getItem("usdd-demo-role") as DemoRole)||"becky");setActiveService((sessionStorage.getItem("usdd-demo-service") as DemoCaseState["activeService"])||"dashboard");setReady(true); }); return () => window.cancelAnimationFrame(frame); }, []);
  useEffect(() => { if (ready) saveDemoCase(state); }, [ready, state]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === DEMO_STORAGE_KEY || event.key === DEMO_EVENT_KEY) setState(loadDemoCase()); };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    const navigate = (event: Event) => {
      const service = (event as CustomEvent<DemoCaseState["activeService"]>).detail;
      setActiveService(service);
      sessionStorage.setItem("usdd-demo-service", service);
    };
    window.addEventListener("usdd-navigate-service", navigate);
    return () => window.removeEventListener("usdd-navigate-service", navigate);
  }, []);
  useEffect(() => {
    if (state.hearing.phase !== "decided" || state.hearing.revealCount >= 5) return;
    const timer = window.setTimeout(() => update((s) => ({ ...s, hearing: { ...s.hearing, revealCount: Math.min(5, s.hearing.revealCount + 1) } })), 420);
    return () => window.clearTimeout(timer);
  }, [state.hearing.phase, state.hearing.revealCount]);

  const setRole = (role: DemoRole) => {setActiveRole(role);sessionStorage.setItem("usdd-demo-role",role);const next=role === "elijah" && state.notice !== "not_sent" ? "notifications" : "dashboard";setActiveService(next);sessionStorage.setItem("usdd-demo-service",next)};
  const setService = (service: DemoCaseState["activeService"]) => {setActiveService(service);sessionStorage.setItem("usdd-demo-service",service)};
  const unread = state.notifications.filter((notice) => notice.recipient === activeRole && !notice.read).length;
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
  const fileAppeal = () => { update((s) => ({ ...s, appeal: "filed", notifications: [...s.notifications, { id: `appeal-${Date.now()}`, recipient: "becky", channel: "in_app", title: "Elijah Filed an Appeal", message: `Elijah is contesting classification ${s.caseNumber} and may now submit evidence.`, createdAt: new Date().toISOString(), read: false }] })); setService("evidence"); };
  const enrollSchool = () => { update((s) => ({ ...s, school: { ...s.school, state: "lessons", lessonIndex: 0, questionIndex: 0, answers: [], score: 0 }, notifications: [...s.notifications, { id: `school-${Date.now()}`, recipient: "becky", channel: "in_app", title: "Elijah Entered Rehabilitation", message: `Elijah enrolled in Ex Traffic School for case ${s.caseNumber}.`, createdAt: new Date().toISOString(), read: false }] })); setService("school"); };
  const addEvidence = (owner: DemoRole, draft: { file: File; dataUrl: string; caption: string }) => {
    const item: EvidenceItem = { id: `evidence-${Date.now()}`, owner, fileName: draft.file.name, caption: draft.caption, dataUrl: draft.dataUrl, submittedAt: new Date().toISOString() };
    update((s) => ({ ...s, evidence: [...s.evidence, item], completed: { ...s.completed, evidence: true } }));
  };
  const removeEvidence = (id: string) => update((s) => { const evidence = s.evidence.filter((item) => item.id !== id); return { ...s, evidence, completed: { ...s.completed, evidence: evidence.length > 0 } }; });
  const enterCourt = () => { update((s) => s.appeal === "not_filed" ? s : ({ ...s, appeal: "hearing", hearing: { ...s.hearing, phase: "arguments", startedAt: Date.now(), revealCount: 0 }, notifications: [...s.notifications, ...(["becky","elijah"] as DemoRole[]).map((recipient) => ({ id: `hearing-${recipient}-${Date.now()}`, recipient, channel: "in_app" as const, title: "Hearing Now in Session", message: `Traffic Court opened arguments in ${s.caseNumber}.`, createdAt: new Date().toISOString(), read: false }))] })); setService("court"); };
  const openVoting = () => update((s) => ({ ...s, hearing: { ...s.hearing, phase: "voting" }, completed: { ...s.completed, heard: true } }));
  const vote = (jurorId: string, voteValue: Juror["vote"]) => update((s) => ({ ...s, jurors: s.jurors.map((juror) => juror.id === jurorId ? { ...juror, vote: voteValue } : juror) }));
  const simulateVotes = () => update((s) => ({ ...s, jurors: s.jurors.map((juror, index) => juror.vote ? juror : ({ ...juror, vote: index === 3 ? "not_guilty" : "guilty" })) }));
  const decide = () => update((s) => {
    const voted = s.jurors.filter((juror) => juror.vote);
    const guilty = voted.filter((juror) => juror.vote === "guilty").length;
    const result: "guilty" | "appeal_granted" | "hung_jury" = voted.length < 5 ? "hung_jury" : guilty >= 3 ? "guilty" : "appeal_granted";
    const decidedAt = new Date().toISOString();
    const classification = result === "appeal_granted" ? "recyclable" as const : s.classification;
    const next = { ...s, classification, appeal: "decided" as const, hearing: { ...s.hearing, phase: "decided" as const, revealCount: 0 }, verdict: { result, reasoning: caseAwareReasoning(s), decidedAt }, completed: { ...s.completed, voted: true }, notifications: [...s.notifications, ...(["becky","elijah"] as DemoRole[]).map((recipient) => ({ id: `verdict-${recipient}-${Date.now()}`, recipient, channel: "in_app" as const, title: "Court Verdict Issued", message: `The simulated AI Judge issued ${result.replaceAll("_", " ")} in ${s.caseNumber}.`, createdAt: decidedAt, read: false }))] };
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
  const graduate = () => { update((s) => {
    const issuedAt = new Date().toISOString(); onSyncElijah?.("provisionally_recyclable");
    return { ...s, classification: "provisionally_recyclable", documents: { ...s.documents, rehabilitationNumber: s.documents.rehabilitationNumber || issueNumber("REHAB"), rehabilitationIssuedAt: issuedAt }, completed: { ...s.completed, school: true }, notifications: [...s.notifications, { id: `graduate-${Date.now()}`, recipient: "becky", channel: "in_app", title: "Rehabilitation Completed", message: `Elijah passed Ex Traffic School with ${s.school.score}/3 and is now Provisionally Recyclable.`, createdAt: issuedAt, read: false }] };
  }); setService("documents"); };
  const expunge = () => { update((s) => {
    const issuedAt = new Date().toISOString(); onSyncElijah?.("expunged");
    return { ...s, classification: "expunged", beckyRecords: s.beckyRecords.map((record) => record.name === "Elijah" ? { ...record, archived: true } : record), documents: { ...s.documents, expungementNumber: s.documents.expungementNumber || issueNumber("EXP"), expungementIssuedAt: issuedAt }, notifications: [...s.notifications, { id: `notice-expunged-${Date.now()}`, recipient: "elijah", channel: "in_app", title: "Case Record Expunged", message: `Becky expunged case ${s.caseNumber} from her official dating history. The archived record remains visible to the parties.`, createdAt: issuedAt, read: false }], completed: { ...s.completed, expunged: true } };
  }); setService("record"); };
  const reset = () => { const fresh = createInitialDemoCase(); setState(fresh); saveDemoCase(fresh); setActiveRole("becky"); sessionStorage.setItem("usdd-demo-role", "becky"); setService("dashboard"); };
  const share = async () => shareCertificate("USDD Expungement Certificate", `Becky’s official relationship count is now ${currentCount}. Fictional case ${state.caseNumber} was expunged.`, window.location.href, () => update((s) => ({ ...s, documents: { ...s.documents, shared: true } })), setShareError);

  const renderDashboard = () => activeRole === "becky" ? (
    <DashboardShell role="becky" onSwitch={() => setRole("elijah")} status={`Official relationships: ${currentCount}`}>
      {!state.completed.filed ? <section className="filing"><span className="formCode">FORM USDD-EX01 · REVIEW BEFORE FILING</span><h2>Classify Elijah as emotional waste</h2><div className="allegations">{state.violations.map((item) => <span key={item}>🚩 {item}</span>)}</div><label>CLAIMANT STATEMENT<textarea value={state.claimant.statement} onChange={(event) => update((s) => ({ ...s, claimant: { ...s.claimant, statement: event.target.value } }))}/></label><button className="dangerBtn" type="button" onClick={fileCase}>FILE & SERVE HAZARDOUS CLASSIFICATION</button></section>
      : <section className="claimantStatus"><h2>Case {state.caseNumber}</h2><p>Becky can review both parties’ evidence, observe the hearing, view the verdict, and expunge Elijah after a final guilty ruling.</p><div className="caseActions"><button className="outline" onClick={() => setService("evidence")}>REVIEW EVIDENCE</button><button className="outline" onClick={() => setService("court")}>OPEN COURTROOM</button>{canExpunge && <button className="dangerBtn" onClick={expunge}>EXPUNGE ELIJAH NOW</button>}</div></section>}
    </DashboardShell>
  ) : (
    <DashboardShell role="elijah" onSwitch={() => setRole("becky")} status={`Classification: ${state.classification.replaceAll("_", " ")}`}>
      {state.notice === "not_sent" ? <div className="empty"><b>NO ACTIVE CASE</b><p>Switch to Becky to file the demonstration case.</p></div> : <div className="claimantStatus"><motion.div className={`respondentClassification ${state.classification}`} initial={{ opacity: 0, scale: .92, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}><span>OFFICIAL USDD CLASSIFICATION</span><h2>{state.classification === "hazardous" ? "YOU ARE EMOTIONAL WASTE" : state.classification === "recyclable" ? "THE COURT HAS CLEARED YOU" : state.classification === "certified_recyclable" ? "CERTIFIED FOR CIVILIAN DATING" : state.classification === "provisionally_recyclable" ? "REHABILITATION IN PROGRESS" : state.classification === "expunged" ? "CASE EXPUNGED" : "CLASSIFICATION PENDING"}</h2><strong>{state.classification === "hazardous" ? "☣ HAZARDOUS NON-RECYCLABLE" : state.classification.replaceAll("_", " ").toUpperCase()}</strong><p>Assigned by Becky · Case {state.caseNumber}</p><div>{state.violations.map((violation) => <b key={violation}>🚩 {violation}</b>)}</div><small>This is a fictional claimant-submitted classification, not a factual finding.</small></motion.div><h2>Respond to case {state.caseNumber}</h2><p>You may open the official notice, file evidence, monitor the court, or enter rehabilitation.</p><div className="caseActions"><button className="primary" onClick={() => setService("notifications")}>OPEN NOTIFICATION INBOX {unread ? `(${unread})` : ""}</button><button className="outline" onClick={() => setService("evidence")}>EVIDENCE CENTER</button><button className="outline" onClick={() => setService("court")}>TRAFFIC COURT</button></div></div>}
    </DashboardShell>
  );

  return <section className="demoShell fullDemo">
    <div className="demoNotice"><b>⚑ INTERACTIVE DEMO</b><span>Two simulated accounts share one persistent case. Open this site in two tabs to watch updates synchronize.</span><button type="button" onClick={reset}>RESET EVERYTHING</button></div>
    <div className="demoTop"><div><span>CASE {state.caseNumber}</span><h2>Becky <em>v.</em> Elijah</h2><p>{state.violations.join(" · ")}</p></div><div className={`caseStatus ${state.classification}`}>{state.classification.replaceAll("_", " ").toUpperCase()}</div></div>
    <RoleSwitch activeRole={activeRole} notificationCount={activeRole === "elijah" ? unread : 0} onSwitch={setRole}/>
    <nav className="caseNav" aria-label="Case services">{services.map(([value, text]) => <button key={value} className={activeService === value ? "active" : ""} onClick={() => setService(value)}>{text}{value === "notifications" && unread > 0 ? <b>{unread}</b> : null}</button>)}</nav>
    <div className="journey">{milestones.map(([text, done], index) => <span className={done ? "done" : ""} key={text}><i>{done ? "✓" : index + 1}</i>{text.toUpperCase()}</span>)}</div>

    {activeService === "dashboard" && renderDashboard()}
    {activeService === "notifications" && <DashboardShell role={activeRole} onSwitch={() => setRole(activeRole === "becky" ? "elijah" : "becky")} eyebrow="USDD NOTIFICATION CENTER" title={`${activeRole === "becky" ? "Becky" : "Elijah"}’s Inbox`}>
      {activeRole === "elijah" && state.notice !== "not_sent" ? <><div className="deliveryChannels">{state.notifications.filter((notice) => notice.title.includes("Classification")).map((notice) => <article key={notice.id}><b>{notice.channel === "email" ? "✉ EMAIL" : notice.channel === "sms" ? "▣ SMS" : "● IN-APP"}</b><span>DELIVERED</span><small>{formatDemoDate(notice.createdAt)}</small></article>)}</div><NotificationInboxCard caseNumber={state.caseNumber} claimantName="Becky" filedAt={formatDemoDate(state.filedAt)} violations={state.violations} isRead={state.notice === "read"} onOpen={markNoticeRead} onAppeal={fileAppeal} onSchool={enrollSchool}/>{state.notifications.filter((notice) => notice.recipient === "elijah" && !notice.title.includes("Classification")).map((notice) => <div className="sentNotice" key={notice.id}><b>{notice.title}</b><span>{notice.message}</span><small>{formatDemoDate(notice.createdAt)}</small></div>)}</> : activeRole === "becky" && state.notifications.some((notice) => notice.recipient === "becky") ? <div className="notificationList">{state.notifications.filter((notice) => notice.recipient === "becky").map((notice) => <div className={`sentNotice ${notice.read ? "read" : ""}`} key={notice.id}><b>{notice.title}</b><span>{notice.message}</span><small>{formatDemoDate(notice.createdAt)}</small></div>)}<button className="outline" onClick={() => update((s) => ({ ...s, notifications: s.notifications.map((notice) => notice.recipient === "becky" ? { ...notice, read: true } : notice) }))}>MARK ALL READ</button></div> : <div className="empty"><b>NO NEW NOTICES</b><p>Official silence. Enjoy it while it lasts.</p></div>}
    </DashboardShell>}
    {activeService === "evidence" && <DashboardShell role={activeRole} onSwitch={() => setRole(activeRole === "becky" ? "elijah" : "becky")} eyebrow="SHARED EVIDENCE CENTER" title={`${activeRole === "becky" ? "Claimant" : "Respondent"} Exhibits`}>{activeRole === "elijah" && state.hearing.phase === "not_started" && <section className="defenseEditor"><span className="formCode">RESPONDENT ARGUMENT</span><label>SELECT DEFENSE<select value={state.respondent.defense} onChange={(event) => update((s) => ({ ...s, respondent: { ...s.respondent, defense: event.target.value } }))}>{["I did not ghost. I was emotionally buffering.","We were never officially exclusive.","I replied eventually.","Mercury was in retrograde.","The plaintiff also left me on read."].map((defense) => <option key={defense}>{defense}</option>)}</select></label><label>ELIJAH’S STATEMENT<textarea value={state.respondent.statement} onChange={(event) => update((s) => ({ ...s, respondent: { ...s.respondent, statement: event.target.value } }))}/></label></section>}<EvidenceUploader evidence={state.evidence} owner={activeRole} disabled={state.hearing.phase !== "not_started"} onAdd={(draft) => addEvidence(activeRole, draft)} onRemove={removeEvidence} onContinue={enterCourt}/></DashboardShell>}
    {activeService === "court" && <DashboardShell role={activeRole} onSwitch={() => setRole(activeRole === "becky" ? "elijah" : "becky")} eyebrow="COURT OF ROMANTIC APPEALS" title="Becky v. Elijah">
      {state.appeal === "not_filed" ? <div className="claimantStatus"><h2>No appeal has been filed.</h2><p>{activeRole === "elijah" ? "Open your official notice to file an appeal before entering court." : "The court cannot schedule a hearing until Elijah appeals."}</p>{activeRole === "elijah" && state.notice !== "not_sent" && <button className="primary" onClick={() => setService("notifications")}>OPEN NOTICE & FILE APPEAL</button>}</div> : state.hearing.phase === "not_started" ? <div className="claimantStatus"><h2>Hearing not yet opened.</h2><p>Both parties may file evidence before arguments are sealed.</p><button className="primary" onClick={enterCourt}>OPEN 10-MINUTE HEARING (60-SECOND DEMO)</button></div> : state.hearing.phase === "arguments" ? <LiveHearing durationSeconds={state.hearing.durationSeconds} startedAt={state.hearing.startedAt} claimantStatement={state.claimant.statement} respondentStatement={state.respondent.statement} evidence={state.evidence} jurors={state.jurors} onTimeExpired={openVoting} onSkip={openVoting} onJurorVote={vote}/> : state.hearing.phase === "voting" ? <section className="liveCourt"><div className="courtLive"><span>● JURY VOTING OPEN</span><b>{totalVotes}/5</b><small>AUDIENCE MODE</small></div><h2>Cast five fictional jury votes</h2><p>Invite hackathon judges to choose G or NG, or simulate the remaining ballots.</p><JuryPanel jurors={state.jurors} votingOpen onVote={vote}/><div className="caseActions"><button className="outline" onClick={simulateVotes}>SIMULATE REMAINING VOTES</button><button className="primary" disabled={totalVotes < 5} onClick={decide}>SEAL VOTE & SUMMON AI JUDGE</button></div></section> : state.verdict ? <AIJudgeVerdictPanel verdict={state.verdict.result} reasoning={state.verdict.reasoning} guiltyVotes={guiltyVotes} totalVotes={totalVotes} revealCount={state.hearing.revealCount} jurors={state.jurors} onContinue={state.verdict.result === "guilty" ? enrollSchool : () => setService("dashboard")}/> : null}
    </DashboardShell>}
    {activeService === "school" && <DashboardShell role={activeRole} onSwitch={() => setRole(activeRole === "becky" ? "elijah" : "becky")} eyebrow="EX TRAFFIC SCHOOL" title={activeRole === "elijah" ? "Elijah’s Rehabilitation" : "Becky’s Observer View"}>
      {activeRole === "becky" ? <div className="claimantStatus"><h2>School progress: {state.school.state.replaceAll("_", " ")}</h2><p>Becky may observe progress, but only Elijah can complete coursework.</p></div> : state.notice === "not_sent" ? <div className="empty"><b>NOT ELIGIBLE</b><p>No case classification exists yet.</p></div> : state.completed.school ? <RehabilitationDocuments name="Elijah" caseNumber={state.caseNumber} certificateNumber={state.documents.rehabilitationNumber || "Pending"} issuedAt={formatDemoDate(state.documents.rehabilitationIssuedAt)} probationEndsAt={state.documents.rehabilitationIssuedAt ? new Date(new Date(state.documents.rehabilitationIssuedAt).getTime()+90*86400000).toLocaleDateString() : "Pending"} onPrint={() => window.print()} onReturn={() => setRole("becky")}/> : <TrafficSchoolFlow questions={DEMO_QUIZ} lessonIndex={state.school.lessonIndex} questionIndex={state.school.questionIndex} answers={state.school.answers} passed={state.school.state === "passed" ? true : state.school.state === "failed" ? false : null} score={state.school.score} onCompleteLesson={completeLesson} onAnswer={answer} onRetry={retrySchool} onGraduate={graduate}/>}
    </DashboardShell>}
    {activeService === "record" && <DashboardShell role={activeRole} onSwitch={() => setRole(activeRole === "becky" ? "elijah" : "becky")} eyebrow="PERMANENT DATING RECORD" title={activeRole === "becky" ? "Becky’s Official History" : "Elijah’s Case Record"}>
      {activeRole === "becky" ? <><div className="recordGrid demoRecord"><section className="panel"><h2>Official relationships: {currentCount}</h2>{state.beckyRecords.map((record) => <div className={`recordRow ${record.archived ? "expunged" : ""}`} key={record.id}><b>{record.caseNumber || "PRE-USDD"}</b><span>{record.name}</span><em>{record.archived ? "EXPUNGED" : record.name === "Elijah" ? state.classification.toUpperCase() : "ARCHIVED EX"}</em></div>)}</section>{!state.completed.expunged && <section className="expunge"><span>POLICY §420.69</span><h2>Expunge Elijah</h2><p>A final guilty classification is eligible for specific-case expungement. The record will be archived, never deleted.</p><button className="dangerBtn" disabled={!canExpunge} onClick={expunge}>{canExpunge ? "EXPUNGE CASE" : "AWAITING FINAL GUILTY VERDICT"}</button></section>}</div>{state.completed.expunged && <ExpungementCertificate holderName="Becky" expungedName="Elijah" caseNumber={state.caseNumber} certificateNumber={state.documents.expungementNumber || "Pending"} previousCount={previousCount} officialCount={currentCount} issuedAt={formatDemoDate(state.documents.expungementIssuedAt)} shared={state.documents.shared} onShare={share} onPrint={() => window.print()}/>} {shareError && <div className="notice" role="alert">{shareError}</div>}</> : <div className="claimantStatus"><h2>Case classification: {state.classification.replaceAll("_", " ")}</h2><p>Expungement changes Becky’s official count but preserves this archived case for both parties.</p></div>}
    </DashboardShell>}
    {activeService === "documents" && <DashboardShell role={activeRole} onSwitch={() => setRole(activeRole === "becky" ? "elijah" : "becky")} eyebrow="USDD DOCUMENT WALLET" title={`${activeRole === "becky" ? "Becky" : "Elijah"}’s Documents`}>
      {activeRole === "elijah" && state.documents.rehabilitationNumber ? <RehabilitationDocuments name="Elijah" caseNumber={state.caseNumber} certificateNumber={state.documents.rehabilitationNumber} issuedAt={formatDemoDate(state.documents.rehabilitationIssuedAt)} probationEndsAt={state.documents.rehabilitationIssuedAt ? new Date(new Date(state.documents.rehabilitationIssuedAt).getTime()+90*86400000).toLocaleDateString() : "Pending"} onPrint={() => window.print()} onReturn={() => setRole("becky")}/> : activeRole === "becky" && state.documents.expungementNumber ? <ExpungementCertificate holderName="Becky" expungedName="Elijah" caseNumber={state.caseNumber} certificateNumber={state.documents.expungementNumber} previousCount={previousCount} officialCount={currentCount} issuedAt={formatDemoDate(state.documents.expungementIssuedAt)} shared={state.documents.shared} onShare={share} onPrint={() => window.print()}/> : <div className="empty"><b>NO DOCUMENTS ISSUED</b><p>Complete the applicable court, school, or expungement process.</p></div>}
    </DashboardShell>}
  </section>;
}
