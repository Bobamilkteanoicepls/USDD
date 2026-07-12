"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import "./dating-court.css";
import "./dating-court-speed.css";

export type DatingCourtIdentity = "becky" | "elijah";
export type DatingCourtCase = { caseNumber: string; claimant: string; respondent: string; allegations: string[]; status: "filed" | "evidence" | "hearing" | "verdict" | "closed"; evidenceCount: number; hearingDate?: string; verdict?: string };
export type DatingCourtProps = { activeIdentity: DatingCourtIdentity; caseData?: DatingCourtCase; onOpenMyCase?: (caseNumber: string) => void; onMyCaseVerdict?: () => void; onExitMyCase?: () => void; onEnrollJury?: (caseNumber: string) => void; onVote?: (caseNumber: string, vote: "sustain" | "overturn") => void };
type PublicCase = { caseNumber: string; caption: string; allegation: string; hearing: string; seats: number; accent: "amber" | "blue" | "green" };

const DEFAULT_CASE: DatingCourtCase = { caseNumber: "EX-2026-00421", claimant: "Becky", respondent: "Elijah", allegations: ["Alleged ghosting", "Mixed signals", "Failure to define the relationship"], status: "hearing", evidenceCount: 1, hearingDate: "Today · Starts in 00:05" };
const ONGOING_CASES: PublicCase[] = [
  { caseNumber: "EX-2026-01108", caption: "Morgan v. Casey", allegation: "Excessive use of “we’ll see”", hearing: "Now seating", seats: 2, accent: "amber" },
  { caseNumber: "EX-2026-00977", caption: "Avery v. Cameron", allegation: "Failure to return a favorite hoodie", hearing: "Today · 4:15 PM", seats: 0, accent: "blue" },
  { caseNumber: "EX-2026-01231", caption: "Riley v. Jordan", allegation: "Unlicensed breadcrumb distribution", hearing: "Tomorrow · 10:00 AM", seats: 1, accent: "green" },
];
const JURORS = ["P", "J", "R", "G", "T"];

