"use client";
/* eslint-disable @next/next/no-img-element */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DemoCaseState,
  DemoRole,
  EvidenceItem,
  Juror,
  QuizQuestion,
} from "./demo-case";

type RoleSwitchProps = {
  activeRole: DemoRole;
  notificationCount?: number;
  onSwitch: (role: DemoRole) => void;
};

export function RoleSwitch({ activeRole, notificationCount = 0, onSwitch }: RoleSwitchProps) {
  const roleLabels: Record<DemoRole, string> = { becky: "Becky", elijah: "Elijah", public: "Community Juror" };
  return (
    <div className="userSwitch" role="group" aria-label="Switch account">
      <small>ACCOUNT</small>
      {(["becky", "elijah", "public"] as DemoRole[]).map((role) => (
        <button
          key={role}
          type="button"
          className={activeRole === role ? "active" : ""}
          aria-pressed={activeRole === role}
          onClick={() => onSwitch(role)}
        >
          <span>{role === "public" ? "J" : role[0].toUpperCase()}</span>
          {roleLabels[role]}
          {role === "elijah" && notificationCount > 0 && (
            <b aria-label={`${notificationCount} unread notices`}>{notificationCount}</b>
          )}
        </button>
      ))}
    </div>
  );
}

type DashboardShellProps = {
  role: DemoRole;
  eyebrow?: string;
  title?: string;
  status?: string;
  children: React.ReactNode;
  onSwitch?: () => void;
};

