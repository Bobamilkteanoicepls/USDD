"use client";
/* eslint-disable @next/next/no-img-element */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AIJudgeVerdictPanel } from "./demo-components";
import type { DemoCaseState, Juror } from "./demo-case";

type DocketProps = {
  state: DemoCaseState;
  onJoin: () => void;
  onEnterCourt: () => void;
};

const phaseCopy = (state: DemoCaseState) => {
  if (!state.completed.filed) return { label: "AWAITING FILING", tone: "waiting", detail: "The clerk is alphabetizing red flags." };
  if (state.hearing.phase === "arguments") return { label: "LIVE NOW", tone: "live", detail: "Arguments are currently streaming." };
  if (state.hearing.phase === "voting") return { label: "BALLOT OPEN", tone: "vote", detail: "Assigned jurors may vote now." };
  if (state.hearing.phase === "decided") return { label: "VERDICT ISSUED", tone: "closed", detail: "The Honorable Algorithm has ruled." };
  if (state.appeal === "filed") return { label: "PRE-HEARING", tone: "ready", detail: "Evidence intake is open." };
  return { label: "NOTICE SERVED", tone: "waiting", detail: "Waiting for the respondent to appeal." };
};

export function PublicJuryDocket({ state, onJoin, onEnterCourt }: DocketProps) {
  const phase = phaseCopy(state);
  const canJoin = state.completed.filed && state.hearing.phase !== "decided";
  const alreadyJoined = state.publicJury.joined;
  return (
    <section className="publicJuryPage">
      <motion.header className="juryHero" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}>
        <div><span>USDD CIVIC DUTY PORTAL · COMMUNITY ACCESS</span><h2>You have been summoned for community jury duty.</h2><p>No expertise, context, or emotional maturity was detected or required.</p></div>
        <motion.div className="civicBadge" animate={{ rotate: [-3, 2, -3] }} transition={{ repeat: Infinity, duration: 4 }}><b>🧑‍⚖️</b><span>JUROR ID</span><strong>482-RED-FLAG</strong><small>{state.publicJury.alias}</small></motion.div>
      </motion.header>

      <div className="juryExplainer" aria-label="Community juror journey">
        {["Browse ongoing cases", "Accept the oath", "Review both sides", "Cast one ballot", "Watch the stamp fall"].map((step, index) => <span key={step}><i>{index + 1}</i>{step}</span>)}
      </div>

      <div className="docketHeading"><div><span>COURT OF ROMANTIC APPEALS</span><h2>Cases accepting community judgment</h2><p>All parties, evidence, and outcomes are fictional.</p></div><div><b>3</b><small>COMMUNITY DOCKETS</small></div></div>

      <div className="publicDocketGrid">
        <motion.article className="publicCase featured" whileHover={{ y: -5 }}>
          <div className="caseRibbon"><span className={phase.tone}>● {phase.label}</span><b>{state.caseNumber}</b></div>
          <div className="casePeople"><span>👩🏻<b>BECKY</b></span><em>v.</em><span>👨🏽<b>ELIJAH</b></span></div>
          <h3>Alleged Failure to Communicate</h3>
          <p>{phase.detail}</p>
          <div className="publicCharges">{state.violations.map((violation) => <span key={violation}>🚩 {violation}</span>)}</div>
          <div className="caseCrowd"><span>👀 {state.hearing.phase === "arguments" ? 128 : 42} WATCHING</span><span>⚖ 5 JURY SEATS</span><span>🍿 POPCORN PERMITTED</span></div>
          {alreadyJoined ? <button className="primary wide" type="button" onClick={onEnterCourt}>ENTER ASSIGNED COURTROOM →</button> : <button className="primary wide" type="button" disabled={!canJoin} onClick={onJoin}>{canJoin ? "ACCEPT OATH & JOIN JURY POOL →" : state.hearing.phase === "decided" ? "VERDICT ARCHIVED" : "WAITING FOR AN APPEAL"}</button>}
          {alreadyJoined && <div className="assignmentSlip">✓ OATH ACCEPTED · ASSIGNED TO SEAT 5 · BALLOT STATUS: {state.jurors.find((juror) => juror.id === state.publicJury.jurorId)?.vote ? "SEALED" : "PENDING"}</div>}
        </motion.article>

        <article className="publicCase compact"><div className="caseRibbon"><span className="live">● LIVE NOW</span><b>EX-2026-00666</b></div><div className="miniPeople">🧑🏾‍🦱 <em>v.</em> 👩🏼</div><h3>Maya v. Tyler</h3><p>Unauthorized “u up?” transmission after 1:00 a.m.</p><div className="caseCrowd"><span>👀 306 WATCHING</span><span>🔒 JURY FULL</span></div><button className="outline wide" disabled>WATCH-ONLY GALLERY FULL</button></article>
        <article className="publicCase compact"><div className="caseRibbon"><span className="ready">HEARING IN 08:42</span><b>EX-2026-00999</b></div><div className="miniPeople">👩🏽 <em>v.</em> 🧔🏻</div><h3>Jordan v. Chris</h3><p>Three consecutive “haha” replies with no follow-up question.</p><div className="caseCrowd"><span>👀 87 WAITING</span><span>🪑 0 SEATS</span></div><button className="outline wide" disabled>JOIN WAITLIST · #4,281</button></article>
      </div>
      <div className="juryFinePrint"><b>COMMUNITY JURY SAFETY NOTICE</b><p>Do not use real names, private screenshots, or this website to harass anyone. The community jury is a satirical civic simulation, not a real adjudication system.</p></div>
    </section>
  );
}

