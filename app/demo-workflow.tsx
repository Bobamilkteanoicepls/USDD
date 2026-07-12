"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AIJudgeVerdictPanel,
  DashboardShell,
  LiveHearing,
  OngoingCasesBoard,
  RehabilitationDocuments,
  TrafficSchoolFlow,
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
  type Juror,
  type WorkflowService,
} from "./demo-case";

type Identity = "becky" | "elijah";
type CourtSegment = "my-case" | "ongoing";
type Props = {
  identity: Identity;
  onSyncElijah?: (classification: "hazardous" | "provisionally_recyclable" | "expunged") => void;
};

const isWorkflowService = (value: unknown): value is WorkflowService => value === "court" || value === "school";

export default function DemoWorkflow({ identity, onSyncElijah }: Props) {
  const [state, setState] = useState<DemoCaseState>(() => createInitialDemoCase());
  const [activeService, setActiveService] = useState<WorkflowService>("court");
  const [courtSegment, setCourtSegment] = useState<CourtSegment>("my-case");
  const [ready, setReady] = useState(false);
  const update = (fn: (previous: DemoCaseState) => DemoCaseState) => setState((previous) => fn(previous));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setState(loadDemoCase());
      const stored = sessionStorage.getItem("usdd-demo-service");
      if (isWorkflowService(stored)) setActiveService(stored);
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => { if (ready) saveDemoCase(state); }, [ready, state]);

  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === DEMO_STORAGE_KEY || event.key === DEMO_EVENT_KEY) setState(loadDemoCase()); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    const navigate = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (!isWorkflowService(detail)) return;
      setActiveService(detail);
      sessionStorage.setItem("usdd-demo-service", detail);
      if (detail === "court") setCourtSegment("my-case");
    };
    window.addEventListener("usdd-navigate-service", navigate);
    return () => window.removeEventListener("usdd-navigate-service", navigate);
  }, []);

  useEffect(() => {
    const onReset = () => {
      setState(createInitialDemoCase());
      setActiveService("court");
      setCourtSegment("my-case");
      sessionStorage.removeItem("usdd-demo-service");
    };
    window.addEventListener("usdd-reset", onReset);
    return () => window.removeEventListener("usdd-reset", onReset);
  }, []);

  useEffect(() => {
    const onFileElijah = () => {
      update((previous) => {
        if (previous.completed.filed) return previous;
        const filedAt = new Date().toISOString();
        return {
          ...previous,
          classification: "hazardous",
          filedAt,
          notice: "delivered",
          notifications: [
            ...previous.notifications,
            ...buildNotice(previous),
          ],
          completed: { ...previous.completed, filed: true, noticed: true },
        };
      });
    };
    window.addEventListener("usdd-file-elijah", onFileElijah);
    return () => window.removeEventListener("usdd-file-elijah", onFileElijah);
  }, []);

  useEffect(() => {
    if (state.hearing.phase !== "decided" || state.hearing.revealCount >= 5) return;
    const timer = window.setTimeout(
      () => update((s) => ({ ...s, hearing: { ...s.hearing, revealCount: Math.min(5, s.hearing.revealCount + 1) } })),
      460,
    );
    return () => window.clearTimeout(timer);
  }, [state.hearing.phase, state.hearing.revealCount]);

  useEffect(() => { setCourtSegment("my-case"); }, [identity]);

  const setService = (service: WorkflowService) => {
    setActiveService(service);
    sessionStorage.setItem("usdd-demo-service", service);
  };
  const requestIdentitySwitch = () => window.dispatchEvent(new CustomEvent("usdd-toggle-identity"));

  const currentCount = officialRelationshipCount(state);
  const guiltyVotes = state.jurors.filter((juror) => juror.vote === "guilty").length;
  const totalVotes = state.jurors.filter((juror) => juror.vote).length;
  const joinedCaseId = state.publicJury.joined ? state.caseNumber : undefined;

  const milestones = useMemo(() => [
    ["Case filed", state.completed.filed],
    ["Notice served", state.completed.noticed],
    ["Hearing held", state.completed.heard],
    ["Jury voted", state.completed.voted],
    ["School completed", state.completed.school],
  ] as Array<[string, boolean]>, [state.completed]);

  const hearingStartLabel = useMemo(() => {
    if (!state.filedAt) return "Awaiting filing";
    const startedAt = state.hearing.startedAt ?? new Date(state.filedAt).getTime() + 3 * 60 * 1000;
    return new Date(startedAt).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [state.filedAt, state.hearing.startedAt]);

  const joinHearing = () => update((s) => {
    if (s.hearing.phase !== "not_started") return s;
    const startedAt = Date.now();
    const openedAt = new Date().toISOString();
    return {
      ...s,
      hearing: { ...s.hearing, phase: "arguments", startedAt, revealCount: 0 },
      notifications: [
        ...s.notifications,
        ...(["becky", "elijah"] as DemoRole[]).map((recipient) => ({
          id: `hearing-${recipient}-${startedAt}`,
          recipient,
          channel: "in_app" as const,
          title: "Hearing Now in Session",
          message: `Dating Court opened arguments in ${s.caseNumber}.`,
          createdAt: openedAt,
          read: false,
        })),
      ],
    };
  });

  const autoResolveHearing = () => update((s) => {
    if (s.hearing.phase === "decided") return s;
    const jurors = s.jurors.map((juror, index) => ({
      ...juror,
      vote: (index === 3 ? "not_guilty" : "guilty") as Juror["vote"],
    }));
    const guilty = jurors.filter((juror) => juror.vote === "guilty").length;
    const result: "guilty" | "appeal_granted" | "hung_jury" = guilty >= 3 ? "guilty" : "appeal_granted";
    const decidedAt = new Date().toISOString();
    const stateWithVotes: DemoCaseState = { ...s, jurors };
    const classification = result === "appeal_granted" ? ("recyclable" as const) : s.classification;
    return {
      ...stateWithVotes,
      classification,
      appeal: "decided",
      hearing: { ...s.hearing, phase: "decided", revealCount: 0 },
      verdict: { result, reasoning: caseAwareReasoning(stateWithVotes), decidedAt },
      completed: { ...s.completed, heard: true, voted: true },
      notifications: [
        ...s.notifications,
        ...(["becky", "elijah"] as DemoRole[]).map((recipient) => ({
          id: `verdict-${recipient}-${Date.now()}`,
          recipient,
          channel: "in_app" as const,
          title: "Court Verdict Issued",
          message: `The AI Judge issued ${result.replaceAll("_", " ")} in ${s.caseNumber}.`,
          createdAt: decidedAt,
          read: false,
        })),
      ],
    };
  });

  const vote = (jurorId: string, voteValue: Juror["vote"]) => update((s) => ({
    ...s,
    jurors: s.jurors.map((juror) => (juror.id === jurorId ? { ...juror, vote: voteValue } : juror)),
  }));

  const enrollSchool = () => {
    update((s) => ({
      ...s,
      school: { ...s.school, state: "lessons", lessonIndex: 0, questionIndex: 0, answers: [], score: 0 },
      notifications: [
        ...s.notifications,
        {
          id: `school-${Date.now()}`,
          recipient: "becky",
          channel: "in_app",
          title: "Elijah Entered Rehabilitation",
          message: `Elijah enrolled in Dating School for case ${s.caseNumber}.`,
          createdAt: new Date().toISOString(),
          read: false,
        },
      ],
    }));
    setService("school");
  };

  const completeLesson = () => update((s) => {
    const nextIndex = s.school.lessonIndex + 1;
    return { ...s, school: { ...s.school, lessonIndex: nextIndex, state: nextIndex >= 3 ? "exam" : "lessons" } };
  });

  const answer = (questionIndex: number, answerIndex: number) => update((s) => {
    if (s.school.answers[questionIndex] != null) return s;
    const answers = [...s.school.answers];
    answers[questionIndex] = answerIndex;
    const isLast = questionIndex === DEMO_QUIZ.length - 1;
    const score = answers.filter((value, index) => value === DEMO_QUIZ[index]?.correctIndex).length;
    return {
      ...s,
      school: {
        ...s.school,
        answers,
        questionIndex: isLast ? questionIndex : questionIndex + 1,
        score,
        state: isLast ? (score >= 2 ? "passed" : "failed") : "exam",
        attempts: isLast ? s.school.attempts + 1 : s.school.attempts,
      },
    };
  });

  const retrySchool = () => update((s) => ({
    ...s,
    school: { ...s.school, state: "exam", questionIndex: 0, answers: [], score: 0 },
  }));

  const graduate = () => update((s) => {
    const issuedAt = new Date().toISOString();
    onSyncElijah?.("provisionally_recyclable");
    return {
      ...s,
      classification: "provisionally_recyclable",
      documents: {
        ...s.documents,
        rehabilitationNumber: s.documents.rehabilitationNumber || issueNumber("REHAB"),
        rehabilitationIssuedAt: issuedAt,
      },
      completed: { ...s.completed, school: true },
      notifications: [
        ...s.notifications,
        {
          id: `graduate-${Date.now()}`,
          recipient: "becky",
          channel: "in_app",
          title: "Rehabilitation Completed",
          message: `Elijah passed Dating School with ${s.school.score}/3 and is now Provisionally Recyclable.`,
          createdAt: issuedAt,
          read: false,
        },
      ],
    };
  });

  const enrollAsJuror = (caseId: string) => {
    if (caseId === state.caseNumber) {
      update((s) => (s.publicJury.joined ? s : ({
        ...s,
        publicJury: { ...s.publicJury, joined: true, oathAccepted: true, joinedAt: new Date().toISOString() },
      })));
    }
    setCourtSegment("ongoing");
  };

  const focusOngoingCourt = () => {
    setCourtSegment("ongoing");
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => document.querySelector(".ongoingBoard")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const returnToOngoing = () => setCourtSegment("ongoing");

  const renderHearingStage = () => {
    if (state.hearing.phase === "not_started") {
      return (
        <div className="claimantStatus">
          <span className="formCode">HEARING SCHEDULED · 5-SECOND ACCELERATED SESSION</span>
          <h2>Becky v. Elijah — hearing lobby</h2>
          <p>The Court of Romantic Appeals will condense a ten-minute hearing into a five-second accelerated session. Both parties and the fictional five-person jury are already in chambers.</p>
          <div className="sentNotice">
            <b>SCHEDULED START · {hearingStartLabel}</b>
            <span>Courtroom 4B · The Honorable Algorithm presiding · Five-second accelerated session in progress upon join.</span>
            <small>All parties, jurors, and rulings remain fictional.</small>
          </div>
          <div className="caseActions">
            <button className="primary" type="button" onClick={joinHearing}>JOIN THE HEARING →</button>
            <button className="outline" type="button" onClick={() => setCourtSegment("ongoing")}>BROWSE ONGOING CASES</button>
          </div>
        </div>
      );
    }
    if (state.hearing.phase === "arguments") {
      return (
        <LiveHearing
          durationSeconds={state.hearing.durationSeconds}
          startedAt={state.hearing.startedAt}
          claimantStatement={state.claimant.statement}
          respondentStatement={state.respondent.statement}
          evidence={state.evidence}
          jurors={state.jurors}
          onTimeExpired={autoResolveHearing}
          onSkip={autoResolveHearing}
          onJurorVote={vote}
        />
      );
    }
    if (state.hearing.phase === "voting") {
      return (
        <section className="liveCourt">
          <div className="courtLive"><span>● JURY DELIBERATION</span><b>{totalVotes}/5</b><small>SEALING BALLOTS</small></div>
          <h2>Sealing the ballots…</h2>
          <p>The AI Judge is stepping to the bench.</p>
        </section>
      );
    }
    if (state.verdict) {
      const elijahGuilty = identity === "elijah" && state.verdict.result === "guilty";
      const buttonLabel = elijahGuilty ? "ENROLL IN DATING SCHOOL" : "RETURN TO ONGOING CASES";
      const onContinue = elijahGuilty ? enrollSchool : returnToOngoing;
      return (
        <AIJudgeVerdictPanel
          verdict={state.verdict.result}
          reasoning={state.verdict.reasoning}
          guiltyVotes={guiltyVotes}
          totalVotes={totalVotes}
          revealCount={state.hearing.revealCount}
          jurors={state.jurors}
          buttonLabel={buttonLabel}
          onContinue={onContinue}
        />
      );
    }
    return null;
  };

  const renderMyCase = () => {
    if (!state.completed.filed) {
      return (
        <DashboardShell
          role={identity}
          onSwitch={requestIdentitySwitch}
          eyebrow="COURT OF ROMANTIC APPEALS"
          title="No active case"
          status={identity === "becky" ? `Official relationships: ${currentCount}` : "No case has been filed against you."}
        >
          <div className="empty">
            <b>NO ACTIVE CASE</b>
            <p>{identity === "becky"
              ? "Trash Your Ex has not recorded a hazardous filing yet. File Elijah from the Trash Your Ex tab to open Dating Court."
              : "You are not currently a respondent. Browse Ongoing Cases below to observe or serve as a community juror."}
            </p>
            <div className="caseActions">
              <button className="outline" type="button" onClick={() => setCourtSegment("ongoing")}>BROWSE ONGOING CASES →</button>
            </div>
          </div>
        </DashboardShell>
      );
    }
    return (
      <DashboardShell
        role={identity}
        onSwitch={requestIdentitySwitch}
        eyebrow="COURT OF ROMANTIC APPEALS"
        title="Becky v. Elijah"
        status={identity === "becky"
          ? `Official relationships: ${currentCount}`
          : `Classification: ${state.classification.replaceAll("_", " ")}`}
      >
        {identity === "becky" ? (
          <section className="claimantStatus">
            <span className="formCode">CASE {state.caseNumber}</span>
            <h2>Elijah has been classified Hazardous Non-Recyclable.</h2>
            <p>Filed {formatDemoDate(state.filedAt)}. Observe the accelerated hearing below — final expungement lives on your Dating Record tab after a guilty ruling.</p>
          </section>
        ) : (
          <div className="claimantStatus">
            <motion.div
              className={`respondentClassification ${state.classification}`}
              initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
            >
              <span>OFFICIAL USDD CLASSIFICATION</span>
              <h2>
                {state.classification === "hazardous"
                  ? "YOU ARE EMOTIONAL WASTE"
                  : state.classification === "recyclable"
                    ? "THE COURT HAS CLEARED YOU"
                    : state.classification === "certified_recyclable"
                      ? "CERTIFIED FOR CIVILIAN DATING"
                      : state.classification === "provisionally_recyclable"
                        ? "REHABILITATION IN PROGRESS"
                        : state.classification === "expunged"
                          ? "CASE EXPUNGED"
                          : "CLASSIFICATION PENDING"}
              </h2>
              <strong>
                {state.classification === "hazardous"
                  ? "☣ HAZARDOUS NON-RECYCLABLE"
                  : state.classification.replaceAll("_", " ").toUpperCase()}
              </strong>
              <p>Assigned by Becky · Case {state.caseNumber}</p>
              <div>{state.violations.map((violation) => <b key={violation}>🚩 {violation}</b>)}</div>
              <small>This is a fictional claimant-submitted classification, not a factual finding.</small>
            </motion.div>
            <h2>Respond to case {state.caseNumber}</h2>
            <p>You can join the accelerated hearing now or enroll in Dating School to move toward Provisionally Recyclable status.</p>
            <div className="caseActions">
              <button className="outline" type="button" onClick={() => setService("school")}>OPEN DATING SCHOOL</button>
            </div>
          </div>
        )}
        <section className="courtroomStage">{renderHearingStage()}</section>
      </DashboardShell>
    );
  };

  const renderOngoingCases = () => (
    <OngoingCasesBoard joinedCaseId={joinedCaseId} onEnroll={enrollAsJuror} onEnterCourt={focusOngoingCourt} />
  );

  const renderSchool = () => (
    <DashboardShell
      role={identity}
      onSwitch={requestIdentitySwitch}
      eyebrow="DATING SCHOOL"
      title={identity === "elijah" ? "Elijah's Rehabilitation" : "Becky's Observer View"}
    >
      {identity === "becky" ? (
        <div className="claimantStatus">
          <span className="formCode">OBSERVER MODE · READ-ONLY ACCESS</span>
          <h2>School progress: {state.school.state.replaceAll("_", " ")}</h2>
          <p>Only the respondent can complete Dating School. This panel mirrors Elijah&apos;s live enrollment so you can watch rehabilitation from the claimant side.</p>
          <ul className="allegations">
            <li>▸ Modules complete: {Math.min(state.school.lessonIndex, 3)}/3</li>
            <li>▸ Exam attempts: {state.school.attempts}</li>
            <li>▸ Final score: {state.school.state === "passed" || state.school.state === "failed" ? `${state.school.score}/3` : "Not yet graded"}</li>
            <li>▸ Rehabilitation certificate: {state.completed.school ? `Issued ${formatDemoDate(state.documents.rehabilitationIssuedAt)}` : "Pending"}</li>
          </ul>
          <div className="caseActions">
            <button className="outline" type="button" onClick={() => setService("court")}>← RETURN TO DATING COURT</button>
          </div>
        </div>
      ) : !state.completed.filed ? (
        <div className="claimantStatus">
          <h2>Dating School is on standby.</h2>
          <p>Enrollment activates automatically once you have been classified in a case. Preview the syllabus below — coursework begins after a classification is filed.</p>
          <ul className="allegations">
            <li>▸ Module 1 — Empathy: A Feature, Not a Bug</li>
            <li>▸ Module 2 — Communication Without Disappearing</li>
            <li>▸ Module 3 — Defining the Relationship</li>
          </ul>
          <small>Fictional coursework. Actual rehabilitation requires an official classification.</small>
          <div className="caseActions">
            <button className="primary" type="button" onClick={() => setService("court")}>OPEN DATING COURT</button>
          </div>
        </div>
      ) : state.completed.school ? (
        <RehabilitationDocuments
          name="Elijah"
          caseNumber={state.caseNumber}
          certificateNumber={state.documents.rehabilitationNumber || "Pending"}
          issuedAt={formatDemoDate(state.documents.rehabilitationIssuedAt)}
          probationEndsAt={state.documents.rehabilitationIssuedAt
            ? new Date(new Date(state.documents.rehabilitationIssuedAt).getTime() + 90 * 86400000).toLocaleDateString()
            : "Pending"}
          onPrint={() => window.print()}
          onReturn={() => setService("court")}
        />
      ) : state.verdict?.result === "guilty" || state.school.state !== "not_enrolled" ? (
        <TrafficSchoolFlow
          questions={DEMO_QUIZ}
          lessonIndex={state.school.lessonIndex}
          questionIndex={state.school.questionIndex}
          answers={state.school.answers}
          passed={state.school.state === "passed" ? true : state.school.state === "failed" ? false : null}
          score={state.school.score}
          onCompleteLesson={completeLesson}
          onAnswer={answer}
          onRetry={retrySchool}
          onGraduate={graduate}
        />
      ) : (
        <div className="claimantStatus">
          <h2>Voluntary rehabilitation available.</h2>
          <p>Your case is filed but a verdict has not been recorded yet. Preview the syllabus or enroll voluntarily to begin coursework immediately.</p>
          <ul className="allegations">
            <li>▸ Module 1 — Empathy: A Feature, Not a Bug</li>
            <li>▸ Module 2 — Communication Without Disappearing</li>
            <li>▸ Module 3 — Defining the Relationship</li>
          </ul>
          <div className="caseActions">
            <button className="primary" type="button" onClick={enrollSchool}>ENROLL VOLUNTARILY →</button>
            <button className="outline" type="button" onClick={() => setService("court")}>RETURN TO DATING COURT</button>
          </div>
        </div>
      )}
    </DashboardShell>
  );

  return (
    <section className="demoShell fullDemo">
      <div className="demoTop">
        <div>
          <span>CASE {state.caseNumber}</span>
          <h2>Becky <em>v.</em> Elijah</h2>
          <p>{state.violations.join(" · ")}</p>
        </div>
        <div className={`caseStatus ${state.classification}`}>{state.classification.replaceAll("_", " ").toUpperCase()}</div>
      </div>

      {activeService === "school" ? (
        renderSchool()
      ) : (
        <>
          <nav className="courtSegments" aria-label="Dating Court sections">
            <button
              type="button"
              className={courtSegment === "my-case" ? "active" : ""}
              aria-pressed={courtSegment === "my-case"}
              onClick={() => setCourtSegment("my-case")}
            >
              My Case
            </button>
            <button
              type="button"
              className={courtSegment === "ongoing" ? "active" : ""}
              aria-pressed={courtSegment === "ongoing"}
              onClick={() => setCourtSegment("ongoing")}
            >
              Ongoing Cases
            </button>
          </nav>
          {courtSegment === "my-case" ? (
            <>
              <div className="journey">
                {milestones.map(([text, done], index) => (
                  <span className={done ? "done" : ""} key={text}>
                    <i>{done ? "✓" : index + 1}</i>{text.toUpperCase()}
                  </span>
                ))}
              </div>
              {renderMyCase()}
            </>
          ) : (
            renderOngoingCases()
          )}
        </>
      )}
    </section>
  );
}