export function DashboardShell({
  role,
  eyebrow,
  title,
  status,
  children,
  onSwitch,
}: DashboardShellProps) {
  const roleMeta: Record<DemoRole, { initial: string; name: string; eyebrow: string }> = {
    becky: { initial: "B", name: "Becky", eyebrow: "CLAIMANT DASHBOARD" },
    elijah: { initial: "E", name: "Elijah", eyebrow: "RESPONDENT DASHBOARD" },
    public: { initial: "J", name: "Community Juror", eyebrow: "COMMUNITY CIVIC DUTY PORTAL" },
  };
  const meta = roleMeta[role];
  const isBecky = role === "becky";
  return (
    <motion.section
      className="rolePanel"
      key={role}
      initial={{ opacity: 0, x: isBecky ? -12 : 12 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="roleHead">
        <div className={`demoAvatar ${role}`} aria-hidden="true">
          {meta.initial}
        </div>
        <div>
          <small>{eyebrow ?? meta.eyebrow}</small>
          <h3>{title ?? `Welcome, ${meta.name}`}</h3>
          {status && <p>{status}</p>}
        </div>
        {onSwitch && (
          <button className="outline" type="button" onClick={onSwitch}>
            SWITCH ACCOUNT →
          </button>
        )}
      </div>
      {children}
    </motion.section>
  );
}

type NotificationInboxCardProps = {
  caseNumber: string;
  claimantName: string;
  filedAt: string;
  violations: string[];
  isRead: boolean;
  onOpen: () => void;
  onAppeal: () => void;
  onSchool: () => void;
};

export function NotificationInboxCard({
  caseNumber,
  claimantName,
  filedAt,
  violations,
  isRead,
  onOpen,
  onAppeal,
  onSchool,
}: NotificationInboxCardProps) {
  return (
    <motion.article
      className="inbox"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="urgent">OFFICIAL NOTICE · ACTION REQUIRED</span>
      <small>CASE {caseNumber} · FILED {filedAt}</small>
      <h2>
        You have been classified as
        <br />Hazardous Non-Recyclable.
      </h2>
      <p>
        A fictional classification was submitted by {claimantName}. Allegations are claims by the
        filing party and have not been independently verified by USDD.
      </p>
      <div className="noticeViolations" aria-label="Alleged violations">
        {violations.map((violation) => <span key={violation}>🚩 {violation}</span>)}
      </div>
      <div className="sentNotice">
        <b>NOTICE OF ROMANTIC MATERIAL CLASSIFICATION</b>
        <span>Response requested before the group chat reaches a verdict.</span>
        <small>You may appeal with evidence or voluntarily enroll in Dating School.</small>
      </div>
      {!isRead ? <button className="primary" type="button" onClick={onOpen}>OPEN &amp; ACKNOWLEDGE NOTICE →</button> : <div>
          <button className="primary" type="button" onClick={onAppeal}>FILE AN APPEAL →</button>
          <button className="outline" type="button" onClick={onSchool}>GO TO DATING SCHOOL</button>
        </div>}
    </motion.article>
  );
}

type EvidenceDraft = {
  file: File;
  dataUrl: string;
  caption: string;
};

type EvidenceUploaderProps = {
  evidence: EvidenceItem[];
  owner: DemoRole;
  disabled?: boolean;
  onAdd: (draft: EvidenceDraft) => void;
  onRemove: (evidenceId: string) => void;
  onContinue: () => void;
};

export function EvidenceUploader({
  evidence,
  owner,
  disabled = false,
  onAdd,
  onRemove,
  onContinue,
}: EvidenceUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  const chooseFile = (next?: File) => {
    setError("");
    if (!next) return;
    if (evidence.length >= 3) {
      setError("The evidence cabinet is full. Withdraw an exhibit before filing another.");
      return;
    }
    if (!next.type.startsWith("image/")) {
      setError("USDD accepts screenshot images only.");
      return;
    }
    if (next.size > 1200 * 1024) {
      setError("Exhibit exceeds the 1.2 MB evidence allowance.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFile(next);
      setPreview(String(reader.result));
    };
    reader.readAsDataURL(next);
  };

  const submit = () => {
    if (!file || !preview || !caption.trim()) {
      setError("Select a screenshot and add a short caption before filing the exhibit.");
      return;
    }
    onAdd({ file, dataUrl: preview, caption: caption.trim() });
    setFile(null);
    setPreview("");
    setCaption("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section className="evidenceCenter">
      <span className="formCode">RESPONDENT EVIDENCE PORTAL · FORM EXH-12</span>
      <h2>Build your defense file</h2>
      <p>Upload fictional screenshots only. Avoid real names, phone numbers, or private messages.</p>

      <label className="upload">
        ＋ SELECT SCREENSHOT EXHIBIT
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={disabled}
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
      </label>

      <AnimatePresence>
        {preview && (
          <motion.div className="exhibits" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <article>
              <img src={preview} alt="New exhibit preview" />
              <span>
                NEW EXHIBIT
                <b>{file?.name}</b>
              </span>
            </article>
            <label>
              EXHIBIT CAPTION
              <textarea
                value={caption}
                maxLength={180}
                placeholder="Example: Timestamp showing I replied within one emotionally reasonable business day."
                onChange={(event) => setCaption(event.target.value)}
              />
              <small>{caption.length}/180</small>
            </label>
            <button className="primary" type="button" onClick={submit}>
              FILE EXHIBIT
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <div className="notice" role="alert">{error}</div>}

      <div className="exhibits">
        {evidence.map((item, index) => (
          <motion.article key={item.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <img src={item.dataUrl} alt={item.caption || item.fileName} />
            <span>
              EXHIBIT {String.fromCharCode(65 + index)} · {item.owner === owner ? "YOUR FILING" : item.owner.toUpperCase()}
              <b>{item.caption}</b>
              <small>{item.fileName}</small>
            </span>
            {item.owner === owner && !disabled && (
              <button className="outline" type="button" onClick={() => onRemove(item.id)}>
                WITHDRAW
              </button>
            )}
          </motion.article>
        ))}
      </div>

      <button className="primary wide" type="button" disabled={disabled} onClick={onContinue}>
        SEAL EVIDENCE &amp; ENTER DATING COURT →
      </button>
    </section>
  );
}

type LiveHearingProps = {
  durationSeconds: number;
  startedAt?: number | null;
  claimantStatement: string;
  respondentStatement: string;
  evidence: EvidenceItem[];
  jurors: Juror[];
  onTimeExpired: () => void;
  onSkip: () => void;
  onJurorVote?: (jurorId: string, vote: Juror["vote"]) => void;
};

type ChatLine = { speaker: "claimant" | "respondent"; text: string; picture?: string };

const firstSentence = (raw: string, fallback: string) => {
  const clean = (raw || "").trim();
  if (!clean) return fallback;
  const match = clean.match(/[^.!?]+[.!?]/);
  return (match ? match[0] : clean).trim();
};

export function LiveHearing({
  durationSeconds,
  startedAt,
  claimantStatement,
  respondentStatement,
  evidence,
  onTimeExpired,
  onSkip,
}: LiveHearingProps) {
  const total = Math.max(1, Math.min(durationSeconds || 5, 5));
  const [remaining, setRemaining] = useState(() => {
    if (!startedAt) return total;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, total - elapsed);
  });
  const [revealed, setRevealed] = useState(0);
  const [pictureIn, setPictureIn] = useState(false);
  const expiredRef = useRef(false);

  const exhibitImage = evidence[0]?.dataUrl;
  const chatScript = useMemo<ChatLine[]>(() => [
    { speaker: "claimant", text: "Hey. Where were you Tuesday through Friday?" },
    { speaker: "respondent", text: "🙏 look I can explain" },
    { speaker: "claimant", text: "Screenshot receipts attached 📎", picture: exhibitImage },
    { speaker: "respondent", text: firstSentence(respondentStatement, "I was emotionally buffering.") },
    { speaker: "claimant", text: firstSentence(claimantStatement, "You disappeared for four business days.") },
  ], [claimantStatement, respondentStatement, exhibitImage]);

  useEffect(() => {
    if (remaining <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onTimeExpired();
      }
      return;
    }
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [remaining, onTimeExpired]);

  useEffect(() => {
    const step = (total * 1000) / (chatScript.length + 1);
    const timers = chatScript.map((_, index) =>
      window.setTimeout(() => setRevealed((current) => Math.max(current, index + 1)), Math.round(step * (index + 1))),
    );
    const pictureIndex = chatScript.findIndex((line) => line.picture);
    if (pictureIndex >= 0) {
      timers.push(window.setTimeout(() => setPictureIn(true), Math.round(step * (pictureIndex + 1) + 180)));
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [chatScript, total]);

  const skipAll = () => {
    setRevealed(chatScript.length);
    setPictureIn(true);
    setRemaining(0);
    if (!expiredRef.current) {
      expiredRef.current = true;
      onSkip();
    }
  };

  const progressPct = Math.round(((total - remaining) / total) * 100);
  const typingLine = revealed < chatScript.length ? chatScript[revealed] : null;

  return (
    <section className="liveCourt">
      <div className="courtroomAtmosphere" aria-hidden="true"><i>🏛️</i><span>COURT OF ROMANTIC APPEALS</span><div><b>👀</b><b>😮</b><b>📝</b><b>🤨</b><b>🍿</b></div></div>
      <div className="courtLive" aria-live="polite">
        <span>● LIVE · FICTIONAL HEARING</span>
        <b>{minutes}:{seconds}</b>
        <small>10-MINUTE HEARING WINDOW</small>
      </div>
      <motion.div className="judgeBench" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="judgeAvatar"><span>⚖</span><b>🤖</b><small>AI</small></div>
        <div>
          <small>THE HONORABLE ALGORITHM PRESIDING</small>
          <strong>AI JUDGE A.L. GORE-ITHM</strong>
          <em>Satirical summary engine · No legal authority</em>
        </div>
        <motion.span className="gavel" aria-label="Judge’s gavel"
          animate={{ rotate: [0, -32, 8, 0], y: [0, -8, 3, 0] }}
          transition={{ repeat: Infinity, repeatDelay: 3.2, duration: .65 }}>🔨</motion.span>
      </motion.div>
      <div className="courtLive" aria-live="polite">
        <span>● LIVE · FICTIONAL HEARING</span>
        <div
          className="countRing"
          style={{ "--ringProgress": `${progressPct}%` } as React.CSSProperties}
          role="timer"
          aria-label={`${remaining} seconds remaining`}
        >
          <b>{remaining}</b><small>SEC</small>
        </div>
        <small>ACCELERATED SUMMARY OF A TEN-MINUTE HEARING</small>
      </div>
      <h2>Becky <em>v.</em> Elijah</h2>

      <div className="courtChat" aria-live="polite" aria-label="Live evidence transcript">
        <div className="chatHead">
          <b>EXHIBIT LOG · TEXT-MESSAGE THREAD</b>
          <small>Reproduced from filed exhibits · Fictional reconstruction</small>
        </div>
        <div className="chatFeed">
          <AnimatePresence initial={false}>
            {chatScript.slice(0, revealed).map((line, index) => (
              <motion.div
                key={`b-${index}`}
                className={`chatBubble ${line.speaker}`}
                initial={{ opacity: 0, y: 14, scale: .94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <span className="chatWho">
                  {line.speaker === "claimant" ? "👩🏻 BECKY" : "👨🏽 ELIJAH"}
                </span>
                <p>{line.text}</p>
                {line.picture && pictureIn && (
                  <motion.img
                    className="chatExhibit"
                    src={line.picture}
                    alt="Filed exhibit — text-message screenshot"
                    initial={{ opacity: 0, scale: .82, rotate: -3 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  />
                )}
                {line.picture && !pictureIn && (
                  <span className="chatExhibitPending">📎 attachment sending…</span>
                )}
              </motion.div>
            ))}
            {typingLine && (
              <motion.div
                key={`typing-${revealed}`}
                className={`chatBubble ${typingLine.speaker} typing`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: .9, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="chatWho">
                  {typingLine.speaker === "claimant" ? "👩🏻 BECKY" : "👨🏽 ELIJAH"} · typing
                </span>
                <div className="typingDots" aria-label="typing indicator">
                  <span/><span/><span/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="arguments">
        <motion.article className="partyPodium beckyPodium"
          initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", delay: .2 }}
        >
          <div className="partyAvatar"><span>👩🏻</span><b>B</b></div>
          <div><span>CLAIMANT · BECKY</span><p>{claimantStatement}</p></div>
          <motion.em animate={{ rotate: [-8, 8, -8] }} transition={{ repeat: Infinity, duration: 2 }}>🚩</motion.em>
        </motion.article>
        <motion.article className="partyPodium elijahPodium"
          initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", delay: .35 }}
        >
          <div className="partyAvatar"><span>👨🏽</span><b>E</b></div>
          <div><span>RESPONDENT · ELIJAH</span><p>{respondentStatement}</p></div>
          <motion.em animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>😅</motion.em>
        </motion.article>
      </div>

      <div className="courtEvidence">
        <b>EVIDENCE BEFORE THE COURT</b>
        {evidence.length ? evidence.map((item, index) => (
          <motion.article className="courtExhibit" key={item.id}
            initial={{ opacity: 0, rotate: -5, x: -25 }}
            animate={{ opacity: 1, rotate: index % 2 ? 2 : -1, x: 0 }}
            transition={{ delay: .5 + index * .15 }}
          >
            <img src={item.dataUrl} alt={item.caption}/>
            <span>📎 EXHIBIT {String.fromCharCode(65 + index)}<b>{item.caption}</b><small>Filed by {item.owner === "becky" ? "Becky" : "Elijah"}</small></span>
          </motion.article>
        )) : <span>No exhibits filed. The group chat remains under subpoena.</span>}
      </div>
      <JuryPanel jurors={jurors} votingOpen={remaining === 0} onVote={onJurorVote} />
      <button className="primary wide" type="button" onClick={onSkip}>
        {remaining > 0 ? "CLOSE ARGUMENTS" : "REVEAL JURY VOTE"} →
      </button>
    </section>
  );
}

type JuryPanelProps = {
  jurors: Juror[];
  votingOpen?: boolean;
  revealCount?: number;
  onVote?: (jurorId: string, vote: Juror["vote"]) => void;
};

export function JuryPanel({ jurors, votingOpen = false, revealCount = 0, onVote }: JuryPanelProps) {
  const avatars = ["👩🏾", "🧑🏻", "👨🏼", "👩🏻", "🧑🏽"];
  return (
    <div className="jurySeats" aria-label="Five-person fictional jury">
      {jurors.slice(0, 5).map((juror, index) => {
        const revealed = index < revealCount;
        return (
          <motion.div key={juror.id} className={revealed ? "voteRevealed" : ""} initial={{ opacity: 0, y: 18 }} animate={revealed ? { opacity: 1, y: 0, scale: [1, 1.1, 1] } : { opacity: 1, y: [0, -3, 0] }} transition={revealed ? { duration: .45 } : { delay: index * .08, y: { repeat: Infinity, duration: 2.4 + index * .15 } }} whileHover={{ y: -7, scale: 1.04 }}>
            {!revealed && <motion.div className="jurorReaction" animate={{ opacity: [0, 1, 0], y: [5, -8, -15] }} transition={{ repeat: Infinity, repeatDelay: 2 + index * .4, duration: 1.4, delay: index * .35 }}>{["🤔","👀","🧐","💬","☕"][index]}</motion.div>}
            <div className="jurorAvatar"><span>{avatars[index]}</span><i>{index + 1}</i></div>
            <span>{juror.name}</span>
            {!votingOpen && !revealed && <small className="deliberating">REVIEWING <b>•••</b></small>}
            {votingOpen && onVote && !juror.vote && (
              <div>
                <button type="button" aria-label={`${juror.name}: vote guilty`} onClick={() => onVote(juror.id, "guilty")}>GUILTY</button>
                <button type="button" aria-label={`${juror.name}: vote not guilty`} onClick={() => onVote(juror.id, "not_guilty")}>NOT GUILTY</button>
              </div>
            )}
            {revealed && <small>{juror.vote === "guilty" ? "GUILTY" : "NOT GUILTY"}</small>}
            {votingOpen && juror.vote && !revealed && <small>VOTE SEALED</small>}
          </motion.div>
        );
      })}
    </div>
  );
}

type AIJudgeVerdictPanelProps = {
  verdict: "guilty" | "appeal_granted" | "hung_jury";
  reasoning: string;
  guiltyVotes: number;
  totalVotes: number;
  revealCount: number;
  jurors: Juror[];
  buttonLabel?: string;
  onContinue: () => void;
};

export function AIJudgeVerdictPanel({
  verdict,
  reasoning,
  guiltyVotes,
  totalVotes,
  revealCount,
  jurors,
  buttonLabel,
  onContinue,
}: AIJudgeVerdictPanelProps) {
  const label = verdict === "guilty" ? "STILL GUILTY" : verdict === "appeal_granted" ? "APPEAL GRANTED" : "SITUATIONSHIP PENDING";
  const stampClass = verdict === "guilty" ? "guiltyStamp" : verdict === "appeal_granted" ? "clearedStamp" : "pendingStamp";
  const totalJurors = jurors.length || 5;
  const jurorsRevealed = revealCount >= totalJurors;
  const defaultExitLabel = verdict === "guilty"
    ? "EXIT · ENROLL IN DATING SCHOOL"
    : verdict === "appeal_granted"
      ? "EXIT COURTROOM · RETURN TO RECORD"
      : "EXIT COURTROOM";
  return (
    <motion.section className="demoVerdict" initial={{ opacity: 0 }} animate={{ opacity: 1 }} aria-live="assertive">
      <motion.div className="impactBurst" aria-hidden="true" initial={{ scale: 0, opacity: 1 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 1, delay: .65 }}>💥</motion.div>
      <motion.div className="verdictJudge" initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
        <div className="judgeAvatar large"><span>⚖</span><b>🤖</b><small>AI</small></div>
        <div><small>THE HONORABLE ALGORITHM</small><strong>AI JUDGE A.L. GORE-ITHM</strong></div>
        <motion.span className="gavel strike" animate={{ rotate: [0, -45, 12, 0], scale: [1, 1.18, 1] }} transition={{ duration: .8, delay: .35 }}>🔨</motion.span>
      </motion.div>
      <div className="judgeStampStage" aria-label={`Official verdict stamp: ${label}`}>
        <motion.div className="stampHandle" initial={{ y: -90, rotate: -14 }} animate={{ y: [-90, 8, -8, 0], rotate: [-14, 2, -3, 0] }} transition={{ duration: .8, delay: .85, times: [0,.58,.78,1] }}><span>USDD</span><b>♜</b></motion.div>
        <motion.div className={`stampImpression ${verdict}`} initial={{ opacity: 0, scale: 1.7, rotate: -18 }} animate={{ opacity: [0,0,1], scale: [1.7,1.7,1], rotate: [-18,-18,-7] }} transition={{ duration: 1.15, delay: .45 }}>{label}<small>OFFICIAL-ISH VERDICT · CASE CLOSED</small></motion.div>
        <motion.div className="inkBurst" aria-hidden="true" initial={{ opacity: 0, scale: .2 }} animate={{ opacity: [0,0,1,0], scale: [.2,.2,1.5,2] }} transition={{ duration: 1.2, delay: .83 }}>✦　✷　✦</motion.div>
      </div>
      <span>JURY VOTE · {guiltyVotes}–{Math.max(0, totalVotes - guiltyVotes)}</span>
      <motion.h2 initial={{ scale: 2.4, rotate: -20, opacity: 0 }} animate={{ scale: [2.4,.88,1.08,1], rotate: [-20,-3,-6,-4], opacity: 1 }} transition={{ duration: .8, delay: .55 }}>{label}</motion.h2>
      <JuryPanel jurors={jurors} revealCount={revealCount} />
      <blockquote>
        <b>AI JUDGE · SATIRICAL SUMMARY, NOT A REAL LEGAL DECISION</b>
        {reasoning}
      </blockquote>
      <button className="primary" type="button" onClick={onContinue}>
        {buttonLabel ?? (verdict === "guilty" ? "ENROLL IN DATING SCHOOL" : "RETURN TO CASE FILE")} →
      </button>

      <section className="verdictJurySequence" aria-label="Jury vote reveal">
        <div className="verdictJuryHead">
          <b>THE JURY REVEALS ITS VOTES</b>
          <small>{Math.min(revealCount, totalJurors)} OF {totalJurors} REVEALED</small>
        </div>
        <JuryPanel jurors={jurors} revealCount={revealCount} />
      </section>

      <AnimatePresence>
        {jurorsRevealed && (
          <motion.div
            key="verdictReveal"
            className="verdictReveal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .35 }}
          >
            <motion.div className="impactBurst" aria-hidden="true"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1, delay: .55 }}
            >💥</motion.div>
            <motion.div className="verdictJudge"
              initial={{ scale: .7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
            >
              <div className="judgeAvatar large"><span>⚖</span><b>🤖</b><small>AI</small></div>
              <div><small>THE HONORABLE ALGORITHM</small><strong>AI JUDGE A.L. GORE-ITHM</strong></div>
              <motion.span
                className="gavel strike gavelStrike"
                aria-label="AI Judge strikes the gavel"
                initial={{ rotate: 0, scale: 1 }}
                animate={{ rotate: [0, -55, 18, -8, 0], scale: [1, 1.28, 1.05, 1.12, 1] }}
                transition={{ duration: .9, delay: .25, times: [0, .3, .55, .78, 1] }}
              >🔨</motion.span>
            </motion.div>
            <div className={`judgeStampStage ${stampClass}Stage`} aria-label={`Official verdict stamp: ${label}`}>
              <motion.div className="stampHandle"
                initial={{ y: -110, rotate: -14 }}
                animate={{ y: [-110, 10, -8, 0], rotate: [-14, 3, -3, 0] }}
                transition={{ duration: .85, delay: .8, times: [0, .55, .78, 1] }}
              ><span>USDD</span><b>♜</b></motion.div>
              <motion.div
                className={`stampImpression ${verdict} ${stampClass}`}
                initial={{ opacity: 0, scale: 1.8, rotate: -18 }}
                animate={{ opacity: [0, 0, 1], scale: [1.8, 1.8, 1], rotate: [-18, -18, -6] }}
                transition={{ duration: 1.15, delay: .4 }}
              >
                {label}
                <small>OFFICIAL-ISH VERDICT · CASE CLOSED</small>
              </motion.div>
              <motion.div className="inkBurst" aria-hidden="true"
                initial={{ opacity: 0, scale: .2 }}
                animate={{ opacity: [0, 0, 1, 0], scale: [.2, .2, 1.6, 2.1] }}
                transition={{ duration: 1.2, delay: .78 }}
              >✦　✷　✦</motion.div>
            </div>
            <span>JURY VOTE · {guiltyVotes}–{Math.max(0, totalVotes - guiltyVotes)}</span>
            <motion.h2
              initial={{ scale: 2.4, rotate: -20, opacity: 0 }}
              animate={{ scale: [2.4, .88, 1.08, 1], rotate: [-20, -3, -6, -4], opacity: 1 }}
              transition={{ duration: .8, delay: .5 }}
            >{label}</motion.h2>
            <blockquote>
              <b>AI JUDGE · SATIRICAL SUMMARY, NOT A REAL LEGAL DECISION</b>
              {reasoning}
            </blockquote>
            <button className="primary wide exitCourtBtn" type="button" onClick={onContinue}>
              {buttonLabel ?? defaultExitLabel} →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!jurorsRevealed && (
        <div className="verdictWaiting" aria-hidden="true">
          <span>THE HONORABLE ALGORITHM PREPARES THE GAVEL</span>
          <b>▸ Awaiting jury reveal</b>
        </div>
      )}
    </motion.section>
  );
}

type TrafficSchoolFlowProps = {
  questions: QuizQuestion[];
  lessonIndex: number;
  questionIndex: number;
  answers: number[];
  passed?: boolean | null;
  score?: number;
  onCompleteLesson: (index: number) => void;
  onAnswer: (questionIndex: number, answerIndex: number) => void;
  onRetry: () => void;
  onGraduate: () => void;
};

const LESSONS = [
  ["Empathy: A Feature, Not a Bug", "Recognize another person’s feelings before consulting Mercury."],
  ["Communication Without Disappearing", "A reply is generally more useful than an unexplained four-day sabbatical."],
  ["Defining the Relationship", "Use nouns, verbs, and honest expectations. Avoid smoke signals."],
];

export function TrafficSchoolFlow({
  questions,
  lessonIndex,
  questionIndex,
  answers,
  passed,
  score = 0,
  onCompleteLesson,
  onAnswer,
  onRetry,
  onGraduate,
}: TrafficSchoolFlowProps) {
  if (passed != null) {
    return (
      <section className="graduation">
        <motion.div className={passed ? "passStamp" : "failStamp"} initial={{ scale: 1.8, rotate: -18 }} animate={{ scale: 1, rotate: -6 }}>
          {passed ? "PROVISIONALLY RECYCLABLE" : "RETRAINING REQUIRED"}
        </motion.div>
        <h2>{passed ? "Dating School coursework complete." : "The syllabus requests a rematch."}</h2>
        <p>Final score: {score}/{questions.length}. Passing requires emotionally responsible answers, twice.</p>
        <button className="primary" type="button" onClick={passed ? onGraduate : onRetry}>
          {passed ? "ISSUE PROVISIONAL CERTIFICATE" : "RETAKE FINAL EXAM"} →
        </button>
      </section>
    );
  }

  if (lessonIndex < LESSONS.length) {
    const lesson = LESSONS[lessonIndex];
    return (
      <section className="training">
        <div className="schoolLogo">USDD DATING SCHOOL<small>ACCREDITED BY ABSOLUTELY NO ONE</small></div>
        <span className="formCode">MODULE {lessonIndex + 1} OF {LESSONS.length}</span>
        <motion.div aria-hidden="true" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>📚</motion.div>
        <h2>{lesson[0]}</h2>
        <p>{lesson[1]}</p>
        <progress value={lessonIndex + 1} max={LESSONS.length + 1} />
        <button className="primary" type="button" onClick={() => onCompleteLesson(lessonIndex)}>
          COMPLETE MODULE →
        </button>
      </section>
    );
  }

  const question = questions[questionIndex];
  if (!question) {
    return (
      <section className="training">
        <div className="schoolLogo">USDD DATING SCHOOL<small>ACCREDITED BY ABSOLUTELY NO ONE</small></div>
        <span className="formCode">GRADING · PLEASE STAND BY</span>
        <motion.div aria-hidden="true" animate={{ opacity: [.4, 1, .4] }} transition={{ repeat: Infinity, duration: 1.4 }}>📝</motion.div>
        <h2>Tallying your final answers…</h2>
        <p>The syllabus is scoring your responses. Your rehabilitation status will post here in a moment.</p>
        <button className="primary" type="button" onClick={onRetry}>RESTART FINAL EXAM →</button>
      </section>
    );
  }
  return (
    <section className="demoSchool">
      <span className="formCode">REMEDIAL ROMANCE FINAL EXAM · {questionIndex + 1}/{questions.length}</span>
      <h2>{question.prompt}</h2>
      {question.options.map((option, index) => (
        <button
          key={option}
          type="button"
          disabled={answers[questionIndex] != null}
          onClick={() => onAnswer(questionIndex, index)}
        >
          <b>{String.fromCharCode(65 + index)}</b>{option}
        </button>
      ))}
    </section>
  );
}

type RehabilitationDocumentsProps = {
  name: string;
  caseNumber: string;
  certificateNumber: string;
  issuedAt: string;
  probationEndsAt: string;
  onPrint: () => void;
  onReturn: () => void;
};

function CertificateStamp({ label, tone, division }: { label: string; tone: "green" | "blue"; division: string }) {
  return (
    <div className={`certificateStampCeremony ${tone}`} aria-label={`Certificate stamped ${label}`}>
      <motion.div className="certificateStampHandle" initial={{ y: -125, rotate: -16 }} animate={{ y: [-125, 14, -10, 0], rotate: [-16, 3, -3, 0] }} transition={{ duration: .9, delay: .45, times: [0,.57,.78,1], type: "tween" }}>
        <span>USDD</span><b>♥</b><small>AUTHORIZED</small>
      </motion.div>
      <motion.div className="certificateStampMark" initial={{ opacity: 0, scale: 1.65, rotate: -18 }} animate={{ opacity: [0,0,1], scale: [1.65,1.65,1], rotate: [-18,-18,-7] }} transition={{ duration: 1.3, delay: .18 }}>
        <span>★ UNITED STATES DEPARTMENT OF DATING ★</span>
        <strong>{label}</strong>
        <small>{division} · OFFICIAL-ISH</small>
      </motion.div>
      <motion.div className="certificateInkBurst" aria-hidden="true" initial={{ opacity: 0, scale: .2 }} animate={{ opacity: [0,0,1,0], scale: [.2,.2,1.3,2.1], rotate: [0,0,8,15] }} transition={{ duration: 1.25, delay: .72 }}>✦　•　✷　•　✦</motion.div>
      <motion.span className="certificateImpact" aria-hidden="true" initial={{ opacity: 0, scale: .2 }} animate={{ opacity: [0,0,1,0], scale: [.2,.2,2.2,3] }} transition={{ duration: .9, delay: .72 }}>💥</motion.span>
    </div>
  );
}

export function RehabilitationDocuments({
  name,
  caseNumber,
  certificateNumber,
  issuedAt,
  probationEndsAt,
  onPrint,
  onReturn,
}: RehabilitationDocumentsProps) {
  return (
    <section className="rehabCert">
      <motion.div className="demoCertificate stampedCertificate" animate={{ x: [0,0,-7,6,-3,0], rotate: [0,0,-.4,.35,-.15,0] }} transition={{ duration: 1.35, times: [0,.72,.78,.84,.91,1] }}>
        <small>UNITED STATES DEPARTMENT OF DATING</small>
        <h2>Certificate of Provisional Recyclability</h2>
        <p>This certifies that</p>
        <h3>{name.toUpperCase()}</h3>
        <p>completed Dating School and is eligible to re-enter the dating ecosystem under supervision.</p>
        <strong>90-DAY NO-GHOSTING PROBATION</strong>
        <div>
          <span>CASE NUMBER<b>{caseNumber}</b></span>
          <span>CERTIFICATE<b>{certificateNumber}</b></span>
          <span>ISSUED<b>{issuedAt}</b></span>
          <span>PROBATION ENDS<b>{probationEndsAt}</b></span>
        </div>
        <CertificateStamp label="PROVISIONALLY RECYCLABLE" tone="green" division="ROMANTIC REHABILITATION DIVISION" />
      </motion.div>
      <div className="licenseActions">
        <button className="outline" type="button" onClick={onPrint}>↓ PRINT / SAVE CERTIFICATE</button>
        <button className="primary" type="button" onClick={onReturn}>RETURN TO DATING RECORD →</button>
      </div>
    </section>
  );
}

type ExpungementCertificateProps = {
  holderName: string;
  expungedName: string;
  caseNumber: string;
  certificateNumber: string;
  previousCount: number;
  officialCount: number;
  issuedAt: string;
  shared?: boolean;
  onShare: () => void;
  onPrint: () => void;
};

export function ExpungementCertificate({
  holderName,
  expungedName,
  caseNumber,
  certificateNumber,
  previousCount,
  officialCount,
  issuedAt,
  shared = false,
  onShare,
  onPrint,
}: ExpungementCertificateProps) {
  return (
    <section className="expungeDemo">
      <motion.div className="countDrop" initial={{ scale: 1.35 }} animate={{ scale: 1 }}>
        <span>OFFICIAL RELATIONSHIP COUNT</span><del>{previousCount}</del><b>{officialCount}</b>
      </motion.div>
      <motion.div className="demoCertificate stampedCertificate expungementPaper" animate={{ x: [0,0,-7,6,-3,0], rotate: [0,0,-.4,.35,-.15,0] }} transition={{ duration: 1.35, times: [0,.72,.78,.84,.91,1] }}>
        <small>UNITED STATES DEPARTMENT OF DATING</small>
        <h2>Certificate of Dating Record Expungement</h2>
        <p>This certifies that <b>{holderName.toUpperCase()}</b> has lawfully-ish expunged</p>
        <h3>{expungedName.toUpperCase()} · CASE {caseNumber}</h3>
        <p>from their permanent dating record pursuant to</p>
        <strong>DEPARTMENT POLICY §420.69</strong>
        <div>
          <span>CERTIFICATE<b>{certificateNumber}</b></span>
          <span>OFFICIAL COUNT<b>{officialCount}</b></span>
          <span>ISSUED<b>{issuedAt}</b></span>
        </div>
        <CertificateStamp label="RECORD EXPUNGED" tone="blue" division="PERMANENT DATING RECORDS OFFICE" />
      </motion.div>
      <div className="licenseActions">
        <button className="outline" type="button" onClick={onPrint}>↓ PRINT / SAVE</button>
        <button className="primary" type="button" onClick={onShare}>↗ SHARE CERTIFICATE</button>
      </div>
      <AnimatePresence>
        {shared && <motion.div className="shareToast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status">Shareable certificate ready. The group chat may now update its records.</motion.div>}
      </AnimatePresence>
    </section>
  );
}

type OngoingCase = {
  id: string;
  featured?: boolean;
  juryFull?: boolean;
  toneClass: "live" | "ready" | "vote" | "waiting" | "closed";
  statusLabel: string;
  claimant: { name: string; emoji: string };
  respondent: { name: string; emoji: string };
  headline: string;
  summary: string;
  charges: string[];
  crowd: string;
  seats: string;
};

const ONGOING_CASES: OngoingCase[] = [
  {
    id: "EX-2026-00421",
    featured: true,
    toneClass: "live",
    statusLabel: "LIVE NOW",
    claimant: { name: "Becky", emoji: "👩🏻" },
    respondent: { name: "Elijah", emoji: "👨🏽" },
    headline: "Alleged Failure to Communicate",
    summary: "Featured case. Live arguments streaming to the community gallery — jurors requested.",
    charges: ["Ghosting", "Situationship ambiguity", "Group chat manipulation"],
    crowd: "👀 128 WATCHING",
    seats: "⚖ 5 JURY SEATS",
  },
  {
    id: "EX-2026-00666",
    toneClass: "live",
    statusLabel: "LIVE NOW",
    juryFull: true,
    claimant: { name: "Maya", emoji: "🧑🏾‍🦱" },
    respondent: { name: "Tyler", emoji: "👩🏼" },
    headline: "Maya v. Tyler",
    summary: "Unauthorized “u up?” transmission after 1:00 a.m.",
    charges: ["Late-night solicitation", "Emotional loitering"],
    crowd: "👀 306 WATCHING",
    seats: "🔒 JURY FULL",
  },
  {
    id: "EX-2026-00999",
    toneClass: "ready",
    statusLabel: "HEARING IN 08:42",
    claimant: { name: "Jordan", emoji: "👩🏽" },
    respondent: { name: "Chris", emoji: "🧔🏻" },
    headline: "Jordan v. Chris",
    summary: "Three consecutive “haha” replies with no follow-up question.",
    charges: ["Conversational dead-ending"],
    crowd: "👀 87 WAITING",
    seats: "🪑 3 SEATS OPEN",
  },
  {
    id: "EX-2026-01337",
    toneClass: "waiting",
    statusLabel: "PRE-HEARING",
    claimant: { name: "Priya", emoji: "👩🏾" },
    respondent: { name: "Marco", emoji: "👨🏻" },
    headline: "Priya v. Marco",
    summary: "Repeated “I’m almost there” filings with GPS evidence to the contrary.",
    charges: ["Chronic ETA fabrication", "Location-based deception"],
    crowd: "👀 54 WAITING",
    seats: "⚖ 4 JURY SEATS",
  },
  {
    id: "EX-2026-02024",
    toneClass: "vote",
    statusLabel: "BALLOT OPEN",
    claimant: { name: "Sam", emoji: "🧑🏼" },
    respondent: { name: "Robin", emoji: "🧑🏽" },
    headline: "Sam v. Robin",
    summary: "Ballot window open. Community jurors deliberating on the record now.",
    charges: ["Undisclosed situationship overlap"],
    crowd: "👀 41 WATCHING",
    seats: "⚖ 1 SEAT LEFT",
  },
];

type OngoingCasesBoardProps = {
  joinedCaseId?: string;
  onEnroll: (caseId: string) => void;
  onEnterCourt: () => void;
};

export function OngoingCasesBoard({ joinedCaseId, onEnroll, onEnterCourt }: OngoingCasesBoardProps) {
  const openDockets = ONGOING_CASES.filter((entry) => !entry.juryFull).length;
  return (
    <section className="ongoingBoard" aria-label="Ongoing dating court cases open to community jurors">
      <header className="ongoingBoardHead">
        <div>
          <span>COURT OF ROMANTIC APPEALS · COMMUNITY JURY DUTY</span>
          <h2>Ongoing cases accepting community jurors</h2>
          <p>All parties, evidence, and outcomes are fictional. Serving as a community juror does not affect your own case.</p>
        </div>
        <div><b>{openDockets}</b><small>OPEN DOCKETS</small></div>
      </header>
      <div className="ongoingBoardGrid">
        {ONGOING_CASES.map((item, index) => {
          const isJoined = joinedCaseId === item.id;
          const isFull = !!item.juryFull;
          return (
            <motion.article
              key={item.id}
              className={`ongoingCard ${item.featured ? "featured" : ""} ${isJoined ? "joined" : ""} ${isFull ? "full" : ""}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * .06 }}
              whileHover={isFull ? undefined : { y: -5 }}
            >
              <div className="caseRibbon"><span className={item.toneClass}>● {item.statusLabel}</span><b>{item.id}</b></div>
              <div className="casePeople"><span>{item.claimant.emoji}<b>{item.claimant.name.toUpperCase()}</b></span><em>v.</em><span>{item.respondent.emoji}<b>{item.respondent.name.toUpperCase()}</b></span></div>
              <h3>{item.headline}</h3>
              <p>{item.summary}</p>
              <div className="publicCharges">{item.charges.map((charge) => <span key={charge}>🚩 {charge}</span>)}</div>
              <div className="caseCrowd"><span>{item.crowd}</span><span>{item.seats}</span></div>
              {isJoined ? (
                <button className="enrollBtn joined" type="button" onClick={onEnterCourt}>ENTER COURTROOM →</button>
              ) : isFull ? (
                <button className="enrollBtn full" type="button" disabled aria-disabled="true">🔒 JURY FULL</button>
              ) : (
                <button className="enrollBtn" type="button" onClick={() => onEnroll(item.id)}>JOIN AS JUROR →</button>
              )}
              {isJoined && <div className="assignmentSlip">✓ OATH ACCEPTED · SEAT ASSIGNED · REPORT TO COURTROOM</div>}
            </motion.article>
          );
        })}
      </div>
      <div className="juryFinePrint"><b>COMMUNITY JURY SAFETY NOTICE</b><p>Do not use real names, private screenshots, or this website to harass anyone. USDD is a satirical civic simulation — jury duty is fictional and not a real adjudication system.</p></div>
    </section>
  );
}

export type DemoWorkflowCallbacks = {
  onRoleChange: (role: DemoRole) => void;
  onCaseChange: (next: DemoCaseState) => void;
};

export async function shareCertificate(
  title: string,
  text: string,
  url: string,
  onShared: () => void,
  onError?: (message: string) => void,
) {
  try {
    if (navigator.share) await navigator.share({ title, text, url });
    else await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
    onShared();
  } catch (error) {
    if ((error as DOMException).name !== "AbortError") onError?.("Sharing is unavailable. Try Print / Save instead.");
  }
}
