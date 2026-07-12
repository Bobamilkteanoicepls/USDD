"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
  return (
    <div className="userSwitch" role="group" aria-label="Choose demo user">
      <small>DEMO USER</small>
      {(["becky", "elijah"] as DemoRole[]).map((role) => (
        <button
          key={role}
          type="button"
          className={activeRole === role ? "active" : ""}
          aria-pressed={activeRole === role}
          onClick={() => onSwitch(role)}
        >
          <span>{role[0].toUpperCase()}</span>
          {role === "becky" ? "Becky" : "Elijah"}
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
  onSwitch: () => void;
};

export function DashboardShell({
  role,
  eyebrow,
  title,
  status,
  children,
  onSwitch,
}: DashboardShellProps) {
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
          {isBecky ? "B" : "E"}
        </div>
        <div>
          <small>{eyebrow ?? (isBecky ? "CLAIMANT DASHBOARD" : "RESPONDENT DASHBOARD")}</small>
          <h3>{title ?? `Welcome, ${isBecky ? "Becky" : "Elijah"}`}</h3>
          {status && <p>{status}</p>}
        </div>
        <button className="outline" type="button" onClick={onSwitch}>
          SWITCH TO {isBecky ? "ELIJAH" : "BECKY"} →
        </button>
      </div>
      {children}
    </motion.section>
  );
}

type NotificationInboxCardProps = {
  caseNumber: string;
  claimantName: string;
  filedAt: string;
  isRead: boolean;
  onOpen: () => void;
  onAppeal: () => void;
  onSchool: () => void;
};

export function NotificationInboxCard({
  caseNumber,
  claimantName,
  filedAt,
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
      onViewportEnter={() => !isRead && onOpen()}
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
      <div className="sentNotice">
        <b>NOTICE OF ROMANTIC MATERIAL CLASSIFICATION</b>
        <span>Response requested before the group chat reaches a verdict.</span>
        <small>You may appeal with evidence or voluntarily enroll in Ex Traffic School.</small>
      </div>
      <div>
        <button className="primary" type="button" onClick={onAppeal}>
          FILE AN APPEAL →
        </button>
        <button className="outline" type="button" onClick={onSchool}>
          TAKE TRAFFIC SCHOOL
        </button>
      </div>
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
    if (!next.type.startsWith("image/")) {
      setError("USDD accepts screenshot images only for this demonstration.");
      return;
    }
    if (next.size > 5 * 1024 * 1024) {
      setError("Exhibit exceeds the fictional 5 MB evidence allowance.");
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
      <p>Upload fictional demo screenshots only. Avoid real names, phone numbers, or private messages.</p>

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
        SEAL EVIDENCE & ENTER TRAFFIC COURT →
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

export function LiveHearing({
  durationSeconds,
  startedAt,
  claimantStatement,
  respondentStatement,
  evidence,
  jurors,
  onTimeExpired,
  onSkip,
  onJurorVote,
}: LiveHearingProps) {
  const [remaining, setRemaining] = useState(() => startedAt
    ? Math.max(0, durationSeconds - Math.floor((Date.now() - startedAt) / 1000))
    : durationSeconds);
  const expiredRef = useRef(false);

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

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <section className="liveCourt">
      <div className="courtroomAtmosphere" aria-hidden="true"><i>🏛️</i><span>COURT OF ROMANTIC APPEALS</span><div><b>👀</b><b>😮</b><b>📝</b><b>🤨</b><b>🍿</b></div></div>
      <div className="courtLive" aria-live="polite">
        <span>● LIVE · FICTIONAL HEARING</span>
        <b>{minutes}:{seconds}</b>
        <small>DEMO REPRESENTATION OF A 10-MINUTE HEARING</small>
      </div>
      <motion.div className="judgeBench" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="judgeAvatar"><span>⚖</span><b>🤖</b><small>AI</small></div>
        <div><small>THE HONORABLE ALGORITHM PRESIDING</small><strong>AI JUDGE A.L. GORE-ITHM</strong><em>Satirical summary engine · No legal authority</em></div>
        <motion.span className="gavel" aria-label="Judge’s gavel" animate={{ rotate: [0, -32, 8, 0], y: [0, -8, 3, 0] }} transition={{ repeat: Infinity, repeatDelay: 3.2, duration: .65 }}>🔨</motion.span>
      </motion.div>
      <motion.div className="orderCall" initial={{ opacity: 0, scale: .7 }} animate={{ opacity: [0, 1, 1, 0], scale: [.7, 1.05, 1, .9] }} transition={{ duration: 2.4 }}>ORDER IN THE GROUP CHAT!</motion.div>
      <h2>Becky v. Elijah</h2>
      <div className="arguments">
        <motion.article className="partyPodium beckyPodium" initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", delay: .2 }}>
          <div className="partyAvatar"><span>👩🏻</span><b>B</b></div><div><span>CLAIMANT · BECKY</span><p>{claimantStatement}</p></div><motion.em animate={{ rotate: [-8, 8, -8] }} transition={{ repeat: Infinity, duration: 2 }}>🚩</motion.em>
        </motion.article>
        <motion.article className="partyPodium elijahPodium" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", delay: .35 }}>
          <div className="partyAvatar"><span>👨🏽</span><b>E</b></div><div><span>RESPONDENT · ELIJAH</span><p>{respondentStatement}</p></div><motion.em animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>😅</motion.em>
        </motion.article>
      </div>
      <div className="courtEvidence">
        <b>EVIDENCE BEFORE THE COURT</b>
        {evidence.length ? evidence.map((item, index) => (
          <motion.span key={item.id} initial={{ opacity: 0, rotate: -5, x: -25 }} animate={{ opacity: 1, rotate: index % 2 ? 2 : -1, x: 0 }} transition={{ delay: .5 + index * .15 }}>📎 EXHIBIT {String.fromCharCode(65 + index)} · {item.caption}</motion.span>
        )) : <span>No exhibits submitted. The group chat remains under subpoena.</span>}
      </div>
      <JuryPanel jurors={jurors} votingOpen={remaining === 0} onVote={onJurorVote} />
      <button className="primary wide" type="button" onClick={onSkip}>
        {remaining > 0 ? "DEMO MODE: CLOSE ARGUMENTS EARLY" : "REVEAL JURY VOTE"} →
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
                <button type="button" onClick={() => onVote(juror.id, "guilty")}>G</button>
                <button type="button" onClick={() => onVote(juror.id, "not_guilty")}>NG</button>
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
  onContinue: () => void;
};

export function AIJudgeVerdictPanel({
  verdict,
  reasoning,
  guiltyVotes,
  totalVotes,
  revealCount,
  jurors,
  onContinue,
}: AIJudgeVerdictPanelProps) {
  const label = verdict === "guilty" ? "STILL TRASH" : verdict === "appeal_granted" ? "APPEAL GRANTED" : "SITUATIONSHIP PENDING";
  return (
    <motion.section className="demoVerdict" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="impactBurst" aria-hidden="true" initial={{ scale: 0, opacity: 1 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 1, delay: .65 }}>💥</motion.div>
      <motion.div className="verdictJudge" initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
        <div className="judgeAvatar large"><span>⚖</span><b>🤖</b><small>AI</small></div>
        <div><small>THE HONORABLE ALGORITHM</small><strong>AI JUDGE A.L. GORE-ITHM</strong></div>
        <motion.span className="gavel strike" animate={{ rotate: [0, -45, 12, 0], scale: [1, 1.18, 1] }} transition={{ duration: .8, delay: .35 }}>🔨</motion.span>
      </motion.div>
      <span>JURY VOTE · {guiltyVotes}–{Math.max(0, totalVotes - guiltyVotes)}</span>
      <motion.h2 initial={{ scale: 2.4, rotate: -20, opacity: 0 }} animate={{ scale: [2.4,.88,1.08,1], rotate: [-20,-3,-6,-4], opacity: 1 }} transition={{ duration: .8, delay: .55 }}>{label}</motion.h2>
      <JuryPanel jurors={jurors} revealCount={revealCount} />
      <blockquote>
        <b>AI JUDGE · SATIRICAL SUMMARY, NOT A REAL LEGAL DECISION</b>
        {reasoning}
      </blockquote>
      <button className="primary" type="button" onClick={onContinue}>
        {verdict === "guilty" ? "ENROLL IN EX TRAFFIC SCHOOL" : "RETURN TO CASE FILE"} →
      </button>
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
        <h2>{passed ? "Rehabilitation coursework complete." : "The syllabus requests a rematch."}</h2>
        <p>Final score: {score}/{questions.length}. Passing requires emotionally responsible answers, twice.</p>
        <button className="primary" type="button" onClick={passed ? onGraduate : onRetry}>
          {passed ? "ISSUE REHABILITATION DOCUMENTS" : "RETAKE FINAL EXAM"} →
        </button>
      </section>
    );
  }

  if (lessonIndex < LESSONS.length) {
    const lesson = LESSONS[lessonIndex];
    return (
      <section className="training">
        <div className="schoolLogo">USDD EX TRAFFIC SCHOOL<small>ACCREDITED BY ABSOLUTELY NO ONE</small></div>
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
      <motion.b initial={{ scale: 2, rotate: -20 }} animate={{ scale: 1, rotate: -6 }}>PROVISIONALLY RECYCLABLE</motion.b>
      <div className="demoCertificate">
        <small>UNITED STATES DEPARTMENT OF DATING</small>
        <h2>Certificate of Romantic Rehabilitation</h2>
        <p>This certifies that</p>
        <h3>{name.toUpperCase()}</h3>
        <p>completed Ex Traffic School and is eligible to re-enter the dating ecosystem under supervision.</p>
        <strong>90-DAY NO-GHOSTING PROBATION</strong>
        <div>
          <span>CASE NUMBER<b>{caseNumber}</b></span>
          <span>CERTIFICATE<b>{certificateNumber}</b></span>
          <span>ISSUED<b>{issuedAt}</b></span>
        </div>
      </div>
      <div className="datingLicense">
        <div className="licenseTop"><span>♥</span><span>USDD<br /><b>PROVISIONAL LICENSE TO DATE</b></span><em>CLASS P</em></div>
        <div className="licenseBody">
          <div className="licensePhoto">{name[0]?.toUpperCase()}</div>
          <div>
            <small>LICENSE HOLDER</small><h2>{name.toUpperCase()}</h2>
            <div className="licenseData">
              <span>STATUS<b>PROVISIONAL</b></span><span>POINTS<b>0</b></span>
              <span>RESTRICTION<b>NO GHOSTING</b></span><span>PROBATION ENDS<b>{probationEndsAt}</b></span>
            </div>
          </div>
        </div>
      </div>
      <div className="licenseActions">
        <button className="outline" type="button" onClick={onPrint}>↓ PRINT / SAVE DOCUMENTS</button>
        <button className="primary" type="button" onClick={onReturn}>RETURN TO BECKY’S RECORD →</button>
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
      <div className="demoCertificate">
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
      </div>
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
