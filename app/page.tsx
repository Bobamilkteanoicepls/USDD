"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import DatingCourt from "./dating-court";
import {
  buildNotice,
  createInitialDemoCase,
  issueNumber,
  loadDemoCase,
  saveDemoCase,
  type DemoCaseState,
} from "./demo-case";
import "./speed-demo.css";

type View = "home" | "trash" | "record" | "court" | "school" | "registry";
type Identity = "becky" | "elijah";
type TrashPhase = "intake" | "classify" | "done";

const VIOLATIONS = ["Ghosting", "Mixed Signals", "Failure to Define the Relationship", "Dry Texting", "Emotionally Unavailable"];
const REGISTRY = [
  { name: "Maya Chen", city: "Austin, TX", status: "Certified Recyclable", score: 94 },
  { name: "Sofia Reyes", city: "Miami, FL", status: "Provisionally Recyclable", score: 88 },
  { name: "Amara Okafor", city: "Seattle, WA", status: "Certified Recyclable", score: 97 },
];

function Seal() {
  return <div className="usdd-seal"><span>♥</span><b>USDD</b><small>JUSTICE · CLOSURE · RECYCLING</small></div>;
}

function Page({ children, pageKey }: { children: React.ReactNode; pageKey: string }) {
  return <motion.main key={pageKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{children}</motion.main>;
}

function ServiceHead({ code, title, desc }: { code: string; title: string; desc: string }) {
  return <section className="serviceHead"><div><span>USDD ONLINE SERVICE · {code}</span><h1>{title}</h1><p>{desc}</p></div><Seal /></section>;
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [identity, setIdentity] = useState<Identity>("becky");
  const [menu, setMenu] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);
  const [caseState, setCaseState] = useState<DemoCaseState>(() => createInitialDemoCase());
  const [trashPhase, setTrashPhase] = useState<TrashPhase>("intake");
  const [shareToast, setShareToast] = useState(false);
  const [schoolStep, setSchoolStep] = useState(0);
  const [form, setForm] = useState({
    name: "Elijah",
    relationshipType: "situationship",
    relationshipLength: "6 months",
    comment: "Disappeared for four business days and returned with a meme.",
    violations: ["Ghosting", "Mixed Signals", "Failure to Define the Relationship"],
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCaseState(loadDemoCase());
      const saved = sessionStorage.getItem("usdd-active-identity");
      if (saved === "becky" || saved === "elijah") setIdentity(saved);
    });
    const sync = () => setCaseState(loadDemoCase());
    window.addEventListener("storage", sync);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("storage", sync); };
  }, []);

  const persist = (next: DemoCaseState) => { setCaseState(next); saveDemoCase(next); };
  const navigate = (next: View) => { setView(next); setMenu(false); setAccountMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const switchIdentity = (next: Identity) => {
    setIdentity(next);
    sessionStorage.setItem("usdd-active-identity", next);
    setView("home");
    setAccountMenu(false);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const resetAll = () => {
    const fresh = createInitialDemoCase();
    persist(fresh);
    localStorage.removeItem("usdd-records-v2");
    sessionStorage.setItem("usdd-active-identity", "becky");
    setIdentity("becky"); setView("home"); setTrashPhase("intake"); setSchoolStep(0); setShareToast(false); setAccountMenu(false);
  };

  const fileEx = () => setTrashPhase("classify");
  const classifyElijah = () => {
    const base = loadDemoCase();
    const filedAt = new Date().toISOString();
    const next: DemoCaseState = {
      ...base,
      claimant: { ...base.claimant, statement: form.comment },
      violations: form.violations,
      classification: "hazardous",
      filedAt,
      notice: "delivered",
      notifications: buildNotice({ ...base, violations: form.violations }),
      appeal: "not_filed",
      verdict: null,
      hearing: { phase: "not_started", startedAt: null, durationSeconds: 5, revealCount: 0 },
      jurors: base.jurors.map((juror) => ({ ...juror, vote: null })),
      completed: { ...base.completed, filed: true, noticed: true, heard: false, voted: false, school: false, expunged: false },
      beckyRecords: base.beckyRecords.map((record) => record.name === "Elijah" ? { ...record, archived: false } : record),
    };
    persist(next);
    setTrashPhase("done");
  };

  const requestCourt = () => {
    const next = { ...caseState, appeal: "filed" as const, notice: "read" as const, hearing: { ...caseState.hearing, phase: "not_started" as const, durationSeconds: 5 } };
    persist(next);
    navigate("court");
  };
  const enrollSchool = () => {
    persist({ ...caseState, school: { ...caseState.school, state: "lessons", lessonIndex: 0, questionIndex: 0, answers: [], score: 0 } });
    setSchoolStep(0);
    navigate("school");
  };
  const recordCourtVerdict = () => {
    const decidedAt = new Date().toISOString();
    persist({
      ...caseState,
      appeal: "decided",
      classification: "hazardous",
      hearing: { ...caseState.hearing, phase: "decided", revealCount: 5 },
      jurors: caseState.jurors.map((juror, index) => ({ ...juror, vote: index === 2 ? "not_guilty" : "guilty" })),
      verdict: { result: "guilty", reasoning: "The court finds that emotional buffering is not a recognized substitute for communication.", decidedAt },
      completed: { ...caseState.completed, heard: true, voted: true },
    });
  };
  const graduate = () => {
    const issuedAt = new Date().toISOString();
    persist({
      ...caseState,
      classification: "provisionally_recyclable",
      school: { ...caseState.school, state: "passed", lessonIndex: 3, questionIndex: 0, answers: [2], score: 1, attempts: 1 },
      documents: { ...caseState.documents, rehabilitationNumber: caseState.documents.rehabilitationNumber || issueNumber("REHAB"), rehabilitationIssuedAt: issuedAt },
      completed: { ...caseState.completed, school: true },
    });
    setSchoolStep(5);
  };
  const expunge = () => {
    const issuedAt = new Date().toISOString();
    persist({
      ...caseState,
      classification: "expunged",
      beckyRecords: caseState.beckyRecords.map((record) => record.name === "Elijah" ? { ...record, archived: true } : record),
      documents: { ...caseState.documents, expungementNumber: caseState.documents.expungementNumber || issueNumber("EXP"), expungementIssuedAt: issuedAt },
      completed: { ...caseState.completed, expunged: true },
    });
  };

  const officialCount = caseState.beckyRecords.filter((record) => !record.archived).length;
  const canExpunge = caseState.verdict?.result === "guilty" && !caseState.completed.expunged;
  const account = identity === "becky" ? { initial: "B", name: "Becky", detail: "Claimant" } : { initial: "E", name: "Elijah", detail: "Respondent" };
  const courtStatus: "filed" | "hearing" | "verdict" = caseState.verdict ? "verdict" : caseState.appeal === "filed" ? "hearing" : "filed";
  const navItems: Array<[View, string]> = [["home", "Home"], ["trash", "Trash Your Ex"], ["record", "Dating Record"], ["court", "Dating Court"], ["school", "Dating School"], ["registry", "Registry"]];

  return <div className="usdd-app">
    <header className="topbar">
      <button className="wordmark" onClick={() => navigate("home")}><Seal /><span><b>UNITED STATES</b><strong>DEPARTMENT OF DATING</strong></span></button>
      <nav className={menu ? "open" : ""}>{navItems.map(([key, title]) => <button key={key} className={view === key ? "active" : ""} onClick={() => navigate(key)}>{title}</button>)}</nav>
      <div className="accountSwitcher">
        <button className="accountTrigger" type="button" aria-expanded={accountMenu} onClick={() => setAccountMenu(!accountMenu)}><span className={`accountAvatar ${identity}`}>{account.initial}</span><span className="accountCopy"><small>ACCOUNT</small><b>{account.name}</b></span><em>⌄</em></button>
        {accountMenu && <motion.div className="accountDropdown" role="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}><small>SWITCH ACCOUNT</small>{(["becky", "elijah"] as Identity[]).map((role) => { const item = role === "becky" ? { initial: "B", name: "Becky", detail: "Claimant · File cases" } : { initial: "E", name: "Elijah", detail: "Respondent · Appeal or rehabilitate" }; return <button key={role} role="menuitem" className={identity === role ? "active" : ""} onClick={() => switchIdentity(role)}><span className={`accountAvatar ${role}`}>{item.initial}</span><span><b>{item.name}</b><small>{item.detail}</small></span>{identity === role && <em>✓</em>}</button>; })}<button className="resetAccount" type="button" onClick={resetAll}><span>↻</span><span><b>Reset all records</b><small>Return to Becky’s clean starting point</small></span></button></motion.div>}
      </div>
      <button className="menu" aria-label="Open navigation" onClick={() => setMenu(!menu)}>☰</button>
    </header>
    <div className="govline"><span>AN OFFICIAL FICTIONAL AGENCY OF THE INTERNET</span><span>USA.gov-ish　 |　 Español-ish</span></div>

    <AnimatePresence mode="wait">
      {view === "home" && <Page pageKey={`home-${identity}`}>
        <div className="psa"><b>PUBLIC SERVICE ANNOUNCEMENT</b><span>Summer situationship season is now in effect.</span><em>Advisory Level: Guarded 🚩</em></div>
        <section className="homeHero"><div><div className="kicker">THE UNITED STATES OF EMOTIONAL AMERICA</div><h1>UNITED STATES<br /><em>DEPARTMENT OF DATING</em></h1><p>{identity === "becky" ? "Protecting America’s emotional infrastructure since 2026." : "Welcome back, Elijah. Your emotional record requires attention."}</p><div className="heroBtns"><button className="primary" onClick={() => navigate(identity === "becky" ? "trash" : "court")}>{identity === "becky" ? "TRASH YOUR EX →" : "OPEN MY CASE →"}</button><button className="outline" onClick={() => navigate("registry")}>SEARCH REGISTRY</button></div><small>⚑ This is satire. Please do not contact your senator.</small></div><div className="heroSeal"><Seal /><div>ESTABLISHED 2026<br />WASHINGTON, D.C.(ISH)</div></div></section>
        {identity === "elijah" && caseState.notice !== "not_sent" && !caseState.completed.expunged && <motion.div className="classificationPopup" initial={{ opacity: 0, scale: .92, y: 25 }} animate={{ opacity: 1, scale: 1, y: 0 }} role="dialog" aria-label="Official classification warning"><button aria-label="Dismiss warning" onClick={() => persist({ ...caseState, notice: "read" })}>×</button><span>⚠ OFFICIAL CLASSIFICATION NOTICE</span><h2>BECKY HAS FILED YOU AS<br />EMOTIONAL WASTE.</h2><strong>HAZARDOUS · NON-RECYCLABLE</strong><p>To contest this extremely official accusation, request a Dating Court hearing—or begin court-approved emotional rehabilitation.</p><div><button className="primary" onClick={requestCourt}>REQUEST DATING COURT</button><button className="outline" onClick={enrollSchool}>TAKE DATING SCHOOL</button></div><small>Claimant-submitted satire. Not a factual finding.</small></motion.div>}
      </Page>}

      {view === "trash" && <Page pageKey="trash"><ServiceHead code="TYE-01" title="Trash Your Ex" desc="Properly classify emotionally hazardous relationship material." /><div className="subnav"><button className={trashPhase === "intake" ? "active" : ""}>1. Intake</button><button className={trashPhase === "classify" ? "active" : ""}>2. Classification</button></div>
        {trashPhase === "intake" && <section className="panel intake"><div className="formTitle"><span>FORM USDD-EX01</span><b>RELATIONSHIP MATERIAL INTAKE</b><em>PRE-FILLED FOR EXPRESS SERVICE</em></div><div className="formGrid"><label>SUBJECT NAME<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>RELATIONSHIP TYPE<select value={form.relationshipType} onChange={(e) => setForm({ ...form, relationshipType: e.target.value })}><option>situationship</option><option>dated</option><option>relationship</option><option>almost dated</option></select></label><label>RELATIONSHIP LENGTH<input value={form.relationshipLength} onChange={(e) => setForm({ ...form, relationshipLength: e.target.value })} /></label></div><label className="statementLabel">CLAIMANT STATEMENT<textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></label><fieldset><legend>DOCUMENTED VIOLATIONS</legend><div className="violations">{VIOLATIONS.map((violation) => <button type="button" key={violation} className={form.violations.includes(violation) ? "selected" : ""} onClick={() => setForm({ ...form, violations: form.violations.includes(violation) ? form.violations.filter((item) => item !== violation) : [...form.violations, violation] })}>{form.violations.includes(violation) ? "✓ " : "□ "}{violation}</button>)}</div></fieldset><button className="primary wide" onClick={fileEx}>FILE ELIJAH & CONTINUE →</button></section>}
        {trashPhase === "classify" && <section className="sorting"><div className="notice">Choose the appropriate disposal classification. The group chat has been notified.</div><div className="sortGrid"><button className="sortBin green" onClick={() => setTrashPhase("done")}><div /><section><span>♻</span><b>RECYCLABLE</b><small>May survive another relationship.</small></section></button><motion.div className="profileFile" whileHover={{ y: -5 }}><div className="fileTop"><span>USDD CASE FILE</span><b>EX-2026-00421</b></div><div className="avatar">E</div><h3>{form.name}</h3><p>{form.relationshipType} · {form.relationshipLength}</p><div className="tagrow">{form.violations.map((item) => <span key={item}>{item}</span>)}</div><div className="flagScore"><span>RED FLAG SCORE</span><b>87</b></div></motion.div><button className="sortBin red" onClick={classifyElijah}><div /><section><span>☣</span><b>NON-RECYCLABLE</b><small>EPA approval required.</small></section></button></div></section>}
        {trashPhase === "done" && <section className="trashComplete"><motion.div initial={{ scale: 1.8, rotate: -18, opacity: 0 }} animate={{ scale: 1, rotate: -5, opacity: 1 }}>PROPERLY DISPOSED</motion.div><h2>Congratulations.<br />You successfully took out the trash.</h2><p>Elijah has been classified as Hazardous Non-Recyclable and served an official-ish notice.</p><button className="primary" onClick={() => navigate("record")}>VIEW DATING RECORD →</button></section>}
      </Page>}

      {view === "record" && <Page pageKey="record"><ServiceHead code="REC-04" title="Becky’s Dating Record" desc="An unnecessarily official history of romantic decisions." /><section className="speedRecord"><div className="recordLedger"><span className="formCode">PERMANENT DATING RECORD</span><h2>Official relationships: {officialCount}</h2>{caseState.beckyRecords.map((record) => <article className={record.archived ? "archived" : ""} key={record.id}><span>{record.caseNumber || "PRE-USDD"}</span><b>{record.name}</b><em>{record.archived ? "EXPUNGED" : record.name === "Elijah" ? caseState.classification.replaceAll("_", " ").toUpperCase() : "ARCHIVED EX"}</em></article>)}</div>{!caseState.completed.expunged && <aside className="recordAction"><span>POLICY §420.69</span><h2>Officially expunge your ex</h2><p>Remove Elijah from Becky’s official count while preserving the court record for dramatic archival purposes.</p><button className="dangerBtn" disabled={!canExpunge} onClick={expunge}>{canExpunge ? "OFFICIALLY EXPUNGE ELIJAH" : "AVAILABLE AFTER FINAL GUILTY VERDICT"}</button></aside>}</section>{caseState.completed.expunged && <section className="speedCertificate"><Seal /><small>UNITED STATES DEPARTMENT OF DATING</small><h2>Certificate of Dating Record Expungement</h2><p>This certifies that <b>BECKY</b> has officially-ish expunged</p><h3>ELIJAH · CASE {caseState.caseNumber}</h3><motion.strong initial={{ scale: 2, rotate: -18, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }}>USDD · EXPUNGED</motion.strong><div><span>PREVIOUS COUNT<b>{officialCount + 1}</b></span><span>NEW OFFICIAL COUNT<b>{officialCount}</b></span><span>CERTIFICATE<b>{caseState.documents.expungementNumber}</b></span></div><button className="primary" onClick={() => setShareToast(true)}>↗ SHARE CERTIFICATE</button>{shareToast && <p className="shareToast">Copied to the fictional clipboard. The group chat is impressed.</p>}</section>}</Page>}

      {view === "court" && <Page pageKey="court"><DatingCourt activeIdentity={identity} caseData={{ caseNumber: caseState.caseNumber, claimant: "Becky", respondent: "Elijah", allegations: caseState.violations, status: courtStatus, evidenceCount: caseState.evidence.length, hearingDate: "Today · Starts in 00:05", verdict: caseState.verdict?.result }} onOpenMyCase={() => requestCourt()} onMyCaseVerdict={recordCourtVerdict} onExitMyCase={() => navigate("school")} /></Page>}

      {view === "school" && <Page pageKey="school"><ServiceHead code="EDU-03" title="Dating School" desc="Court-approved remedial education for emotionally hazardous operators." /><section className="speedSchool">{schoolStep < 3 && <><div className="schoolLogo">USDD DATING SCHOOL<small>ACCREDITED BY ABSOLUTELY NO ONE</small></div><div className="avatar">E</div><span>MODULE {schoolStep + 1} OF 3</span><h2>{["Learning empathy…", "Practicing communication…", "Deleting “u up?” drafts…"][schoolStep]}</h2><progress value={schoolStep + 1} max="3" /><button className="primary" onClick={() => setSchoolStep(schoolStep + 1)}>COMPLETE MODULE →</button></>}{schoolStep === 3 && <><span>FINAL EXAM · EXPRESS EDITION</span><h2>Your partner says, “We need to talk.”</h2><div className="schoolAnswers"><button onClick={() => setSchoolStep(3)}>Reply in three business days</button><button onClick={() => setSchoolStep(3)}>Disappear</button><button onClick={graduate}>Talk to them honestly ✓</button></div></>}{schoolStep >= 5 && <div className="schoolCertificate"><Seal /><small>UNITED STATES DEPARTMENT OF DATING</small><h2>ELIJAH</h2><p>has completed court-approved emotional rehabilitation.</p><motion.strong initial={{ scale: 2, rotate: -15, opacity: 0 }} animate={{ scale: 1, rotate: -5, opacity: 1 }}>PROVISIONALLY RECYCLABLE</motion.strong><span>{caseState.documents.rehabilitationNumber}</span><button className="primary" onClick={() => navigate("court")}>BROWSE ONGOING CASES →</button></div>}</section></Page>}

      {view === "registry" && <Page pageKey="registry"><ServiceHead code="REG-05" title="Recyclable Registry" desc="Search the national database of emotionally rehabilitated citizens." /><section className="registryGrid speedRegistry">{REGISTRY.map((person) => <article key={person.name}><div className="avatar">{person.name.split(" ").map((part) => part[0]).join("")}</div><span className="verified">♻ {person.status}</span><h3>{person.name}</h3><p>{person.city}</p><div><span>EMOTIONAL SAFETY SCORE<b>{person.score}/100</b></span></div><button className="outline">VIEW VERIFIED PROFILE</button></article>)}</section><section className="profileImport"><span>PROFILE INTEGRATIONS</span><h2>Take your recyclable status with you.</h2><p>Export a fictional verification badge to your dating profile.</p><div>{["Hinge", "Bumble", "Tinder"].map((app) => <button key={app}>ADD ♻ BADGE TO {app.toUpperCase()}</button>)}</div></section></Page>}
    </AnimatePresence>
    <footer><Seal /><div><b>UNITED STATES DEPARTMENT OF DATING</b><p>A fictional agency protecting America’s emotional infrastructure.</p></div><span>JUSTICE · CLOSURE · RECYCLING</span></footer>
  </div>;
}