type CourtProps = {
  state: DemoCaseState;
  onVote: (jurorId: string, vote: Juror["vote"]) => void;
  onReturn: () => void;
};

export function PublicJuryCourt({ state, onVote, onReturn }: CourtProps) {
  const [reaction, setReaction] = useState("");
  const [remaining, setRemaining] = useState(() => state.hearing.startedAt ? Math.max(0, state.hearing.durationSeconds - Math.floor((Date.now() - state.hearing.startedAt) / 1000)) : state.hearing.durationSeconds);
  const assignedJuror = state.jurors.find((juror) => juror.id === state.publicJury.jurorId);
  const guiltyVotes = state.jurors.filter((juror) => juror.vote === "guilty").length;
  const totalVotes = state.jurors.filter((juror) => juror.vote).length;
  const evidenceLabel = useMemo(() => state.evidence.length ? `${state.evidence.length} filed exhibit${state.evidence.length === 1 ? "" : "s"}` : "No exhibits filed", [state.evidence.length]);

  useEffect(() => {
    if (state.hearing.phase !== "arguments" || remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [remaining, state.hearing.phase]);

  if (!state.publicJury.joined) return <section className="juryGate"><span>⚖</span><h2>No jury assignment found.</h2><p>Return to the ongoing cases board and accept the community juror oath first.</p><button className="primary" onClick={onReturn}>RETURN TO ONGOING CASES</button></section>;

  if (state.verdict && state.hearing.phase === "decided") return <section className="publicVerdictWrap"><div className="publicIdentityBar"><span>🧑‍⚖️ {state.publicJury.alias}</span><b>SEAT 5 · COURT ADJOURNED</b></div><AIJudgeVerdictPanel verdict={state.verdict.result} reasoning={state.verdict.reasoning} guiltyVotes={guiltyVotes} totalVotes={totalVotes} revealCount={state.hearing.revealCount} jurors={state.jurors} buttonLabel="RETURN TO ONGOING CASES" onContinue={onReturn}/></section>;

  return (
    <section className="publicCourtView">
      <div className="publicIdentityBar"><span>🧑‍⚖️ {state.publicJury.alias}</span><b>COMMUNITY JUROR · SEAT 5</b><small>{state.caseNumber}</small></div>
      <div className="publicCourtLive"><span>{state.hearing.phase === "arguments" ? "● LIVE ARGUMENTS" : state.hearing.phase === "voting" ? "● BALLOT WINDOW OPEN" : "PRE-HEARING LOBBY"}</span><strong>{state.hearing.phase === "arguments" ? `${String(Math.floor(remaining / 60)).padStart(2,"0")}:${String(remaining % 60).padStart(2,"0")}` : state.hearing.phase === "voting" ? `${totalVotes}/5 SEALED` : "COURT PENDING"}</strong><small>COMMUNITY FEED · 12 SECOND DELAY-ISH</small></div>
      <div className="publicJudgeBench"><motion.span animate={{ rotate: [0,-28,5,0] }} transition={{ repeat: Infinity, repeatDelay: 3 }}>🔨</motion.span><div><b>🤖 AI JUDGE A.L. GORE-ITHM</b><small>THE HONORABLE ALGORITHM PRESIDING</small></div><em>⚖</em></div>

      <div className="jurorCaseBrief">
        <span className="formCode">JUROR BRIEF · READ BOTH SIDES BEFORE VOTING</span>
        <h2>Becky v. Elijah</h2>
        <div className="publicArguments"><article><span>CLAIMANT · BECKY</span><b>👩🏻</b><p>{state.claimant.statement}</p></article><article><span>RESPONDENT · ELIJAH</span><b>👨🏽</b><p>{state.respondent.statement}</p><small>DEFENSE: {state.respondent.defense}</small></article></div>
        <div className="publicCharges">{state.violations.map((violation) => <span key={violation}>🚩 {violation}</span>)}</div>
        <div className="publicEvidence"><b>EVIDENCE LOCKER · {evidenceLabel.toUpperCase()}</b>{state.evidence.length ? state.evidence.map((item, index) => <article key={item.id}><img src={item.dataUrl} alt={item.caption}/><span>EXHIBIT {String.fromCharCode(65 + index)}<b>{item.caption}</b><small>Filed by {item.owner === "becky" ? "Becky" : "Elijah"}</small></span></article>) : <p>📭 No exhibits submitted. Jurors must decide using vibes and sworn-ish statements.</p>}</div>
      </div>

      <div className="galleryReactions"><span>PUBLIC GALLERY REACTIONS</span>{["👀","🍿","😮","🚩"].map((emoji) => <button key={emoji} type="button" aria-label={`React ${emoji}`} onClick={() => { setReaction(""); window.requestAnimationFrame(() => setReaction(emoji)); }}>{emoji}</button>)}<AnimatePresence>{reaction && <motion.b key={reaction} initial={{ opacity: 0, y: 15, scale: .5 }} animate={{ opacity: 1, y: -22, scale: 1.4 }} exit={{ opacity: 0 }} transition={{ duration: .7 }}>{reaction}</motion.b>}</AnimatePresence></div>

      <section className={`publicBallot ${state.hearing.phase === "voting" ? "open" : "locked"}`}>
        <div><span>OFFICIAL-ISH BALLOT · SEAT 5</span><h2>{assignedJuror?.vote ? "Your vote is sealed." : state.hearing.phase === "voting" ? "The community requests your judgment." : "Ballot locked until arguments close."}</h2><p>{assignedJuror?.vote ? `You voted ${assignedJuror.vote.replaceAll("_"," ").toUpperCase()}. Your choice cannot be edited after sealing.` : "Vote on the fictional classification—not on anyone’s real character."}</p></div>
        {state.hearing.phase === "voting" && !assignedJuror?.vote && <div className="ballotChoices"><button className="guiltyVote" type="button" onClick={() => onVote(state.publicJury.jurorId,"guilty")}>🚩 STILL GUILTY<small>UPHOLD CLASSIFICATION</small></button><button className="clearVote" type="button" onClick={() => onVote(state.publicJury.jurorId,"not_guilty")}>♻ APPEAL GRANTED<small>OVERTURN CLASSIFICATION</small></button></div>}
        {assignedJuror?.vote && <motion.div className="sealedBallot" initial={{ scale: 1.8, rotate: -15, opacity: 0 }} animate={{ scale: 1, rotate: -5, opacity: 1 }}>VOTE SEALED<small>THANK YOU FOR YOUR QUESTIONABLE CIVIC SERVICE</small></motion.div>}
      </section>
      <button className="outline" type="button" onClick={onReturn}>← RETURN TO ONGOING CASES</button>
    </section>
  );
}