export default function DatingCourt({ activeIdentity, caseData = DEFAULT_CASE, onOpenMyCase, onMyCaseVerdict, onExitMyCase, onEnrollJury, onVote }: DatingCourtProps) {
  const [tab, setTab] = useState<"mine" | "ongoing">("mine");
  const [courtOpen, setCourtOpen] = useState(false);
  const [mode, setMode] = useState<"party" | "jury">("party");
  const [selectedCase, setSelectedCase] = useState<PublicCase | null>(null);
  const [seconds, setSeconds] = useState(5);
  const [phase, setPhase] = useState<"arguments" | "votes" | "verdict">("arguments");
  const [revealedVotes, setRevealedVotes] = useState(0);
  const [juryVote, setJuryVote] = useState<"sustain" | "overturn" | null>(null);
  const person = activeIdentity === "becky" ? caseData.claimant : caseData.respondent;
  const role = activeIdentity === "becky" ? "Filing party" : "Respondent";
  const progress = useMemo(() => ((5 - seconds) / 5) * 100, [seconds]);

  useEffect(() => {
    if (!courtOpen || seconds <= 0 || juryVote) return;
    const timer = window.setTimeout(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [courtOpen, juryVote, seconds]);
  useEffect(() => {
    if (!courtOpen || mode !== "party" || seconds > 0 || phase !== "arguments") return;
    const frame = window.requestAnimationFrame(() => setPhase("votes"));
    return () => window.cancelAnimationFrame(frame);
  }, [courtOpen, mode, phase, seconds]);
  useEffect(() => {
    if (!courtOpen || mode !== "party" || phase !== "votes") return;
    if (revealedVotes >= 5) { const timer = window.setTimeout(() => { setPhase("verdict"); onMyCaseVerdict?.(); }, 420); return () => window.clearTimeout(timer); }
    const timer = window.setTimeout(() => setRevealedVotes((value) => value + 1), 340);
    return () => window.clearTimeout(timer);
  }, [courtOpen, mode, onMyCaseVerdict, phase, revealedVotes]);

  const enterMyCase = () => { onOpenMyCase?.(caseData.caseNumber); setMode("party"); setSelectedCase(null); setSeconds(5); setPhase(caseData.verdict ? "verdict" : "arguments"); setRevealedVotes(caseData.verdict ? 5 : 0); setJuryVote(null); setCourtOpen(true); };
  const enroll = (item: PublicCase) => { if (!item.seats) return; setSelectedCase(item); setMode("jury"); setJuryVote(null); setSeconds(5); setCourtOpen(false); onEnrollJury?.(item.caseNumber); };
  const enterJury = () => { setMode("jury"); setSeconds(5); setJuryVote(null); setCourtOpen(true); };
  const castVote = (vote: "sustain" | "overturn") => { if (!selectedCase) return; setJuryVote(vote); onVote?.(selectedCase.caseNumber, vote); };

  return <section className="dc-hub">
    <header className="dc-masthead"><div className="dc-court-seal"><span>⚖</span><b>USDD</b><small>COURT OF ROMANTIC APPEALS</small></div><div><span className="dc-eyebrow">UNITED STATES DEPARTMENT OF DATING · JUDICIAL SERVICES</span><h1>Dating Court</h1><p>Fair hearings. Questionable precedents. Emotionally binding-ish decisions.</p></div><div className="dc-session"><i /> COURT IS IN SESSION</div></header>
    <div className="dc-identity-strip"><span>SECURE CASE ACCESS</span><p>Signed in as <strong>{person}</strong> · {role}</p><small>All proceedings shown here are fictional.</small></div>
    <nav className="dc-tabs" aria-label="Dating Court docket"><button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>MY CASE</button><button className={tab === "ongoing" ? "active" : ""} onClick={() => setTab("ongoing")}>ONGOING CASES</button></nav>

    {tab === "mine" && <section className="dc-section"><div className="dc-section-heading"><div><span>PERSONAL DOCKET</span><h2>My Case</h2></div><b>1 ACTIVE MATTER</b></div><article className="dc-my-case-card"><div className="dc-folder-tab">OFFICIAL CASE FILE</div><div className="dc-case-main"><div className={`dc-party-avatar dc-${activeIdentity}`}>{person[0]}</div><div className="dc-case-copy"><span>{caseData.caseNumber} · {role.toUpperCase()}</span><h3>{caseData.claimant} <em>v.</em> {caseData.respondent}</h3><p>{caseData.allegations.join(" · ")}</p></div><div className={`dc-status dc-status-${caseData.status}`}>{caseData.verdict ? "GUILTY" : caseData.status.toUpperCase()}</div></div><div className="dc-case-facts"><span>YOUR ROLE<strong>{role}</strong></span><span>EXHIBITS ON FILE<strong>{Math.max(1, caseData.evidenceCount)}</strong></span><span>PROCEEDING<strong>{caseData.hearingDate || "Today · Starts in 00:05"}</strong></span><button onClick={enterMyCase}>{caseData.verdict ? "REVIEW VERDICT →" : "JOIN CASE →"}</button></div><div className="dc-role-note">{activeIdentity === "elijah" ? "A classification has been filed against you. Join the five-second expedited hearing to contest it." : "You filed this matter. The court will notify you when Elijah joins."}</div></article></section>}

    {tab === "ongoing" && <section className="dc-section"><div className="dc-section-heading"><div><span>PUBLIC SERVICE DOCKET</span><h2>Ongoing Cases</h2></div><p>No drama in your life, but love tea? Serve on a jury.</p></div><div className="dc-case-grid">{ONGOING_CASES.map((item) => { const enrolled = selectedCase?.caseNumber === item.caseNumber; return <motion.article className={`dc-public-case dc-accent-${item.accent}`} key={item.caseNumber} whileHover={{ y: -5 }}><div className="dc-public-top"><span>{item.caseNumber}</span><b>{item.hearing}</b></div><div className="dc-mini-parties"><i>{item.caption[0]}</i><span>v.</span><i>{item.caption.split(" v. ")[1][0]}</i></div><h3>{item.caption}</h3><p>{item.allegation}</p><div className="dc-seats"><span>{Array.from({ length: 5 }, (_, index) => <i className={index < 5 - item.seats ? "filled" : ""} key={index}>●</i>)}</span><b>{item.seats ? `${item.seats} SEATS OPEN` : "JURY FULL"}</b></div>{activeIdentity === "elijah" ? enrolled ? <button className="dc-enter" onClick={enterJury}>ENTER COURTROOM →</button> : <button disabled={!item.seats} onClick={() => enroll(item)}>{item.seats ? "JOIN AS JUROR" : "JURY FULL"}</button> : <button disabled>RESPONDENT ACCOUNTS ONLY</button>}</motion.article>; })}</div></section>}

    <AnimatePresence>{courtOpen && (mode === "party" || selectedCase) && <motion.div className="dc-courtroom-shade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.section className="dc-courtroom" role="dialog" aria-modal="true" initial={{ scale: .94, y: 24 }} animate={{ scale: 1, y: 0 }}><button className="dc-close" aria-label="Leave courtroom" onClick={() => setCourtOpen(false)}>×</button><header className="dc-bench"><motion.div className="dc-gavel" animate={phase === "verdict" || juryVote ? { rotate: [0, -35, 8, 0], y: [0, -12, 4, 0] } : { rotate: [0, -4, 0] }} transition={phase === "verdict" || juryVote ? { duration: .7 } : { repeat: Infinity, duration: 2.3 }}>🔨</motion.div><div className="dc-judge-avatar">👩🏾‍⚖️</div><span>THE HONORABLE JUSTICE CLOSURE · AI JUDGE</span><h2>{mode === "party" ? `${caseData.claimant} v. ${caseData.respondent}` : selectedCase?.caption}</h2><small>{mode === "party" ? caseData.caseNumber : selectedCase?.caseNumber} · LIVE HEARING</small></header><div className="dc-hearing-clock"><div><span>EXPEDITED HEARING WINDOW</span><b>00:{String(seconds).padStart(2, "0")}</b></div><div className="dc-progress"><motion.i animate={{ width: `${progress}%` }} /></div><small>{seconds ? "Statements and screenshots are entering the record in real time." : mode === "party" ? "Arguments closed. Jury verdicts are arriving." : "Review closed. Cast your vote."}</small></div>
      {mode === "party" ? <><div className="dc-party-live"><article><b>BECKY · CLAIMANT</b><p>Elijah disappeared for four business days and returned with a meme.</p><span>typing <i>•••</i></span></article><article><b>ELIJAH · RESPONDENT</b><p>I was emotionally buffering. My phone was also on 2%.</p><span>uploaded EXHIBIT A · screenshot_final_FINAL.png</span></article></div><div className="dc-court-scene"><div className="dc-scene-case"><span>MATTER BEFORE THE COURT</span><h3>{caseData.allegations[0]}</h3><p>One suspiciously cropped group-chat exhibit has entered the record.</p></div><div className="dc-jury-box">{JURORS.map((initial, index) => <motion.div key={initial} className={index < revealedVotes ? "vote-cast" : ""} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .08 }}><i>{initial}</i><span>JUROR {index + 1}</span><small>{index < revealedVotes ? index === 2 ? "NOT GUILTY" : "GUILTY" : phase === "arguments" ? "REVIEWING" : "DELIBERATING"}</small></motion.div>)}</div></div>{phase === "verdict" && <motion.div className="dc-ai-ruling" initial={{ opacity: 0, scale: .65, rotate: -15 }} animate={{ opacity: 1, scale: 1, rotate: -5 }}><span>AI JUDGE · FINAL JUDGMENT</span><b>APPEAL DENIED<br />STILL GUILTY</b><p>Emotional buffering is not a recognized substitute for communication.</p><button onClick={() => { setCourtOpen(false); onExitMyCase?.(); }}>EXIT COURT →</button></motion.div>}</> : <><div className="dc-court-scene"><div className="dc-scene-case"><span>MATTER BEFORE THE COURT</span><h3>{selectedCase?.allegation}</h3><p>Review the fictional record and cast your civic judgment.</p></div><div className="dc-jury-box">{JURORS.map((initial, index) => <div key={initial} className={index === 4 ? "active" : ""}><i>{initial}</i><span>{index === 4 ? "YOU" : `JUROR ${index + 1}`}</span><small>{index === 4 ? "VOTE PENDING" : "DELIBERATING"}</small></div>)}</div></div><div className="dc-vote-panel"><span>CAST YOUR OFFICIAL-ISH VOTE</span><h3>Should the current classification stand?</h3><div><button disabled={Boolean(juryVote)} onClick={() => castVote("sustain")}><b>⚑</b>SUSTAIN CLASSIFICATION<small>The finding remains on record.</small></button><button disabled={Boolean(juryVote)} onClick={() => castVote("overturn")}><b>♻</b>OVERTURN CLASSIFICATION<small>Return the matter for recycling.</small></button></div></div>{juryVote && <motion.div className={`dc-ruling-stamp dc-ruling-${juryVote}`} initial={{ scale: 2.2, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: -7, opacity: 1 }}><span>VOTE RECORDED</span><b>{juryVote === "sustain" ? "CLASSIFICATION SUSTAINED" : "CLASSIFICATION OVERTURNED"}</b><small>Your civic duty has been completed.</small></motion.div>}</>}
    </motion.section></motion.div>}</AnimatePresence>
  </section>;
}
