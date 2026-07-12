"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Ex = { id: number; name: string; length: string; violations: string[]; avatar: string; score: number; bin?: "recycle" | "hazard" };
type Step = "landing" | "add" | "sort" | "court" | "school" | "certificate" | "final";

const violations = ["Ghosting", "Love Bombing", "Breadcrumbing", "Manipulation", "Dry Texting", "Mixed Signals", "“I’m not ready”", "Cheating", "Emotionally Unavailable", "Took 8 hours to reply", "“We should stay friends”"];
const sample: Ex = { id: 1, name: "Kevin", length: "situationship", violations: ["Ghosting", "Love Bombing", "Dry Texting"], avatar: "K", score: 87 };
const jury = ["JuryDutyBae92", "Patricia from HR", "Your Group Chat", "@redflagdetective", "A Licensed Therapist", "Becky’s Mom"];
const quiz = [
  { q: "Your partner texts: “We need to talk.”", a: ["Reply in 3 business days", "Disappear", "Talk to them"], correct: 2 },
  { q: "Someone asks: “What are we?”", a: ["Ghost", "Change the topic", "Answer honestly"], correct: 2 },
  { q: "You forgot their birthday.", a: ["Blame Mercury retrograde", "Apologize", "Block them"], correct: 1 },
];

function Seal() { return <div className="seal"><span>★</span><b>USDOD</b><small>OFFICIAL-ISH</small></div>; }
function Header({ step, reset }: { step: Step; reset: () => void }) {
  const order = ["add", "sort", "court", "school", "certificate"];
  const current = order.indexOf(step);
  return <header><button className="brand" onClick={reset}><span>♻</span> TRASH YOUR EX</button><div className="progress">{order.map((x, i) => <i key={x} className={i <= current ? "on" : ""} />)}</div><span className="agency">U.S. DEPT. OF DATING</span></header>;
}

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [exes, setExes] = useState<Ex[]>([sample]);
  const [form, setForm] = useState({ name: "", length: "situationship", violations: [] as string[] });
  const [active, setActive] = useState(0);
  const [appeal, setAppeal] = useState<Ex | null>(null);
  const [verdict, setVerdict] = useState<"loading" | "guilty" | "granted">("loading");
  const [schoolEx, setSchoolEx] = useState<Ex | null>(null);
  const [lesson, setLesson] = useState(0);
  const [question, setQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [reveal, setReveal] = useState(false);

  useEffect(() => { const saved = localStorage.getItem("trash-your-ex"); if (saved) try { setExes(JSON.parse(saved)); } catch {} }, []);
  useEffect(() => { localStorage.setItem("trash-your-ex", JSON.stringify(exes)); }, [exes]);
  const hazards = exes.filter(x => x.bin === "hazard");
  const current = exes[active];
  const reset = () => { setStep("landing"); setActive(0); setReveal(false); };

  const addEx = () => {
    if (!form.name.trim()) return;
    setExes(prev => [...prev.filter(x => x.id !== 1 || x.name !== "Kevin"), { id: Date.now(), name: form.name.trim(), length: form.length, violations: form.violations.length ? form.violations : ["Mixed Signals"], avatar: form.name[0].toUpperCase(), score: Math.floor(55 + Math.random() * 44) }]);
    setForm({ name: "", length: "situationship", violations: [] });
  };
  const sort = (bin: "recycle" | "hazard") => {
    if (!current) return;
    setExes(xs => xs.map(x => x.id === current.id ? { ...x, bin } : x));
    if (active < exes.length - 1) setActive(active + 1);
  };
  const beginAppeal = (ex: Ex) => {
    setAppeal(ex); setVerdict("loading");
    setTimeout(() => setVerdict(Math.random() < .1 ? "granted" : "guilty"), 3000);
  };
  const closeAppeal = () => {
    if (appeal && verdict === "granted") setExes(xs => xs.map(x => x.id === appeal.id ? { ...x, bin: "recycle" } : x));
    setAppeal(null);
  };
  const startSchool = (ex: Ex) => { setSchoolEx(ex); setStep("school"); setLesson(0); setQuestion(0); setAnswers([]); setReveal(false); setTimeout(() => setLesson(1), 950); setTimeout(() => setLesson(2), 1900); setTimeout(() => setLesson(3), 2850); setTimeout(() => setLesson(4), 3800); };
  const answer = (n: number) => { setAnswers([...answers, n]); if (question < 2) setQuestion(question + 1); else setReveal(true); };
  const certificateNo = useMemo(() => `EX-2026-${String(Math.floor(10000 + Math.random() * 89999))}`, [schoolEx]);

  return <main>
    {step !== "landing" && step !== "final" && <Header step={step} reset={reset} />}
    <AnimatePresence mode="wait">
      {step === "landing" && <motion.section className="landing page" key="landing" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,y:-20}}>
        <div className="float f1">🚩</div><div className="float f2">🗑️</div><div className="float f3">🚩</div><div className="float f4">♻️</div>
        <nav><div className="brand"><span>♻</span> TRASH YOUR EX</div><div><span className="official">OFFICIAL SATIRE</span><button className="textbtn" onClick={() => setStep("add")}>File a report →</button></div></nav>
        <motion.div className="hero" initial={{scale:.94,y:20}} animate={{scale:1,y:0}} transition={{type:"spring",duration:.8}}>
          <div className="eyebrow">UNITED STATES DEPARTMENT OF DATING</div>
          <div className="heroSeal"><Seal /></div>
          <h1>Trash Your <em>Ex.</em></h1>
          <p className="tagline">Because therapy is expensive.</p>
          <p className="sub">America’s first emotionally responsible waste management service.<br/>Sort your past. Clear your future. No permit required.</p>
          <motion.button whileHover={{scale:1.04}} whileTap={{scale:.96}} className="primary huge" onClick={() => setStep("add")}>START CLEANING <b>→</b></motion.button>
          <div className="counter"><span>●</span> <b>12,438</b> emotionally hazardous individuals properly disposed.</div>
        </motion.div>
        <div className="ticker">EPA CERTIFIED*　·　100% SATIRICAL　·　NO EXES WERE HARMED　·　GROUP CHAT APPROVED　·　EPA CERTIFIED*</div>
      </motion.section>}

      {step === "add" && <motion.section className="page content" key="add" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}}>
        <div className="stepLabel">FORM EX-01 · INTAKE</div><h2>Declare your <em>emotional waste.</em></h2><p className="lede">Provide identifying details for proper disposal. Your data stays on this device—unlike your ex.</p>
        <div className="formCard">
          <div className="formHead"><div><span>OFFICIAL INTAKE FORM</span><b>CASE #{String(exes.length + 1).padStart(4,"0")}</b></div><Seal /></div>
          <label>LEGAL(ISH) NAME<input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="e.g. Kevin" /></label>
          <label>RELATIONSHIP CLASSIFICATION<select value={form.length} onChange={e => setForm({...form,length:e.target.value})}><option>situationship</option><option>dated</option><option>relationship</option><option>almost dated</option></select></label>
          <fieldset><legend>SELECT ALL DOCUMENTED VIOLATIONS</legend><div className="checks">{violations.map(v => <button type="button" key={v} className={form.violations.includes(v) ? "checked" : ""} onClick={() => setForm({...form, violations: form.violations.includes(v) ? form.violations.filter(x=>x!==v) : [...form.violations,v]})}><i>{form.violations.includes(v) ? "✓" : ""}</i>{v}</button>)}</div></fieldset>
          <button className="primary full" disabled={!form.name.trim()} onClick={addEx}>ADD TO CASE FILE ＋</button>
        </div>
        {exes.length > 0 && <div className="caseTray"><div><b>{exes.length} SUBJECT{exes.length>1?"S":""} READY</b><span>{exes.map(x=>x.name).join(" · ")}</span></div><button className="secondary" onClick={()=>setStep("sort")}>BEGIN SORTING →</button></div>}
      </motion.section>}

      {step === "sort" && <motion.section className="page sortPage" key="sort" initial={{opacity:0}} animate={{opacity:1}}>
        <div className="stepLabel">PHASE 02 · MATERIAL SORTING</div><h2>Where do they <em>belong?</em></h2><p className="lede">Drag the evidence—or use the disposal buttons. Trust your gut. The EPA does.</p>
        {current && !current.bin ? <div className="sortStage">
          <Bin type="recycle" onDrop={()=>sort("recycle")} />
          <motion.div className="exCard" drag dragSnapToOrigin onDragEnd={(_,info)=> { if(info.offset.x < -120) sort("recycle"); if(info.offset.x > 120) sort("hazard"); }} whileDrag={{scale:1.08,rotate:3,boxShadow:"0 28px 60px #142a2144"}}>
            <div className="cardTop"><span>CASE FILE</span><b>#{String(active+1).padStart(3,"0")}</b></div><div className="avatar">{current.avatar}</div><h3>{current.name}</h3><span className="relation">{current.length.toUpperCase()}</span><div className="flags">{"🚩".repeat(Math.min(current.violations.length,5))}</div><div className="chips">{current.violations.slice(0,3).map(v=><span key={v}>{v}</span>)}</div><div className="score"><span>RED FLAG SCORE</span><b>{current.score}</b></div>
          </motion.div>
          <Bin type="hazard" onDrop={()=>sort("hazard")} />
        </div> : <div className="complete"><div>✓</div><h3>Sorting complete.</h3><p>All emotional materials have been properly classified.</p><button className="primary" onClick={()=>setStep("court")}>PROCEED TO TRAFFIC COURT →</button></div>}
        <div className="sortCount">{exes.filter(x=>x.bin).length} OF {exes.length} ITEMS PROCESSED</div>
      </motion.section>}

      {step === "court" && <motion.section className="page content court" key="court" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}}>
        <div className="stepLabel red">PHASE 03 · COURT OF ROMANTIC APPEALS</div><h2>Order in the <em>court.</em></h2><p className="lede">Hazardous subjects may file exactly one extremely unserious appeal.</p>
        <div className="courtBanner"><span>⚖</span><div><b>THE HONORABLE INTERNET PRESIDING</b><small>All verdicts are final-ish.</small></div><strong>{hazards.length} CASE{hazards.length===1?"":"S"} ON DOCKET</strong></div>
        <div className="docket">{hazards.length ? hazards.map((x,i)=><div className="docketCard" key={x.id}><div className="caseNum">CASE #2026-{String(i+1).padStart(3,"0")}</div><div className="miniAvatar">{x.avatar}</div><div className="docketInfo"><h3>{x.name}</h3><p><b>PRIMARY VIOLATION</b><br/>{x.violations[0] || "Failure to communicate"}</p><span>STATUS: GUILTY PENDING APPEAL</span></div><button className="appeal" onClick={()=>beginAppeal(x)}>⚖ APPEAL CONVICTION</button></div>) : <div className="empty"><b>NO HAZARDOUS CASES</b><p>The court is stunned by your excellent judgment.</p></div>}</div>
        <button className="primary proceed" onClick={()=> hazards[0] ? startSchool(hazards[0]) : setStep("final")}>{hazards.length ? "CONTINUE TO REHABILITATION" : "COMPLETE DISPOSAL"} →</button>
      </motion.section>}

      {step === "school" && <motion.section className="page school" key="school" initial={{opacity:0}} animate={{opacity:1}}>
        {!reveal && lesson < 4 ? <div className="lesson"><div className="schoolSign">EX TRAFFIC SCHOOL<small>AUTHORIZED REMEDIAL ROMANCE PROGRAM</small></div><div className="deskAvatar">{schoolEx?.avatar}</div><h2>{["Learning empathy...","Practicing communication...","Deleting “u up?” drafts...","Watching one TED Talk..."][lesson]}</h2><div className="loading"><motion.i initial={{width:"5%"}} animate={{width:`${(lesson+1)*25}%`}} /></div><p>COURSE PROGRESS · {(lesson+1)*25}%</p></div> : !reveal ? <div className="quiz"><div className="stepLabel">FINAL EXAM · QUESTION {question+1} OF 3</div><h2>{quiz[question].q}</h2><div className="answers">{quiz[question].a.map((a,i)=><motion.button key={a} whileHover={{x:8}} onClick={()=>answer(i)}><b>{String.fromCharCode(65+i)}</b>{a}<span>→</span></motion.button>)}</div><small>Choose the emotionally available answer. We believe in you.</small></div> : <div className="results"><motion.div className="stamp" initial={{scale:2,rotate:-30,opacity:0}} animate={{scale:1,rotate:-8,opacity:1}}>PASSED</motion.div><div className="eyebrow">DEPARTMENT OF DATING</div><h2>Against all odds,<br/><em>they learned something.</em></h2><p>{schoolEx?.name} scored {answers.filter((a,i)=>a===quiz[i].correct).length}/3. The grading curve was emotionally generous.</p><button className="primary" onClick={()=>setStep("certificate")}>ISSUE CERTIFICATE →</button></div>}
      </motion.section>}

      {step === "certificate" && <motion.section className="page certificatePage" key="certificate" initial={{opacity:0}} animate={{opacity:1}}>
        <div className="confetti">✦　·　✧　★　·　✦　·　★　✧　·　✦</div><div className="certWrap"><motion.div className="certificate" initial={{scale:.85,rotate:-2}} animate={{scale:1,rotate:0}}><div className="certBorder"><div className="certTop"><Seal /><div><b>UNITED STATES DEPARTMENT OF DATING</b><small>BUREAU OF EMOTIONAL REHABILITATION</small></div><span>FORM EX-420</span></div><h4>CERTIFICATE OF RECYCLABILITY</h4><p>This official-ish document certifies that</p><h2>{schoolEx?.name.toUpperCase() || "THE DEFENDANT"}</h2><p>has successfully completed</p><h3>EX TRAFFIC SCHOOL</h3><div className="certStatus">♻ CERTIFIED RECYCLABLE</div><div className="certMeta"><span>CERTIFICATE NUMBER<b>{certificateNo}</b></span><span>VALID UNTIL<b>NEXT SITUATIONSHIP</b></span><span>AUTHORITY<b>THE GROUP CHAT</b></span></div><div className="signature">Illegible Signature<small>SECRETARY OF EMOTIONAL SANITATION</small></div></div></motion.div><div className="certActions"><button className="secondary" onClick={()=>window.print()}>↓ DOWNLOAD CERTIFICATE</button><button className="primary" onClick={()=>navigator.clipboard?.writeText("I rehabilitated my ex. They are now Certified Recyclable ♻")}>SHARE THE MIRACLE ↗</button></div><button className="textbtn" onClick={()=>setStep("final")}>Finish cleanup →</button></div>
      </motion.section>}

      {step === "final" && <motion.section className="page finale" key="final" initial={{opacity:0}} animate={{opacity:1}}>
        {!reveal ? <motion.div className="celebrate" onAnimationComplete={()=>setTimeout(()=>setReveal(true),3000)} animate={{}}><div className="truck">🚛<span>YOUR BAGGAGE</span></div><div className="party">🎉　✨　🎊　✨　🎉</div><h1>Congratulations.</h1><p>You successfully took out the trash.</p></motion.div> : <motion.div className="twist" initial={{backgroundColor:"#f4f1e9"}} animate={{backgroundColor:"#141716"}} transition={{duration:2}}><p>Unfortunately...</p><h2>The only profile left<br/>is <em>yours.</em></h2><motion.div className="self" animate={{x:[0,30,80],rotate:[0,4,12]}} transition={{duration:3}}>YOU<div>🙂</div></motion.div><div className="finalBin">🗑️</div><button className="primary" onClick={reset}>START SELF IMPROVEMENT →</button><small>No people were harmed. Please recycle responsibly.</small></motion.div>}
      </motion.section>}
    </AnimatePresence>
    {appeal && <div className="modalShade"><motion.div className="modal" initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}}><button className="close" onClick={()=>setAppeal(null)}>×</button><Seal /><div className="stepLabel red">COURT OF ROMANTIC APPEALS</div><h2>Traffic Court</h2>{verdict === "loading" ? <><p>The defendant believes they were misunderstood.</p><div className="summon">Summoning 12 internet strangers...</div><div className="jury">{jury.map((j,i)=><motion.span key={j} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.35}}>{j}</motion.span>)}</div><div className="loading"><motion.i animate={{width:"100%"}} transition={{duration:3}} /></div></> : <><motion.div className={`verdict ${verdict}`} initial={{scale:1.8,rotate:-20,opacity:0}} animate={{scale:1,rotate:-7,opacity:1}}>{verdict === "guilty" ? "STILL TRASH" : "APPEAL GRANTED"}</motion.div><div className="judgment"><span>DEFENDANT<b>{appeal.name}</b></span><span>VERDICT<b>{verdict === "guilty" ? "GUILTY" : "RECYCLABLE"}</b></span><span>SENTENCE<b>{verdict === "guilty" ? "REMAIN IN HAZARDOUS WASTE" : "SECOND CHANCE ISSUED"}</b></span></div><button className="primary full" onClick={closeAppeal}>COURT ADJOURNED</button></>}</motion.div></div>}
  </main>;
}

function Bin({type,onDrop}:{type:"recycle"|"hazard";onDrop:()=>void}) {
  const green = type === "recycle";
  return <motion.button className={`bin ${type}`} onClick={onDrop} whileHover={{scale:1.03,y:-4}} whileTap={{scale:.96}}><div className="binTag">{green ? "APPROVED MATERIAL" : "HANDLE WITH CARE"}</div><div className="lid"/><div className="binBody"><span>{green ? "♻" : "☣"}</span><b>{green ? "RECYCLABLE" : "NON-RECYCLABLE"}</b><small>{green ? "May survive another relationship." : "EPA approval required."}</small></div><em>{green ? "DROP HERE" : "DISPOSE HERE"}</em></motion.button>;
}
