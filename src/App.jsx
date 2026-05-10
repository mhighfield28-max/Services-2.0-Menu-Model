import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const RATE = 113;
const YRS = [1,2,3,4,5];
const fmt = n => "$" + Math.round(n).toLocaleString();
const fmtK = n => n >= 1000 ? "$" + (n/1000).toFixed(0) + "k" : "$" + Math.round(n);
const modPrice = (mod, pct) => (mod.hours||0) * RATE * (1+pct/100);

const FTE_BANDS = [
  { label:"Select FTE Band", value:"" },
  { label:"1-2,001 FTE", value:"1-2001", softTCV:180000 },
  { label:"2,001-4,001 FTE", value:"2001-4001", softTCV:320000 },
  { label:"4,001-8,001 FTE", value:"4001-8001", softTCV:480000 },
  { label:"8,001-15,001 FTE", value:"8001-15001", softTCV:680000 },
  { label:"15,001-25,001 FTE", value:"15001-25001", softTCV:921883 },
  { label:"25,001-50,001 FTE", value:"25001-50001", softTCV:1400000 },
  { label:"50,001+ FTE", value:"50001+", softTCV:2094721 },
];

const DOMAINS = [
  { id:"adoption", name:"Adoption, Change & Faculty Enablement", type:"included", color:"#0369a1", bg:"#e0f2fe", border:"#bae6fd", hourCap:999, desc:"Drives platform-wide adoption through structured professional development, faculty enablement campaigns, and change management support -- ensuring instructors engage confidently and consistently with Blackboard.", access:{Core:"selectable",Advanced:"selectable",Enterprise:"selectable"} },
  { id:"technical", name:"Technical & Integration Assurance", type:"included", color:"#0f766e", bg:"#ccfbf1", border:"#99f6e4", hourCap:999, desc:"Maintains the technical health of the Blackboard environment through proactive monitoring of SSO, grade passback, and integration pipelines -- minimising disruption and protecting the reliability of the platform.", access:{Core:"selectable",Advanced:"selectable",Enterprise:"selectable"} },
  { id:"accessibility", name:"Accessibility & Inclusion", type:"included", color:"#7c3aed", bg:"#f3e8ff", border:"#e9d5ff", hourCap:40, desc:"Reduces institutional risk and improves the learning experience by identifying, reporting on, and remediating accessibility issues across course content -- supporting compliance obligations and inclusive design standards.", access:{Core:"selectable",Advanced:"selectable",Enterprise:"selectable"} },
  { id:"outcomes", name:"Outcomes & Institutional Effectiveness", type:"selectable", color:"#b45309", bg:"#fef3c7", border:"#fde68a", hourCap:40, desc:"Activates Blackboard Outcomes -- included in every LMS licence -- to move institutions from fragmented evidence collection to a unified approach to learning outcomes assessment, curriculum mapping, and accreditation readiness.", access:{Core:"excluded",Advanced:"selectable",Enterprise:"selectable"} },
  { id:"learning", name:"Learning Experience Quality", type:"selectable", color:"#be185d", bg:"#fce7f3", border:"#fbcfe8", hourCap:40, desc:"Improves consistency and standard of course design through structured sampling, quality benchmarking against the Exemplary Course Rubric, and targeted improvement workshops for instructional staff.", access:{Core:"excluded",Advanced:"choice",Enterprise:"selectable"} },
  { id:"analytics", name:"Data, Analytics & Student Success", type:"selectable", color:"#1d4ed8", bg:"#dbeafe", border:"#bfdbfe", hourCap:40, desc:"Unlocks the value of Blackboard Illuminate to surface actionable insight on student engagement, at-risk identification, and outcome achievement -- enabling data-informed decisions at course, programme, and institutional level.", access:{Core:"excluded",Advanced:"choice",Enterprise:"selectable"} },
];

const ANCHOR_MODULES = [
  { id:"anc-pda", name:"Blackboard PD Access (All Learning Paths)", domain:"adoption", anchorTiers:["Core","Advanced","Enterprise"], hours:20, desc:"Unlimited access to all Blackboard PD learning paths: Digital Accessibility, System Admin, Learning Experience Design, Workforce Learning.", kpis:["Instructor Active Rate >=80%","CSAT uplift"], note:"Mandatory all tiers" },
];

const STANDARD_MODULES = [
  { id:"anc-ai-policy", name:"AI in Teaching: Responsible Use & Policy Workshop", domain:"adoption", hours:20, desc:"Facilitated workshop to develop institutional AI policy for teaching, configure Blackboard AI features responsibly, and equip faculty with academic integrity safeguards.", kpis:["AI policy approved","Faculty AI confidence >=4/5","AI feature activation >=70%"], note:"New" },
  { id:"anc-oh", name:"Office Hours", domain:"adoption", hours:20, desc:"Scheduled consultative office hours for faculty and staff queries, troubleshooting, and guided support. Frequency scales by tier: quarterly (Core) to monthly (Enterprise).", kpis:["Support tickets -10% by month 3","CSAT uplift"] },
  { id:"anc-cbw", name:"Cohort Booster Workshops", domain:"adoption", hours:20, desc:"Facilitated group workshops to reinforce adoption and drive engagement across faculty cohorts. Structured programme with recurring delivery. Up to 6 workshops per year at Enterprise.", kpis:["Instructor Active Rate >=80%","Workshop completion >=85%"] },
  { id:"anc-llsp", name:"Leadership & Learning Strategy Path", domain:"adoption", hours:20, desc:"Access to the Leadership & Learning Strategy PD learning path within Blackboard PD. Equips institutional leaders with frameworks for governance, digital transformation, and learning technology strategy.", kpis:["Governance cadence >=85%","KPI performance reviewed on schedule"] },
  { id:"anc-vgw", name:"Facilitated Vision/Goals Workshop + Report", domain:"adoption", hours:20, desc:"Annual facilitated workshop to review institutional vision, mission, and goals for the learning technology ecosystem, with a written summary report and recommended strategic priorities.", kpis:["Strategic alignment score","Action items closed per cycle"] },
  { id:"anc-kpir", name:"Action Plan & KPI Review Workshop + Report", domain:"adoption", hours:20, desc:"Facilitated workshop to review ongoing action plans and KPIs, with written progress report. Frequency: up to quarterly.", kpis:["KPI performance reviewed on schedule","Action items closed per cycle"] },
  { id:"anc-gam", name:"Grade & Authentication Monitoring Support", domain:"technical", hours:20, desc:"Ongoing monitoring support for grade passback and authentication integrations. Reactive issue support through to proactive monitoring with structured escalation paths.", kpis:["SSO authentication success rate","Mean time to resolve integration issues"] },
  { id:"anc-ihr", name:"Integration Health Report", domain:"technical", hours:20, desc:"Structured integration health report covering system status, error trends, and recommended remediation actions. Includes facilitated review session with technical stakeholders. Frequency scales by tier.", kpis:["Integration job success rate","Error trend reduction","Remediation backlog reduction"] },
  { id:"anc-rps", name:"Remediation Planning & Architecture Review", domain:"technical", hours:20, desc:"Combined facilitated session to review integration issues, plan remediation actions, and conduct a structured review of the integration architecture. Identifies risks, dependencies, and optimisation opportunities.", kpis:["Architecture risk items surfaced","Integration debt reduction","Remediation backlog actioned"] },
  { id:"anc-lti", name:"edTech Ecosystem & LTI Rationalisation Review", domain:"technical", hours:20, desc:"Structured review of the institution's full edTech ecosystem: active LTI integrations, redundant tools, security posture, and strategic alignment. Delivers a prioritised rationalisation roadmap.", kpis:["LTI tools audited and risk-scored","Redundant tool reduction identified","Governance framework documented"], note:"New" },
  { id:"std-aira", name:"AI & Integration Readiness Assessment", domain:"technical", hours:20, desc:"Structured assessment of the institution's technical readiness for AI-powered LMS features and advanced integrations. Covers data pipeline health, API governance, SIS sync quality, and AI feature prerequisites.", kpis:["AI readiness score documented","Data pipeline issues identified","AI feature activation roadmap delivered"], note:"New" },
  { id:"std-ilfw", name:"Illuminate Foundations Workshop", domain:"analytics", hours:20, desc:"Instructor-led workshop covering Illuminate orientation, navigation, core concepts, and initial dashboard configuration. Establishes data literacy baseline for key staff.", kpis:["Staff completing orientation >=90%","Dashboard login rate within 30 days"] },
  { id:"std-irdd", name:"Report Definitions & Data Dictionary", domain:"analytics", hours:20, desc:"Structured walkthrough of standard report definitions, data dictionary, field-level metadata, and data lineage. Ensures consistent interpretation of metrics across departments.", kpis:["Report interpretation consistency >=85%","Data dictionary adoption rate"] },
  { id:"std-ddsr", name:"Dashboard Design & Self-Service Reporting", domain:"analytics", hours:20, desc:"Hands-on workshop enabling staff to build, customise, and share dashboards and self-service reports within Illuminate. Covers filters, visualisations, scheduling, and export.", kpis:["Staff self-service reporting >=60%","Dashboard utilisation (weekly active)"] },
  { id:"std-paari", name:"Predictive Analytics & At-Risk Identification", domain:"analytics", hours:20, desc:"Workshop series on using Illuminate predictive models to identify at-risk student populations. Covers model interpretation, risk scoring, cohort segmentation, and alert configuration.", kpis:["At-risk identification coverage >=80%","False-positive rate reviewed quarterly"] },
  { id:"std-eaiw", name:"Early Alert & Intervention Workflow Design", domain:"analytics", hours:20, desc:"Facilitated session co-designing early intervention workflows triggered by analytics signals. Produces a documented at-risk identification and response playbook with roles, escalation paths, and timing.", kpis:["Intervention workflow documented","Time-to-intervention reduction vs. baseline","At-risk re-engagement rate"] },
  { id:"std-aiaw", name:"AI-Powered Analytics Activation Workshop", domain:"analytics", hours:20, desc:"Workshop on activating and interpreting Illuminate's AI-assisted analytics features. Covers conversational data queries, automated insight surfacing, and embedding AI analytics into institutional decision-making.", kpis:["AI analytics features activated >=80%","Insight-to-action cycle time reduced","Staff confidence >=4/5"], note:"New" },
  { id:"std-swbd", name:"Student Wellbeing & Belonging Dashboard", domain:"analytics", hours:20, desc:"Facilitated workshop to configure and interpret a student wellbeing and belonging dashboard using Illuminate engagement data. Designs pastoral response workflows for at-risk cohorts.", kpis:["Wellbeing cohort identification rate","Pastoral response workflow documented","Staff satisfaction >=4/5"], note:"New" },
  { id:"std-eibr", name:"Executive Insights & Benchmarking Report", domain:"analytics", hours:20, desc:"Periodic narrative analytics report for senior leadership translating platform data into strategic insight. Includes year-on-year comparison and sector peer benchmarking.", kpis:["KPIs vs. institutional goals","Executive satisfaction >=4/5","Y-o-Y comparison delivered"] },
  { id:"std-ops", name:"Outcomes Platform Orientation & Setup", domain:"outcomes", hours:20, desc:"Guided orientation to Blackboard Outcomes: platform navigation, user roles and permissions setup, automated reminder configuration, and evidence collection workflow design.", kpis:["Platform login >=90% within 30 days","User roles configured and documented"] },
  { id:"std-omca", name:"Outcomes Mapping & Curriculum Alignment", domain:"outcomes", hours:20, desc:"Facilitated workshop to define and map learning outcomes from course level through programme level to institutional competencies using Outcomes curriculum mapping tools.", kpis:["Curriculum map coverage >=80% of programmes","Outcome-to-course alignment documented"] },
  { id:"std-adrs", name:"Assessment Design & Rubric Standardisation", domain:"outcomes", hours:20, desc:"Workshop on designing assessments aligned to mapped outcomes. Covers standardised rubric creation, Bloom's Taxonomy alignment, and configuring assessment collection points within the LMS.", kpis:["Rubric standardisation >=70%","Assessment-to-outcome linkage >=80%"] },
  { id:"std-odia", name:"Outcomes Dashboard Interpretation & Action", domain:"outcomes", hours:20, desc:"Training on interpreting Outcomes real-time dashboards: comparative views, longitudinal tracking, disaggregation by demographics, and closing feedback loops toward programme improvement.", kpis:["Dashboard review cadence maintained","Feedback loop actions documented","Stakeholder confidence >=4/5"] },
  { id:"std-arep", name:"Accreditation Reporting & Evidence Preparation", domain:"outcomes", hours:20, desc:"Structured support for generating accreditation-ready evidence packages from Outcomes. Covers report generation, evidence portfolio assembly, and narrative alignment to accreditor standards.", kpis:["Evidence package completeness >=95%","Preparation time reduction vs. manual process"] },
  { id:"std-cbe", name:"Competency-Based Education Framework Workshop", domain:"outcomes", hours:20, desc:"Facilitated workshop to design and implement a CBE framework within Blackboard Outcomes. Covers competency definition, alignment to programme outcomes, assessment mapping, and progress tracking configuration.", kpis:["CBE framework documented and approved","Competency-to-outcome linkage >=80%","Faculty CBE readiness >=4/5"], note:"New" },
  { id:"std-odsa", name:"Outcomes Data Science & Advanced Analysis", domain:"outcomes", hours:20, desc:"Advanced workshop on Outcomes text analytics, Bloom's Taxonomy visualisations, and Insight integration to disaggregate achievement by demographics and compare across programmes.", kpis:["Disaggregated analysis completed","Equity gaps identified and action-planned","Programme-level trend reports delivered"] },
  { id:"std-pdai", name:"Accessibility & Inclusion PD Path", domain:"accessibility", hours:20, desc:"Access to the Digital Accessibility & Inclusion PD learning path within Blackboard PD. Covers WCAG principles, accessible content design, and inclusive teaching practices.", kpis:["Course accessibility threshold >=70%","Faculty completion >=80%"] },
  { id:"std-aapw", name:"Accessibility Audit & Prioritisation Workshop", domain:"accessibility", hours:20, desc:"Institutional accessibility audit of a representative sample of course content, producing a prioritised remediation matrix with ownership and timelines assigned.", kpis:["Critical issues identified and risk-scored","Remediation matrix delivered","Ownership assigned >=90% of issues"] },
  { id:"std-acdc", name:"Accessible Course Design Clinic", domain:"accessibility", hours:20, desc:"Practical faculty-facing clinic supporting instructors to redesign course content for accessibility. Covers alt-text, captions, colour contrast, navigation, and assistive technology compatibility.", kpis:["Courses remediated per clinic >=5","Faculty accessibility confidence >=4/5"], note:"New" },
  { id:"std-ocrr", name:"Accessibility Remediation Sprint", domain:"accessibility", hours:20, desc:"Focused remediation sprint targeting high-priority accessibility issues. Structured as a time-boxed campaign with defined scope, progress tracking, and close-out review.", kpis:["High-severity issues resolved >=80% within sprint","Sprint close-out report delivered"] },
  { id:"std-wcag", name:"WCAG Compliance Monitoring & Reporting", domain:"accessibility", hours:20, desc:"Ongoing WCAG compliance monitoring: periodic scanning, issue triage, regulatory reporting, and continuous improvement recommendations. Produces a compliance dashboard and narrative summary report.", kpis:["WCAG 2.1 AA compliance rate (trending up)","Regulatory report delivered on schedule","Critical issues resolved within SLA >=90%"], note:"New" },
  { id:"std-pdled", name:"Learning Experience Design PD Path", domain:"learning", hours:20, desc:"Access to the Learning Experience Design & Delivery PD learning path within Blackboard PD. Covers instructional design principles, active learning, and digital course design best practices.", kpis:["% courses meeting ECR standard","Faculty LXD completion >=80%"] },
  { id:"std-csrhc", name:"Course Quality Audit & Health Check", domain:"learning", hours:20, desc:"Sample-based course quality report against Blackboard ECR standards reviewing 10 courses with structured findings and recommendations.", kpis:["% sampled courses meeting ECR standard","Navigation confusion tickets -20%"] },
  { id:"std-cdciw", name:"Course Design Improvement Workshop", domain:"learning", hours:20, desc:"Facilitated cohort workshop for 6-8 instructors applying course quality findings to improve specific courses. Hands-on format with peer review, live redesign, and structured follow-up.", kpis:["Template compliance >=80%","Courses improved per cohort >=6"] },
  { id:"std-ctds", name:"Course Template Design Sprint", domain:"learning", hours:20, desc:"Co-designed sprint to create 2-3 reusable Blackboard course templates aligned to the institution's pedagogical standards. Delivers ready-to-deploy, ECR-aligned templates.", kpis:["Templates deployed >=2","Faculty adoption >=60% within term"], note:"New" },
  { id:"std-aicd", name:"AI-Assisted Content Design Workshop", domain:"learning", hours:20, desc:"Practical workshop equipping instructors to use Blackboard's AI Design Assistant to create quiz items, generate content outlines, and produce accessible course materials.", kpis:["AI tools adopted >=80%","Content design time reduction"], note:"New" },
  { id:"std-mcdb", name:"Micro-credential & Digital Badge Strategy Workshop", domain:"learning", hours:20, desc:"Facilitated workshop to design an institutional micro-credential and digital badging strategy: badge taxonomy, learning pathway design, employer alignment, and LMS integration.", kpis:["Micro-credential framework approved","First badge cohort issued within 90 days"], note:"New" },
];

const ALL_MODULES = [...ANCHOR_MODULES, ...STANDARD_MODULES];

const PROFILER_QUESTIONS = [
  {
    id: "q1", label: "What is the institution's approximate student headcount?", multi: false,
    options: [
      { value: "a", label: "Under 5,000", tier: "Core" },
      { value: "b", label: "5,000 to 20,000", tier: "Advanced" },
      { value: "c", label: "Over 20,000", tier: "Enterprise" }
    ]
  },
  {
    id: "q2", label: "How is the institution structured?", multi: false,
    options: [
      { value: "a", label: "Single campus, centrally managed", tier: "Core" },
      { value: "b", label: "Multi-department with some faculty autonomy", tier: "Advanced" },
      { value: "c", label: "Multi-campus, federated or system-level", tier: "Enterprise" }
    ]
  },
  {
    id: "q3", label: "Where are they in their Blackboard LMS journey?", multi: false,
    options: [
      { value: "a", label: "Recently implemented or mid-migration to Ultra", tier: "Core" },
      { value: "b", label: "Established but adoption is inconsistent across faculties", tier: "Advanced" },
      { value: "c", label: "Mature implementation - looking for strategic optimisation", tier: "Enterprise" }
    ]
  },
  {
    id: "q4", label: "How would you describe their internal change capability?", multi: false,
    options: [
      { value: "a", label: "Limited - they rely heavily on external support", tier: "Core" },
      { value: "b", label: "Mixed - some internal resource but clear gaps", tier: "Advanced" },
      { value: "c", label: "Strong internally - they need strategic overlay, not delivery", tier: "Enterprise" }
    ]
  },
  {
    id: "q5", label: "What are their most pressing pain points right now? (select up to 2)", multi: true,
    options: [
      { value: "a", label: "Inconsistent staff adoption of the LMS", tier: "Core", domain: "adoption" },
      { value: "b", label: "Upcoming accessibility audit or compliance pressure", tier: "Advanced", domain: "accessibility", prePopId: "std-aapw" },
      { value: "c", label: "Accreditation review requiring outcomes evidence", tier: "Advanced", domain: "outcomes", prePopId: "std-ops" },
      { value: "d", label: "Student retention - need early intervention data", tier: "Enterprise", domain: "analytics", prePopId: "std-ilfw" },
      { value: "e", label: "Course quality inconsistency across faculties", tier: "Advanced", domain: "learning", prePopId: "std-csrhc" },
      { value: "f", label: "EdTech sprawl - too many tools, poor LTI governance", tier: "Enterprise", domain: "technical" }
    ]
  },
  {
    id: "q6", label: "What kind of engagement model fits this account?", multi: false,
    options: [
      { value: "a", label: "Targeted - help with specific, defined problems", tier: "Core" },
      { value: "b", label: "Structured programme - clear deliverables over 2-3 years", tier: "Advanced" },
      { value: "c", label: "Strategic partnership - Blackboard embedded in their planning", tier: "Enterprise" }
    ]
  },
  {
    id: "q7", label: "What does their leadership's 3-year vision look like?", multi: false,
    options: [
      { value: "a", label: "Operational confidence - staff competent, LMS running well", tier: "Core" },
      { value: "b", label: "Sector recognition - internal excellence, cited in quality reviews", tier: "Advanced" },
      { value: "c", label: "Sector leadership - they want to be a reference institution", tier: "Enterprise" }
    ]
  }
];

const TIER_ANNUAL_PRICE = { "No Services":0, Core:5000, Advanced:13500, Enterprise:32500 };
const TIER_ANCHOR_HRS = { "No Services":0, Core:20, Advanced:20, Enterprise:20 };
const TIER_SELECTABLE_HRS = { "No Services":0, Core:60, Advanced:140, Enterprise:260 };
const TIER_TOTAL_HRS = { "No Services":0, Core:80, Advanced:160, Enterprise:280 };
const DOMAIN_HOUR_CAP = 999;
const DOMAIN_SUMMARY = { Core:3, Advanced:5, Enterprise:6 };
const getAnchors = t => ANCHOR_MODULES.filter(m => m.anchorTiers.includes(t));
const getSelectableDomains = (tier, advChoice) => {
  if (!tier || tier === "No Services") return [];
  return DOMAINS.filter(d => {
    const a = d.access[tier];
    if (a === "excluded" || a === "anchor") return false;
    if (a === "choice") return !advChoice || advChoice === d.id;
    return true;
  }).map(d => d.id);
};

const AC = {
  profit: { label:"Profit Centre", pct:40, disp:"40%", icon:"P", tagline:"Standard list -- 40% delivery margin", color:"#0369a1", bg:"#e0f2fe", border:"#bae6fd", features:["Services at standard list price","40% delivery margin applied","Full cost recovery + margin","Recommended for commercial engagements"] },
  cost:   { label:"Cost Centre",   pct:0,  disp:"0%",  icon:"C", tagline:"Delivery cost -- margin absorbed", color:"#0054BC", bg:"#e8f0fc", border:"#a8c4f5", features:["Services at delivery cost only","Margin absorbed internally","Used when IT/IS funds services","Maximises adoption of service bundle"] },
  value:  { label:"Value Centre",  pct:5,  disp:"5%",  icon:"V", tagline:"Near-cost -- maximise volume and adoption", color:"#7c3aed", bg:"#f3e8ff", border:"#e9d5ff", features:["Services at near-cost price","5% margin applied","Maximises uptake across institution","For strategic adoption-led engagements"] },
};

// -- SMALL COMPONENTS ----------------------------------------------------------

function TierProfiler({ onComplete, onSkip }) {
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState("questions");
  const [override, setOverride] = useState(false);
  const [overrideTier, setOverrideTier] = useState("Core");
  const [overrideReason, setOverrideReason] = useState("");

  const allAnswered = PROFILER_QUESTIONS.every(q =>
    q.multi ? (answers[q.id] && answers[q.id].length > 0) : !!answers[q.id]
  );

  function calcRecommendedTier(ans) {
    const scores = { Core: 0, Advanced: 0, Enterprise: 0 };
    ["q1","q2","q3","q4","q6","q7"].forEach(qid => {
      if (ans[qid] && ans[qid].tier) scores[ans[qid].tier]++;
    });
    if (ans.q5) ans.q5.forEach(opt => { if (opt.tier) scores[opt.tier]++; });
    if (scores.Enterprise >= 4) return "Enterprise";
    if (scores.Enterprise >= 2 || scores.Advanced >= 4) return "Advanced";
    return "Core";
  }

  function buildRationale(ans, tier) {
    const pts = [];
    if (ans.q2) pts.push(ans.q2.label.toLowerCase());
    if (ans.q3) pts.push(ans.q3.label.toLowerCase());
    if (ans.q4) pts.push(ans.q4.label.toLowerCase());
    const pp = ans.q5 ? ans.q5.map(o => o.label) : [];
    const tDesc = {
      Core: "a targeted Core engagement",
      Advanced: "an Advanced structured programme",
      Enterprise: "a full Enterprise strategic partnership"
    };
    let r = "Based on this account profile";
    if (pts.length > 0) r += " - " + pts.slice(0,2).join("; ");
    r += " - we recommend " + tDesc[tier] + ".";
    if (pp.length > 0) r += " Pain points flagged: " + pp.join(" and ") + ".";
    return r;
  }

  function calcPrePopMods(ans, t) {
    if (!ans.q5) return [];
    return ans.q5
      .filter(opt => opt.prePopId)
      .map(opt => opt.prePopId)
      .filter(id => {
        const mod = ALL_MODULES.find(m => m.id === id);
        if (!mod) return false;
        const dom = DOMAINS.find(d => d.id === mod.domain);
        return dom && dom.access[t] && dom.access[t] !== "excluded";
      });
  }

  function toggleQ5(opt) {
    const current = answers.q5 || [];
    const exists = current.find(o => o.value === opt.value);
    if (exists) {
      setAnswers(p => ({...p, q5: current.filter(o => o.value !== opt.value)}));
    } else if (current.length < 2) {
      setAnswers(p => ({...p, q5: [...current, opt]}));
    }
  }

  const recommendedTier = allAnswered ? calcRecommendedTier(answers) : null;
  const finalTier = override ? overrideTier : recommendedTier;
  const prePopMods = finalTier ? calcPrePopMods(answers, finalTier) : [];
  const rationale = recommendedTier ? buildRationale(answers, recommendedTier) : "";

  function handleConfirm() {
    onComplete({ tier: finalTier, prePopMods, recommendedTier, overrideReason: override ? overrideReason : null });
  }

  const PCOLS = { Core:"#0054BC", Advanced:"#0E387C", Enterprise:"#051836" };

  if (phase === "result") {
    return (
      <div style={{maxWidth:700,margin:"0 auto",padding:"24px 0"}}>
        <button onClick={()=>setPhase("questions")} style={{background:"none",border:"none",cursor:"pointer",color:"#0054BC",fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:1,display:"flex",alignItems:"center",gap:4,padding:0,marginBottom:20}}>
          <span style={{fontSize:13}}>&#8592;</span> Edit Answers
        </button>

        <div style={{background:"linear-gradient(135deg,#051836,#0E387C)",borderRadius:14,padding:"24px 28px",marginBottom:16,color:"#fff"}}>
          <p style={{fontSize:8,fontWeight:900,color:"#4196ff",textTransform:"uppercase",letterSpacing:2,margin:"0 0 14px"}}>Tier Recommendation</p>
          <div style={{display:"flex",alignItems:"flex-start",gap:20,marginBottom:prePopMods.length>0?18:0}}>
            <div style={{background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"14px 22px",border:"2px solid rgba(255,255,255,0.2)",flexShrink:0,textAlign:"center"}}>
              <p style={{fontSize:22,fontWeight:900,color:"#fff",margin:0,letterSpacing:-0.5}}>{recommendedTier}</p>
            </div>
            <p style={{fontSize:11,color:"#e2e8f0",lineHeight:1.7,margin:0,flex:1}}>{rationale}</p>
          </div>
          {prePopMods.length > 0 && (
            <div style={{borderTop:"1px solid rgba(255,255,255,0.15)",paddingTop:14}}>
              <p style={{fontSize:8,fontWeight:900,color:"#C8DA2B",textTransform:"uppercase",letterSpacing:1.5,margin:"0 0 8px"}}>Modules pre-loaded into Year 1 from pain points</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {prePopMods.map(id => {
                  const mod = ALL_MODULES.find(m => m.id === id);
                  return mod ? (
                    <span key={id} style={{background:"rgba(200,218,43,0.15)",border:"1px solid rgba(200,218,43,0.35)",borderRadius:6,padding:"4px 10px",fontSize:9,color:"#C8DA2B",fontWeight:700}}>{mod.name}</span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{background:"#fff",borderRadius:12,border:"1px solid #a8c4f5",padding:"16px 20px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <p style={{fontSize:11,fontWeight:900,color:"#051836",margin:"0 0 2px"}}>Override recommendation</p>
              <p style={{fontSize:9,color:"#64748b",margin:0}}>Use only when commercial or relationship factors apply</p>
            </div>
            <button onClick={()=>setOverride(o=>!o)} style={{padding:"6px 14px",border:`1.5px solid ${override?"#0054BC":"#e2e8f0"}`,borderRadius:8,background:override?"#e8f0fc":"#fff",color:override?"#0054BC":"#94a3b8",fontSize:9,fontWeight:900,cursor:"pointer",textTransform:"uppercase",letterSpacing:1}}>
              {override?"Override On":"Override"}
            </button>
          </div>
          {override && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
              <div>
                <p style={{fontSize:8,fontWeight:700,color:"#94a3b8",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:1}}>Select tier</p>
                {["Core","Advanced","Enterprise"].map(t => (
                  <button key={t} onClick={()=>setOverrideTier(t)} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 12px",marginBottom:5,borderRadius:8,border:`2px solid ${overrideTier===t?PCOLS[t]:"#e2e8f0"}`,background:overrideTier===t?`${PCOLS[t]}15`:"#fff",color:overrideTier===t?PCOLS[t]:"#64748b",fontSize:10,fontWeight:900,cursor:"pointer"}}>
                    {t}
                  </button>
                ))}
              </div>
              <div>
                <p style={{fontSize:8,fontWeight:700,color:"#94a3b8",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:1}}>Reason (internal only)</p>
                {["Budget constraint","Existing relationship - starting lower","Customer preference","Phased approach to recommended tier","Other"].map(r => (
                  <button key={r} onClick={()=>setOverrideReason(r)} style={{display:"block",width:"100%",textAlign:"left",padding:"7px 10px",marginBottom:4,borderRadius:6,border:`1.5px solid ${overrideReason===r?"#0054BC":"#e2e8f0"}`,background:overrideReason===r?"#e8f0fc":"#fff",color:overrideReason===r?"#0054BC":"#64748b",fontSize:8,fontWeight:700,cursor:"pointer"}}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onSkip} style={{padding:"10px 18px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,color:"#64748b",fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:1,cursor:"pointer"}}>
            Skip - Select tier manually
          </button>
          <button onClick={handleConfirm} disabled={override&&!overrideReason} style={{padding:"10px 26px",background:override&&!overrideReason?"#e2e8f0":"linear-gradient(135deg,#0054BC,#0DAC41)",border:"none",borderRadius:10,color:override&&!overrideReason?"#94a3b8":"#fff",fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:1,cursor:override&&!overrideReason?"not-allowed":"pointer"}}>
            Confirm - Load {finalTier} Tier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{maxWidth:700,margin:"0 auto",padding:"24px 0"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:18,fontWeight:900,color:"#051836",margin:"0 0 5px"}}>Account Profiler</h2>
        <p style={{fontSize:11,color:"#64748b",margin:0}}>Answer all 7 questions to generate a tier recommendation with modules pre-loaded from the account's pain points.</p>
      </div>

      {PROFILER_QUESTIONS.map((q, qi) => {
        const answered = q.multi ? (answers[q.id] && answers[q.id].length > 0) : !!answers[q.id];
        const colCount = q.multi ? "1fr 1fr 1fr" : "1fr 1fr 1fr";
        return (
          <div key={q.id} style={{background:"#fff",borderRadius:12,border:`1.5px solid ${answered?"#0054BC":"#e2e8f0"}`,padding:"16px 20px",marginBottom:10,transition:"border-color 0.2s",boxShadow:answered?"0 2px 8px rgba(0,84,188,0.08)":"none"}}>
            <p style={{fontSize:10,fontWeight:900,color:"#051836",margin:"0 0 12px",lineHeight:1.4,display:"flex",alignItems:"flex-start",gap:10}}>
              <span style={{fontSize:7,fontWeight:900,color:"#0054BC",background:"#e8f0fc",padding:"2px 7px",borderRadius:4,textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap",flexShrink:0,marginTop:1}}>Q{qi+1}</span>
              {q.label}
            </p>
            <div style={{display:"grid",gridTemplateColumns:colCount,gap:8}}>
              {q.options.map(opt => {
                const isSelected = q.multi
                  ? (answers[q.id] && answers[q.id].find(o => o.value === opt.value))
                  : (answers[q.id] && answers[q.id].value === opt.value);
                const maxReached = q.multi && (answers[q.id]||[]).length >= 2 && !isSelected;
                return (
                  <button
                    key={opt.value}
                    disabled={maxReached}
                    onClick={() => { q.multi ? toggleQ5(opt) : setAnswers(p => ({...p, [q.id]: opt})); }}
                    style={{padding:"10px 12px",borderRadius:8,border:`2px solid ${isSelected?"#0054BC":"#e2e8f0"}`,background:isSelected?"#e8f0fc":maxReached?"#fafafa":"#fff",color:isSelected?"#0054BC":maxReached?"#cbd5e1":"#475569",fontSize:9,fontWeight:isSelected?900:600,cursor:maxReached?"not-allowed":"pointer",textAlign:"left",lineHeight:1.4,opacity:maxReached?0.5:1,transition:"all 0.15s"}}
                  >
                    {isSelected&&<span style={{fontSize:7,display:"block",color:"#0054BC",fontWeight:900,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>Selected</span>}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16}}>
        <button onClick={onSkip} style={{padding:"10px 18px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,color:"#64748b",fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:1,cursor:"pointer"}}>
          Skip profiler
        </button>
        <button disabled={!allAnswered} onClick={()=>setPhase("result")} style={{padding:"10px 26px",background:allAnswered?"linear-gradient(135deg,#051836,#0E387C)":"#e2e8f0",border:"none",borderRadius:10,color:allAnswered?"#fff":"#94a3b8",fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:1,cursor:allAnswered?"pointer":"not-allowed"}}>
          {allAnswered ? "See Recommendation" : "Answer all questions to continue"}
        </button>
      </div>
    </div>
  );
}

function ModCard({ mod, type, onRemove }) {
  const [exp, setExp] = useState(false);
  const dom = DOMAINS.find(d => d.id === mod.domain);
  const isAnc = type === "anchor";
  const bg = isAnc ? (dom?.bg || "#e0f2fe") : "#fff";
  const bdr = isAnc ? (dom?.border || "#bae6fd") : "#e2e8f0";
  const col = isAnc ? (dom?.color || "#0369a1") : "#0E387C";
  return (
    <div style={{background:bg,border:`1px solid ${bdr}`,borderRadius:10,overflow:"hidden",marginBottom:6,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",gap:6,padding:"8px 10px"}}>
        <div style={{flex:1}}>
          {isAnc && <span style={{fontSize:7,fontWeight:900,background:dom?.bg||"#e0f2fe",color:dom?.color||"#0369a1",padding:"2px 5px",borderRadius:4,textTransform:"uppercase",display:"inline-block",marginBottom:3}}>Included</span>}
          <p style={{fontSize:10,fontWeight:800,color:col,lineHeight:1.3,margin:"0 0 2px"}}>{mod.name}</p>
          <p style={{fontSize:8,color:"#94a3b8",margin:0}}>{mod.hours} hrs</p>
        </div>
        {!isAnc && onRemove && <button onClick={onRemove} style={{color:"#cbd5e1",border:"none",background:"none",cursor:"pointer",fontWeight:900,fontSize:11,padding:0,lineHeight:1,flexShrink:0}}>x</button>}
      </div>
      <button onClick={()=>setExp(!exp)} style={{width:"100%",padding:"3px 10px",background:"none",border:"none",borderTop:`1px solid ${bdr}`,cursor:"pointer",fontSize:7,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span>Details</span><span>{exp?"-":"+"}</span>
      </button>
      {exp && <div style={{padding:"8px 10px",background:"#f8fafc",borderTop:`1px solid ${bdr}`,fontSize:9,color:"#64748b"}}><p style={{margin:"0 0 4px"}}>{mod.desc}</p>{mod.note&&<p style={{fontSize:8,color:"#4196ff",fontStyle:"italic",margin:0}}>{mod.note}</p>}</div>}
    </div>
  );
}

function MatrixCard({ mod, type }) {
  const [exp, setExp] = useState(false);
  const dom = DOMAINS.find(d => d.id === mod.domain);
  const isAnc = type === "anchor";
  const bg = isAnc ? (dom?.bg || "#dbeafe") : "#e8f0fc";
  const bdr = isAnc ? (dom?.border || "#93c5fd") : "#a8c4f5";
  const col = isAnc ? (dom?.color || "#0054BC") : "#0054BC";
  return (
    <div style={{background:"#fff",border:`1.5px solid ${bdr}`,borderRadius:8,marginBottom:5,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,84,188,0.08)"}}>
      <div style={{padding:"6px 8px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
          <span style={{fontSize:6,fontWeight:900,background:bg,color:col,padding:"1px 5px",borderRadius:3,textTransform:"uppercase",letterSpacing:0.5}}>{isAnc?"Included":"Selectable"}</span>
          <span style={{fontSize:7,fontWeight:900,color:col,background:bg,padding:"1px 5px",borderRadius:3}}>{mod.hours}h</span>
        </div>
        <p style={{fontSize:9,fontWeight:800,color:"#051836",margin:0,lineHeight:1.3}}>{mod.name}</p>
      </div>
      <button onClick={()=>setExp(!exp)} style={{width:"100%",padding:"3px 8px",border:"none",borderTop:`1px solid ${bdr}`,cursor:"pointer",fontSize:7,fontWeight:900,color:"#0054BC",textTransform:"uppercase",letterSpacing:1,display:"flex",alignItems:"center",justifyContent:"space-between",background:exp?"#e8f0fc":"transparent"}}>
        <span>Details</span><span style={{fontSize:9}}>{exp?"-":"+"}</span>
      </button>
      {exp&&<div style={{padding:"7px 8px",background:"#f0f6ff",borderTop:`1px solid ${bdr}`}}>
        <p style={{fontSize:8,color:"#051836",margin:"0 0 4px",lineHeight:1.4}}>{mod.desc}</p>
        {mod.kpis&&mod.kpis.length>0&&<p style={{fontSize:7,color:"#0054BC",margin:"0 0 2px",fontWeight:700}}>KPIs: {mod.kpis.join(" | ")}</p>}
        {mod.note&&<p style={{fontSize:7,color:"#0DAC41",fontStyle:"italic",fontWeight:700,margin:0}}>{mod.note}</p>}
      </div>}
    </div>
  );
}

function ModMenu({ year, tier, selIds, onSelect, onClose, rect, advDomainChoiceForYear, domainFilter, selectableHrsBudget, yearHrsUsed }) {
  const ref = useRef(null);
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); }; document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h); }, [onClose]);
  const W = 460, VH = typeof window !== "undefined" ? window.innerHeight : 800, VW = typeof window !== "undefined" ? window.innerWidth : 1200;
  const MENU_H = 520;
  let left = rect ? rect.left : 0;
  if (left+W > VW-12) left = VW-W-12;
  if (left < 8) left = 8;
  const spaceBelow = rect ? VH - rect.bottom - 12 : 0;
  const top = rect ? (spaceBelow >= MENU_H ? rect.bottom+6 : Math.max(8, rect.top - MENU_H - 6)) : 100;
  const curHrs = yearHrsUsed(year);
  const pool = ALL_MODULES.filter(m => {
    const d = DOMAINS.find(x => x.id === m.domain);
    if (!d) return false;
    const access = d.access[tier];
    if (access === "excluded") return false;
    if (access === "anchor") return m.anchorTiers && m.anchorTiers.includes(tier);
    if (access === "choice") return !advDomainChoiceForYear || advDomainChoiceForYear === m.domain;
    return true;
  }).filter(m => !domainFilter || m.domain === domainFilter);
  const byDomain = {};
  pool.forEach(m => { if (!byDomain[m.domain]) byDomain[m.domain]=[]; byDomain[m.domain].push(m); });
  return (
    <div ref={ref} style={{position:"fixed",zIndex:300,top,left,width:W,maxHeight:Math.min(MENU_H, spaceBelow >= MENU_H ? VH - (rect ? rect.bottom : 0) - 20 : (rect ? rect.top : 500) - 20),background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,boxShadow:"0 20px 60px rgba(0,0,0,0.18)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:"1px solid #f1f5f9",background:"#f8fafc"}}>
        <div>
          <span style={{fontSize:9,fontWeight:900,color:"#475569",textTransform:"uppercase",letterSpacing:2}}>Year {year} Modules</span>
          <p style={{fontSize:8,color:"#94a3b8",margin:"2px 0 0"}}>{curHrs}/{selectableHrsBudget} hrs used - 40hr domain cap</p>
        </div>
        <button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer",color:"#94a3b8",fontWeight:900,fontSize:14}}>x</button>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {Object.entries(byDomain).map(([domId,mods]) => {
          const dom = DOMAINS.find(d => d.id === domId);
          return (
            <div key={domId}>
              <div style={{padding:"6px 14px 4px",background:dom?.bg||"#f8fafc",borderBottom:"1px solid #f1f5f9"}}>
                <span style={{fontSize:8,fontWeight:900,color:dom?.color||"#475569",textTransform:"uppercase",letterSpacing:1}}>{dom?.name}</span>
              </div>
              {mods.map(mod => {
                const sel = selIds.includes(mod.id);
                const wouldExceed = curHrs+mod.hours > selectableHrsBudget;
                const disabled = sel || wouldExceed;
                return (
                  <button key={mod.id} onClick={()=>!disabled&&onSelect(mod)} disabled={disabled}
                    style={{width:"100%",textAlign:"left",padding:"10px 16px",background:sel?"#e8f0fc":"#fff",border:"none",borderBottom:"1px solid #f8fafc",cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,display:"flex",alignItems:"flex-start",gap:10}}
                    onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background="#f0f4ff"}}
                    onMouseLeave={e=>{if(!disabled)e.currentTarget.style.background=sel?"#e8f0fc":"#fff"}}>
                    <div style={{flex:1}}>
                      <p style={{fontSize:10,fontWeight:800,color:"#0E387C",margin:"0 0 2px"}}>{mod.name}</p>
                      <p style={{fontSize:9,color:"#64748b",margin:0,lineHeight:1.4}}>{mod.desc}</p>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,color:dom?.color||"#0054BC",flexShrink:0,marginTop:2}}>{mod.hours}h</span>
                    {sel&&<span style={{color:"#0054BC",fontSize:11,flexShrink:0}}>ok</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}




function DomainMatrix({ tier }) {
  const tiers = ["Core","Advanced","Enterprise"];
  const getStatus = (d,t) => {
    const a = d.access[t];
    if (!a||a==="excluded") return {label:"Not incl.",color:"#cbd5e1"};
    if (a==="anchor") return {label:"Included",color:d.color,bg:d.bg};
    if (a==="choice") return {label:"Selects 1",color:"#b45309",bg:"#fef3c7"};
    return {label:"Included",color:"#059669",bg:"#e8f8ee"};
  };
  return (
    <div style={{marginBottom:20}}>
      <p style={{fontSize:8,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,margin:"0 0 8px"}}>Domain Access by Tier</p>
      <div style={{border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 38px 55px 60px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
          <span style={{fontSize:7,fontWeight:900,color:"#94a3b8",padding:"5px 8px",textTransform:"uppercase",letterSpacing:1}}>Domain</span>
          {tiers.map(t=><span key={t} style={{fontSize:7,fontWeight:900,color:tier===t?"#051836":"#94a3b8",padding:"5px 4px",textAlign:"center",textTransform:"uppercase"}}>{t[0]}</span>)}
        </div>
        {DOMAINS.map((d,i)=>{
          const statuses = tiers.map(t=>getStatus(d,t));
          return (
            <div key={d.id} style={{display:"grid",gridTemplateColumns:"1fr 38px 55px 60px",borderBottom:i<DOMAINS.length-1?"1px solid #f1f5f9":"none"}}>
              <div style={{padding:"5px 8px",borderRight:"1px solid #f1f5f9"}}>
                <p style={{fontSize:7,fontWeight:700,color:d.color,margin:0,lineHeight:1.3}}>{d.name}</p>
                {d.isNew&&<span style={{fontSize:6,fontWeight:900,background:"#fef3c7",color:"#b45309",padding:"1px 4px",borderRadius:3,textTransform:"uppercase"}}>NEW</span>}
              </div>
              {statuses.map((s,ti)=>(
                <div key={ti} style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"4px 2px",background:tier===tiers[ti]&&s.bg?s.bg:"transparent",borderRight:ti<2?"1px solid #f1f5f9":"none"}}>
                  <span style={{fontSize:7,fontWeight:700,color:s.color,textAlign:"center",lineHeight:1.2}}>{s.label}</span>
                </div>
              ))}
            </div>
          );
        })}
        <div style={{display:"grid",gridTemplateColumns:"1fr 38px 55px 60px",background:"#f8fafc",borderTop:"1px solid #e2e8f0"}}>
          <span style={{fontSize:7,fontWeight:900,color:"#475569",padding:"5px 8px",textTransform:"uppercase"}}>Domains</span>
          {tiers.map(t=><span key={t} style={{fontSize:9,fontWeight:900,color:tier===t?"#051836":"#94a3b8",padding:"5px 4px",textAlign:"center"}}>{DOMAIN_SUMMARY[t]}</span>)}
        </div>
      </div>
      {tier==="Advanced"&&<div style={{marginTop:8,padding:"8px 10px",background:"#fef3c7",borderRadius:8,border:"1px solid #fde68a"}}>
        <p style={{fontSize:8,fontWeight:700,color:"#92400e",margin:0}}>Advanced: select 1 domain per contract year in the module configurator</p>
      </div>}
    </div>
  );
}

function ExecView({ customerName, tier, soft5, totSvcByMode, onBack }) {
  const [selMode, setSelMode] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const allModelData = Object.entries(AC).map(([key,cfg])=>{ const svc=totSvcByMode(key); const tcv=soft5+svc; return {key,cfg,svc,tcv,svcShare:tcv>0?(svc/tcv)*100:0,softShare:tcv>0?(soft5/tcv)*100:0}; });
  const TC = { Core:"#059669", Advanced:"#0891b2", Enterprise:"#0054BC", "No Services":"#94a3b8" };
  const CUSTOM_LABEL = ({cx,cy,midAngle,innerRadius,outerRadius,percent}) => { const R=Math.PI/180; const r=innerRadius+(outerRadius-innerRadius)*0.5; const x=cx+r*Math.cos(-midAngle*R); const y=cy+r*Math.sin(-midAngle*R); return percent>0.06?<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{fontSize:11,fontWeight:800}}>{(percent*100).toFixed(1)}%</text>:null; };
  if (!selMode&&!compareMode) return (
    <div style={{flex:1,overflowY:"auto",padding:28,background:"#f1f5f9"}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button onClick={onBack} style={{fontSize:9,fontWeight:700,color:"#0054BC",background:"none",border:"none",cursor:"pointer",textTransform:"uppercase",letterSpacing:1,padding:0}}>Back to Matrix</button>
          <span style={{flex:1}} />
          <button onClick={()=>setCompareMode(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 20px",background:"#fff",border:"2px solid #0054BC",borderRadius:24,cursor:"pointer",fontSize:9,fontWeight:900,color:"#0054BC",textTransform:"uppercase",letterSpacing:1}}>Compare All Models</button>
        </div>
        <h1 style={{fontSize:22,fontWeight:900,color:"#051836",margin:"0 0 6px",letterSpacing:-0.5}}>5-Year Commercial Projection</h1>
        {customerName&&<p style={{fontSize:13,color:"#0054BC",fontWeight:700,margin:"0 0 24px"}}>{customerName} - {tier} Tier</p>}
        <div style={{height:2,background:"linear-gradient(90deg,#0054BC,#4196ff,transparent)",borderRadius:2,marginBottom:28}} />
        <p style={{fontSize:13,fontWeight:600,color:"#334155",textAlign:"center",marginBottom:6}}>Select your accounting model</p>
        <p style={{fontSize:10,color:"#94a3b8",textAlign:"center",marginBottom:28}}>Each model frames the value of services differently. Choose the one that reflects how your institution accounts for these services.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
          {Object.entries(AC).map(([key,cfg])=>(
            <button key={key} onClick={()=>setSelMode(key)} style={{textAlign:"left",padding:22,background:"#fff",border:`2px solid ${cfg.border}`,borderRadius:20,cursor:"pointer",display:"flex",flexDirection:"column",gap:10,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=cfg.color;e.currentTarget.style.boxShadow=`0 8px 30px ${cfg.color}22`;e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=cfg.border;e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.06)";e.currentTarget.style.transform="translateY(0)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:22,fontWeight:900,color:cfg.color,background:cfg.bg,width:40,height:40,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>{cfg.icon}</span>
                <span style={{fontSize:18,fontWeight:900,color:cfg.color,background:cfg.bg,padding:"4px 12px",borderRadius:20}}>{cfg.disp}</span>
              </div>
              <div>
                <p style={{fontSize:13,fontWeight:900,color:"#051836",margin:"0 0 4px"}}>{cfg.label}</p>
                <p style={{fontSize:10,color:cfg.color,fontWeight:700,margin:0,fontStyle:"italic"}}>{cfg.tagline}</p>
              </div>
              <div style={{borderTop:`1px solid ${cfg.border}`,paddingTop:10}}>
                {cfg.features.slice(0,3).map((f,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:cfg.color,fontSize:9,flexShrink:0,marginTop:1}}>*</span><span style={{fontSize:9,color:"#475569",lineHeight:1.4}}>{f}</span></div>)}
              </div>
              <div style={{background:cfg.bg,borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:9,fontWeight:900,color:cfg.color,textTransform:"uppercase",letterSpacing:1}}>Select this model</span>
                <span style={{fontSize:14,color:cfg.color}}>-&gt;</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  if (compareMode) {
    const metrics = [
      {label:"Services TCV (5yr)",values:allModelData.map(d=>d.svc),f:v=>fmt(v),note:"Higher = more commercial value"},
      {label:"Total TCV (5yr)",values:allModelData.map(d=>d.tcv),f:v=>fmt(v),note:"Includes software + services"},
      {label:"Services Share",values:allModelData.map(d=>d.svcShare),f:v=>v.toFixed(1)+"%",note:"% of total TCV from services"},
      {label:"Avg Annual Services",values:allModelData.map(d=>d.svc/5),f:v=>fmt(v),note:"Per-year average"},
      {label:"Margin Target",values:[40,0,5],f:v=>v+"%",note:"Applied markup on cost rate"},
    ];
    return (
      <div style={{flex:1,overflowY:"auto",padding:28,background:"#f1f5f9"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
            <button onClick={()=>setCompareMode(false)} style={{fontSize:9,fontWeight:700,color:"#0054BC",background:"none",border:"none",cursor:"pointer",textTransform:"uppercase",padding:0}}>Back to Selection</button>
            <span style={{color:"#e2e8f0"}}>|</span>
            <button onClick={onBack} style={{fontSize:9,fontWeight:700,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",textTransform:"uppercase",padding:0}}>Back to Matrix</button>
            <span style={{flex:1}} />
          </div>
          <h1 style={{fontSize:20,fontWeight:900,color:"#051836",margin:"0 0 6px"}}>5-Year Commercial Projection - All Models</h1>
          {customerName&&<p style={{fontSize:12,color:"#0054BC",fontWeight:700,margin:"0 0 20px"}}>{customerName} - {tier} Tier</p>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
            {allModelData.map(({key,cfg,svc,tcv})=>(
              <div key={key} style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",border:`2px solid ${cfg.border}`}}>
                <div style={{background:cfg.bg,padding:"14px 18px",borderBottom:`1px solid ${cfg.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div><p style={{fontSize:11,fontWeight:900,color:cfg.color,margin:0,textTransform:"uppercase"}}>{cfg.label}</p><p style={{fontSize:9,color:"#64748b",margin:0,fontStyle:"italic"}}>{cfg.tagline}</p></div>
                  <div style={{background:`linear-gradient(135deg,${cfg.color},${cfg.color}cc)`,borderRadius:100,padding:"6px 12px",textAlign:"center"}}><span style={{fontSize:16,fontWeight:900,color:"#fff",display:"block",lineHeight:1}}>{cfg.disp}</span><span style={{fontSize:7,fontWeight:700,color:"rgba(255,255,255,0.75)",textTransform:"uppercase"}}>margin</span></div>
                </div>
                <div style={{padding:"14px 18px"}}>
                  <p style={{fontSize:8,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,margin:"0 0 4px"}}>5-Year TCV</p>
                  <p style={{fontSize:22,fontWeight:900,color:"#051836",margin:"0 0 4px"}}>{fmt(tcv)}</p>
                  <p style={{fontSize:9,color:"#64748b",margin:"0 0 12px"}}>{fmt(svc)} services / {fmt(soft5)} software</p>
                </div>
                <button onClick={()=>{setCompareMode(false);setSelMode(key);}} style={{width:"100%",padding:"10px 18px",background:cfg.bg,border:"none",borderTop:`1px solid ${cfg.border}`,cursor:"pointer",fontSize:9,fontWeight:900,color:cfg.color,textTransform:"uppercase",letterSpacing:1,display:"flex",alignItems:"center",justifyContent:"space-between"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=cfg.color;e.currentTarget.style.color="#fff"}}
                  onMouseLeave={e=>{e.currentTarget.style.background=cfg.bg;e.currentTarget.style.color=cfg.color}}>
                  <span>View full projection</span><span>-&gt;</span>
                </button>
              </div>
            ))}
          </div>
          <div style={{background:"#fff",borderRadius:16,overflow:"hidden",border:"1px solid #e2e8f0",boxShadow:"0 2px 10px rgba(0,0,0,0.06)"}}>
            <div style={{padding:"14px 22px",borderBottom:"1px solid #f1f5f9",background:"#fafafa"}}>
              <p style={{fontSize:10,fontWeight:900,color:"#334155",textTransform:"uppercase",letterSpacing:1,margin:0}}>Side-by-Side Comparison</p>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:"2px solid #f1f5f9"}}>
                <th style={{textAlign:"left",fontSize:8,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1.5,padding:"10px 22px"}}>Metric</th>
                {allModelData.map(({key,cfg})=><th key={key} style={{textAlign:"center",fontSize:8,fontWeight:900,color:cfg.color,textTransform:"uppercase",letterSpacing:1,padding:"10px 14px"}}>{cfg.label}</th>)}
              </tr></thead>
              <tbody>
                {metrics.map((m,ri)=>{
                  const sorted=[...m.values].sort((a,b)=>b-a);
                  return <tr key={ri} style={{borderBottom:ri<metrics.length-1?"1px solid #f8fafc":"none"}}>
                    <td style={{padding:"10px 22px"}}><p style={{fontSize:10,fontWeight:700,color:"#334155",margin:"0 0 2px"}}>{m.label}</p><p style={{fontSize:8,color:"#94a3b8",margin:0}}>{m.note}</p></td>
                    {m.values.map((val,ci)=>{
                      const rank=sorted.indexOf(val);
                      const isW=rank===0,isM=rank===1;
                      const bg=isW?"#e8f8ee":isM?"#fffbeb":"#fff";
                      const col=isW?"#0DAC41":isM?"#d97706":"#64748b";
                      const bdr=isW?"#a3edbe":isM?"#fde68a":"transparent";
                      return <td key={ci} style={{padding:"8px 14px",textAlign:"center"}}><div style={{background:bg,border:`1.5px solid ${bdr}`,borderRadius:10,padding:"6px 10px",display:"inline-block",minWidth:80}}><span style={{fontSize:13,fontWeight:900,color:col,display:"block"}}>{m.f(val)}</span>{isW&&<span style={{fontSize:7,fontWeight:900,color:"#0DAC41",textTransform:"uppercase"}}>Best</span>}{isM&&<span style={{fontSize:7,fontWeight:900,color:"#d97706",textTransform:"uppercase"}}>Mid</span>}</div></td>;
                    })}
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
  const ac = AC[selMode];
  const totSvc = totSvcByMode(selMode);
  const totTCV = soft5 + totSvc;
  const svcShare = totTCV > 0 ? (totSvc/totTCV)*100 : 0;
  const softShare = 100 - svcShare;
  const pieData = [{name:"Software",value:Math.round(soft5)},{name:"Services",value:Math.round(totSvc)}];
  return (
    <div style={{flex:1,overflowY:"auto",padding:28,background:"#f1f5f9"}}>
      <div style={{maxWidth:1000,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={()=>setSelMode(null)} style={{fontSize:9,fontWeight:700,color:"#0054BC",background:"none",border:"none",cursor:"pointer",textTransform:"uppercase",padding:0}}>Change Model</button>
          <span style={{color:"#e2e8f0"}}>|</span>
          <button onClick={onBack} style={{fontSize:9,fontWeight:700,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",textTransform:"uppercase",padding:0}}>Back to Matrix</button>
          <span style={{flex:1}} />
          <button onClick={()=>{setCompareMode(true);setSelMode(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 18px",background:"#fff",border:"2px solid #0054BC",borderRadius:24,cursor:"pointer",fontSize:9,fontWeight:900,color:"#0054BC",textTransform:"uppercase",letterSpacing:1}}>Compare All Models</button>
        </div>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:900,color:"#051836",margin:"0 0 6px",letterSpacing:-0.5}}>5-Year Commercial Projection</h1>
            {customerName&&<p style={{fontSize:13,color:"#0054BC",fontWeight:700,margin:0}}>{customerName} - {tier} Tier</p>}
          </div>
          <div style={{background:`linear-gradient(135deg,${ac.color},${ac.color}bb)`,borderRadius:100,padding:"12px 26px",boxShadow:`0 4px 20px ${ac.color}44`,display:"flex",flexDirection:"column",alignItems:"center"}}>
            <span style={{fontSize:26,fontWeight:900,color:"#fff",lineHeight:1}}>{ac.disp}</span>
            <span style={{fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.8)",textTransform:"uppercase",letterSpacing:2,marginTop:2}}>{ac.label}</span>
          </div>
        </div>
        <div style={{height:2,background:`linear-gradient(90deg,${ac.color},${ac.color}44,transparent)`,borderRadius:2,marginTop:16,marginBottom:24}} />
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:22,marginBottom:22}}>
          <div style={{background:"#fff",borderRadius:18,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:`1px solid ${ac.border}`}}>
            <p style={{fontSize:8,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,margin:"0 0 4px"}}>5-Year TCV Composition</p>
            <p style={{fontSize:13,fontWeight:700,color:"#051836",margin:"0 0 16px"}}>{fmt(totTCV)} total contract value</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" labelLine={false} label={CUSTOM_LABEL}>
                <Cell fill={TC[tier]||"#0054BC"} /><Cell fill="#e2e8f0" />
              </Pie><Tooltip formatter={(v,n)=>[fmt(v),n]} contentStyle={{fontSize:10,borderRadius:8,border:"1px solid #e2e8f0",fontWeight:700}} /><Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:10,fontWeight:700}} /></PieChart>
            </ResponsiveContainer>
            {[{name:"Software",share:softShare,col:"#0054BC"},{name:"Services",share:svcShare,col:ac.color}].map(item=>(
              <div key={item.name} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,fontWeight:700,color:"#475569"}}>{item.name}</span><span style={{fontSize:10,fontWeight:900,color:item.col}}>{item.share.toFixed(1)}%</span></div>
                <div style={{height:5,background:"#f1f5f9",borderRadius:3}}><div style={{height:"100%",width:`${item.share}%`,background:item.col,borderRadius:3}} /></div>
              </div>
            ))}
          </div>
          <div style={{background:"#fff",borderRadius:18,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:`1px solid ${ac.border}`}}>
            <p style={{fontSize:8,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,margin:"0 0 18px"}}>Investment Summary</p>
            {[{label:"Software TCV (5yr)",v:fmt(soft5),col:"#0054BC"},{label:"Services TCV (5yr)",v:fmt(totSvc),col:ac.color},{label:"Total TCV (5yr)",v:fmt(totTCV),col:"#051836",bold:true},{label:"Avg Annual TCV",v:fmt(totTCV/5),col:"#475569"},{label:"Avg Annual Services",v:fmt(totSvc/5),col:ac.color},{label:"Services Margin",v:ac.disp,col:ac.color}].map((row,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f8fafc"}}>
                <span style={{fontSize:row.bold?11:10,fontWeight:row.bold?900:600,color:row.bold?"#051836":"#475569"}}>{row.label}</span>
                <span style={{fontSize:row.bold?14:12,fontWeight:900,color:row.col}}>{row.v}</span>
              </div>
            ))}
            <div style={{marginTop:16,background:ac.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${ac.border}`}}>
              <p style={{fontSize:10,color:ac.color,fontStyle:"italic",margin:"0 0 6px",fontWeight:700}}>{ac.tagline}</p>
              <p style={{fontSize:9,color:"#64748b",margin:0,lineHeight:1.5}}>{ac.features.slice(0,3).join(" / ")}</p>
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:22}}>
          {[{label:"Total TCV",v:fmt(totTCV),sub:"5-yr combined",col:"#051836",bg:"#fff"},{label:"Software TCV",v:fmt(soft5),sub:`${softShare.toFixed(1)}% of total`,col:"#0054BC",bg:"#e8f0fc"},{label:"Services TCV",v:fmt(totSvc),sub:`${svcShare.toFixed(1)}% of total`,col:ac.color,bg:ac.bg},{label:"Avg Annual",v:fmt(totTCV/5),sub:"combined/yr",col:"#475569",bg:"#fff"}].map((s,i)=>(
            <div key={i} style={{background:s.bg,borderRadius:12,padding:"14px 16px",border:"1px solid #e2e8f0",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <p style={{fontSize:8,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,margin:"0 0 5px"}}>{s.label}</p>
              <p style={{fontSize:17,fontWeight:900,color:s.col,margin:"0 0 2px",lineHeight:1}}>{s.v}</p>
              <p style={{fontSize:9,color:"#94a3b8",margin:0}}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [cType, setCType] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [fte, setFte] = useState("");
  const [tier, setTier] = useState("No Services");
  const [contractYears, setContractYears] = useState(5);
  const [yearData, setYearData] = useState({1:{selected:[]},2:{selected:[]},3:{selected:[]},4:{selected:[]},5:{selected:[]}});
  const [menu, setMenu] = useState(null);
  const [menuRect, setMenuRect] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [execView, setExecView] = useState(false);
  const [copied, setCopied] = useState(null);
  const [advDomainChoices, setAdvDomainChoices] = useState({1:null,2:null,3:null,4:null,5:null});
  const [profilerDone, setProfilerDone] = useState(false);
  const [profilerData, setProfilerData] = useState(null);

  const fteData = FTE_BANDS.find(b=>b.value===fte);
  const soft5 = fteData ? fteData.softTCV * contractYears : 0;
  const selectableHrsBudget = TIER_SELECTABLE_HRS[tier]||0;
  const anchorHrsBudget = TIER_ANCHOR_HRS[tier]||0;
  const totalHrs = TIER_TOTAL_HRS[tier]||0;
  const activeYrs = YRS.slice(0, contractYears);

  const yearHrsUsed = y => yearData[y].selected.reduce((s,id)=>{ const m=ALL_MODULES.find(x=>x.id===id); return s+(m?m.hours:0); },0);
  const domHrsUsed = (y,domId) => yearData[y].selected.reduce((s,id)=>{ const m=ALL_MODULES.find(x=>x.id===id); return s+(m&&m.domain===domId?m.hours:0); },0);
  const yearPrice = (y, pct) => {
    if (!tier||tier==="No Services") return 0;
    return yearData[y].selected.reduce((s,id)=>{ const m=ALL_MODULES.find(x=>x.id===id); return s+(m?modPrice(m,pct):0); },0);
  };
  const totSvcByMode = modeKey => activeYrs.reduce((a,y)=>a+yearPrice(y,AC[modeKey].pct),0);
  const allYearsFull = selectableHrsBudget>0 && activeYrs.every(y=>yearHrsUsed(y)>0);
  const remaining = activeYrs.filter(y=>yearHrsUsed(y)===0).length;

  const emptyYearData = () => ({1:{selected:[]},2:{selected:[]},3:{selected:[]},4:{selected:[]},5:{selected:[]}});
  const reset = () => { setCType(null); setCustomerName(""); setFte(""); setTier("No Services"); setContractYears(5); setYearData(emptyYearData()); setSubmitted(false); setExecView(false); setCopied(null); setAdvDomainChoices({1:null,2:null,3:null,4:null,5:null}); setProfilerDone(false); setProfilerData(null); };
  const chgTier = t => { setTier(t); setYearData(emptyYearData()); setSubmitted(false); setExecView(false); setCopied(null); setAdvDomainChoices({1:null,2:null,3:null,4:null,5:null}); };
  const handleProfilerComplete = (result) => {
    setTier(result.tier);
    setProfilerData(result);
    setProfilerDone(true);
    if (result.prePopMods && result.prePopMods.length > 0) {
      setYearData(prev => {
        const nd = {...prev};
        const validMods = result.prePopMods.filter(id => {
          const mod = ALL_MODULES.find(m => m.id === id);
          if (!mod) return false;
          const dom = DOMAINS.find(d => d.id === mod.domain);
          return dom && dom.access[result.tier] && dom.access[result.tier] !== "excluded";
        });
        nd[1] = { selected: [...new Set([...nd[1].selected, ...validMods])] };
        return nd;
      });
    }
  };
  const handleProfilerSkip = () => { setProfilerDone(true); setProfilerData(null); };
  const rerunProfiler = () => { setProfilerDone(false); setProfilerData(null); setTier("No Services"); setYearData(emptyYearData()); setSubmitted(false); };

  const addSel = (y,mod) => {
    setYearData(p=>{
      if(p[y].selected.includes(mod.id)) return p;
      const curHrs = p[y].selected.reduce((s,id)=>{ const m=ALL_MODULES.find(x=>x.id===id); return s+(m?m.hours:0); },0);
      if(curHrs+mod.hours>selectableHrsBudget) return p;
      if(domHrsUsed(y,mod.domain)+mod.hours>DOMAIN_HOUR_CAP) return p;
      if(mod.isFull){const cleared=p[y].selected.filter(id=>{const m=ALL_MODULES.find(x=>x.id===id);return !m||m.domain!==mod.domain;});return {...p,[y]:{selected:[...cleared,mod.id]}};}
      return {...p,[y]:{selected:[...p[y].selected,mod.id]}};
    });
  };
  const remSel = (y,id) => setYearData(p=>({...p,[y]:{selected:p[y].selected.filter(x=>x!==id)}}));
  const copyAll = from => {
    setYearData(p=>{ const src=p[from]; const n={...p}; activeYrs.forEach(y=>{if(y!==from) n[y]={selected:[...src.selected]};}); return n; });
    if(tier==="Advanced"){ setAdvDomainChoices(p=>{ const n={...p}; activeYrs.forEach(y=>{if(y!==from) n[y]=p[from];}); return n; }); }
    setCopied(from); setTimeout(()=>setCopied(null),1800);
  };
  const TC = { Core:"#059669", Advanced:"#0891b2", Enterprise:"#0054BC" };

  if (execView) return (
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"'Inter',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,background:"linear-gradient(135deg,#0054BC,#0DAC41)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,fontWeight:900}}>B</div>
          <div>
            <h1 style={{fontSize:15,fontWeight:900,color:"#051836",margin:0}}>Blackboard Customer Modeler</h1>
            <p style={{fontSize:8,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,margin:0}}>Menu Model v4 - Executive View</p>
          </div>
        </div>
        <button onClick={reset} style={{padding:"8px 16px",background:"#0054BC",color:"#fff",fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:1,border:"none",borderRadius:8,cursor:"pointer"}}>New Model</button>
      </div>
      <ExecView customerName={customerName.trim()||null} tier={tier} soft5={soft5} totSvcByMode={totSvcByMode} onBack={()=>setExecView(false)} />
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,background:"linear-gradient(135deg,#0054BC,#0DAC41)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,fontWeight:900}}>B</div>
          <div>
            <h1 style={{fontSize:15,fontWeight:900,color:"#051836",margin:0}}>Blackboard Customer Modeler</h1>
            <p style={{fontSize:8,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,margin:0}}>Menu Model v4 - Strategic Capability Matrix</p>
          </div>
        </div>
        <button onClick={reset} style={{padding:"8px 14px",background:"#e8f0fc",color:"#0054BC",fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:1,border:"1px solid #a8c4f5",borderRadius:8,cursor:"pointer"}}>Reset</button>
      </div>

      <div style={{display:"flex",minHeight:"calc(100vh - 65px)"}}>
        {/* SIDEBAR */}
        <div style={{width:262,flexShrink:0,background:"#fff",borderRight:"1px solid #e2e8f0",padding:16,overflowY:"auto"}}>
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:8,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2}}>Customer Type</span>
              <button onClick={reset} style={{fontSize:8,fontWeight:700,color:"#0054BC",background:"none",border:"none",cursor:"pointer",textTransform:"uppercase"}}>Reset</button>
            </div>
            {[{key:"new",label:"New Logo",sub:"Net-new institution."},{key:"existing",label:"Existing Customer",sub:"Phase 2 - Adoption & Growth."}].map(c=>(
              <button key={c.key} onClick={()=>c.key!=="new"&&setCType(c.key)} style={{width:"100%",textAlign:"left",padding:10,borderRadius:10,border:`2px solid ${cType===c.key?"#0054BC":"#e2e8f0"}`,background:cType===c.key?"#e8f0fc":"#fff",marginBottom:6,cursor:c.key==="new"?"not-allowed":"pointer",display:"block",opacity:c.key==="new"?0.35:1,position:"relative"}}>
                <span style={{fontSize:10,fontWeight:900,color:"#0E387C",textTransform:"uppercase",display:"block",marginBottom:1}}>{c.label}</span>
                <p style={{fontSize:9,color:"#94a3b8",margin:0}}>{c.sub}</p>
                {c.key==="new"&&<span style={{position:"absolute",top:6,right:8,fontSize:7,fontWeight:900,color:"#94a3b8",textTransform:"uppercase"}}>Soon</span>}
              </button>
            ))}
          </div>

          {cType==="existing"&&(
            <div style={{marginBottom:14}}>
              <span style={{fontSize:8,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,display:"block",marginBottom:8}}>Contract Length</span>
              <div style={{display:"flex",gap:5}}>
                {[1,2,3,4,5].map(y=>(
                  <button key={y} onClick={()=>{setContractYears(y);setYearData(emptyYearData());setSubmitted(false);}} style={{flex:1,padding:"7px 0",borderRadius:8,border:`2px solid ${contractYears===y?"#0054BC":"#e2e8f0"}`,background:contractYears===y?"#e8f0fc":"#fff",color:contractYears===y?"#0054BC":"#94a3b8",fontSize:10,fontWeight:900,cursor:"pointer",textAlign:"center"}}>
                    {y}yr
                  </button>
                ))}
              </div>
              <p style={{fontSize:8,color:"#94a3b8",margin:"6px 0 0",textAlign:"center"}}>{contractYears}-year contract selected</p>
            </div>
          )}

          <div style={{marginBottom:14}}>
            <span style={{fontSize:8,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,display:"block",marginBottom:6}}>Customer Name</span>
            <input type="text" value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="Institution name..." style={{width:"100%",padding:"8px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:10,color:"#0E387C",background:"#f8fafc",outline:"none",boxSizing:"border-box"}} />
          </div>

          <div style={{marginBottom:18}}>
            <span style={{fontSize:8,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,display:"block",marginBottom:6}}>FTE Band</span>
            <select value={fte} onChange={e=>setFte(e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:10,color:"#0E387C",background:"#f8fafc",outline:"none"}}>
              {FTE_BANDS.map(b=><option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>

          <>
              {profilerData ? (
                <div style={{marginBottom:16,background:"linear-gradient(135deg,#051836,#0E387C)",borderRadius:10,padding:"12px 14px"}}>
                  <p style={{fontSize:7,fontWeight:900,color:"#4196ff",textTransform:"uppercase",letterSpacing:1.5,margin:"0 0 6px"}}>Profiler Result</p>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:900,color:"#fff"}}>{profilerData.tier}</span>
                    {profilerData.overrideReason&&<span style={{fontSize:7,color:"#C8DA2B",fontWeight:700,background:"rgba(200,218,43,0.15)",padding:"2px 6px",borderRadius:4}}>Overridden</span>}
                  </div>
                  {profilerData.overrideReason&&<p style={{fontSize:8,color:"#a8c4f5",margin:"0 0 6px",lineHeight:1.4}}>{profilerData.overrideReason}</p>}
                  {profilerData.recommendedTier&&profilerData.overrideReason&&<p style={{fontSize:7,color:"#4196ff",margin:"0 0 8px"}}>Recommended: {profilerData.recommendedTier}</p>}
                  <button onClick={rerunProfiler} style={{width:"100%",padding:"5px 0",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:6,color:"#e2e8f0",fontSize:8,fontWeight:900,textTransform:"uppercase",letterSpacing:1,cursor:"pointer"}}>Re-run Profiler</button>
                </div>
              ) : profilerDone ? (
                <div style={{marginBottom:14,padding:"10px 12px",background:"#e8f0fc",borderRadius:8,border:"1px solid #a8c4f5"}}>
                  <p style={{fontSize:9,color:"#0054BC",fontWeight:700,margin:"0 0 6px"}}>Tier selected manually</p>
                  <button onClick={rerunProfiler} style={{width:"100%",padding:"5px 0",background:"#0054BC",border:"none",borderRadius:6,color:"#fff",fontSize:8,fontWeight:900,textTransform:"uppercase",letterSpacing:1,cursor:"pointer"}}>Run Account Profiler</button>
                </div>
              ) : null}
              <div style={{marginBottom:18}}>
                <span style={{fontSize:8,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,display:"block",marginBottom:8}}>Service Tier</span>
                {["Core","Advanced","Enterprise"].map(t=>{
                  const active = tier===t;
                  return (
                    <button key={t} onClick={()=>chgTier(t)} style={{width:"100%",textAlign:"left",padding:"10px 12px",borderRadius:10,border:`2px solid ${active?TC[t]:"#e2e8f0"}`,background:active?`${TC[t]}15`:"#fff",marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <span style={{fontSize:10,fontWeight:900,color:active?TC[t]:"#475569",textTransform:"uppercase",letterSpacing:0.5}}>{t}</span>
                        <p style={{fontSize:8,color:"#94a3b8",margin:"2px 0 0"}}>{TIER_TOTAL_HRS[t]}hrs/yr - {DOMAIN_SUMMARY[t]} domains</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {tier!=="No Services"&&<DomainMatrix tier={tier} />}
          </>
        </div>

        {/* MAIN CONTENT */}
        <div style={{flex:1,padding:20,overflowY:"auto"}}>
          {!cType ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}>
              <div style={{textAlign:"center",maxWidth:420}}>
                <div style={{width:60,height:60,background:"linear-gradient(135deg,#0054BC,#0E387C)",borderRadius:16,margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:28,fontWeight:900}}>B</div>
                <h2 style={{fontSize:22,fontWeight:900,color:"#051836",margin:"0 0 8px"}}>Blackboard Customer Modeler</h2>
                <p style={{fontSize:12,color:"#64748b",lineHeight:1.6,margin:"0 0 24px"}}>Select a customer type from the sidebar to begin building a services model.</p>
                <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:16,textAlign:"left"}}>
                  <p style={{fontSize:9,fontWeight:900,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,margin:"0 0 8px"}}>Available tiers</p>
                  {["Core","Advanced","Enterprise"].map(t=>(
                    <div key={t} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f1f5f9"}}>
                      <span style={{fontSize:10,fontWeight:700,color:TC[t]}}>{t}</span>
                      <span style={{fontSize:10,color:"#64748b"}}>{TIER_TOTAL_HRS[t]}hrs/yr - {DOMAIN_SUMMARY[t]} domains</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : !profilerDone ? (
            <TierProfiler onComplete={handleProfilerComplete} onSkip={handleProfilerSkip} />
          ) : tier==="No Services" ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}>
              <div style={{textAlign:"center"}}>
                <div style={{width:48,height:48,background:"#e8f0fc",borderRadius:12,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>&#8593;</div>
                <p style={{fontSize:14,fontWeight:700,color:"#051836",margin:"0 0 8px"}}>Select a service tier from the sidebar</p>
                <p style={{fontSize:11,color:"#94a3b8",margin:"0 0 16px"}}>Core, Advanced, or Enterprise</p>
                <button onClick={rerunProfiler} style={{padding:"9px 20px",background:"linear-gradient(135deg,#0054BC,#0E387C)",border:"none",borderRadius:8,color:"#fff",fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:1,cursor:"pointer"}}>Re-run Account Profiler</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
                {[
                  {label:"Service Tier",value:tier,sub:`${DOMAIN_SUMMARY[tier]} capability domains`},
                  {label:"Hour Budget",value:`${totalHrs} hrs/yr`,sub:`${anchorHrsBudget}hrs included + ${selectableHrsBudget}hrs selectable`},
                  {label:"Contract",value:`${contractYears} yr${contractYears!==1?"s":""}`,sub:`${activeYrs.length} year${activeYrs.length!==1?"s":""} active`},
                  {label:"Modules Selected",value:activeYrs.reduce((t,y)=>t+yearData[y].selected.length,0),sub:`across ${activeYrs.length} year${activeYrs.length!==1?"s":""}`},
                ].map((k,i)=>(
                  <div key={i} style={{background:"#fff",borderRadius:12,border:"1px solid #a8c4f5",padding:"12px 16px",boxShadow:"0 2px 6px rgba(0,84,188,0.10)"}}>
                    <p style={{fontSize:8,fontWeight:900,color:"#0054BC",textTransform:"uppercase",letterSpacing:1,margin:"0 0 5px"}}>{k.label}</p>
                    <p style={{fontSize:17,fontWeight:900,color:"#051836",margin:"0 0 2px"}}>{k.value}</p>
                    <p style={{fontSize:9,color:"#64748b",margin:0}}>{k.sub}</p>
                  </div>
                ))}
              </div>

              {submitted ? (
                <div style={{background:"#fff",borderRadius:12,border:"1px solid #a8c4f5",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,84,188,0.12)"}}>
                  <div style={{padding:"14px 20px",borderBottom:"2px solid #0054BC",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,#051836,#0E387C)"}}>
                    <div>
                      <h3 style={{fontSize:14,fontWeight:900,color:"#fff",margin:"0 0 3px",letterSpacing:0.3}}>Capability Matrix</h3>
                      <p style={{fontSize:9,color:"#4196ff",margin:0}}>{contractYears}-year strategic module roadmap - {tier} tier</p>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setSubmitted(false)} style={{padding:"8px 14px",background:"transparent",color:"#e2e8f0",fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:1,border:"1px solid #4196ff",borderRadius:8,cursor:"pointer"}}>Edit Configuration</button>
                      <button onClick={()=>setExecView(true)} style={{padding:"8px 16px",background:"linear-gradient(135deg,#0054BC,#0DAC41)",color:"#fff",fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:1,border:"none",borderRadius:8,cursor:"pointer"}}>Executive View</button>
                    </div>
                  </div>
                  <div style={{overflowX:"auto"}}>
                    <div style={{minWidth:Math.max(640,contractYears*160+200)}}>
                      <div style={{display:"grid",gridTemplateColumns:`200px ${activeYrs.map(()=>"1fr").join(" ")}`,borderBottom:"2px solid #a8c4f5",padding:"8px 16px",background:"#e8f0fc"}}>
                        <span style={{fontSize:8,fontWeight:900,color:"#0054BC",textTransform:"uppercase",letterSpacing:2}}>Domain / Capability</span>
                        {activeYrs.map(y=><span key={y} style={{fontSize:8,fontWeight:900,color:"#0054BC",textTransform:"uppercase",letterSpacing:2,textAlign:"center"}}>Year {y}</span>)}
                      </div>
                      {DOMAINS.map(dom=>{
                        const domAccess = dom.access[tier];
                        if(!domAccess||domAccess==="excluded") return null;
                        const hasModules = activeYrs.some(y=>yearData[y].selected.some(id=>{ const m=ALL_MODULES.find(x=>x.id===id); return m&&m.domain===dom.id; }));
                        return (
                          <div key={dom.id} style={{display:"grid",gridTemplateColumns:`200px ${activeYrs.map(()=>"1fr").join(" ")}`,borderBottom:`1px solid ${dom.border}`}}>
                            <div style={{padding:"10px 14px",borderRight:`2px solid ${dom.border}`,background:dom.bg}}>
                              <p style={{fontSize:9,fontWeight:900,color:dom.color,margin:"0 0 2px",lineHeight:1.3}}>{dom.name}</p>
                              <span style={{fontSize:7,color:dom.color,opacity:0.85,fontWeight:600}}>{domAccess==="included"?"Included":domAccess==="choice"?"Optional (Advanced)":"Selectable"} - {dom.hourCap}h cap</span>
                              {!hasModules&&<p style={{fontSize:7,color:dom.color,opacity:0.5,margin:"4px 0 0",fontStyle:"italic"}}>No modules selected</p>}
                            </div>
                            {activeYrs.map(y=>{
                              const items=yearData[y].selected.map(id=>ALL_MODULES.find(m=>m.id===id)).filter(m=>m&&m.domain===dom.id);
                              return (
                                <div key={y} style={{padding:"8px 6px",borderRight:y<activeYrs[activeYrs.length-1]?`1px solid ${dom.border}`:"none",minHeight:50,background:items.length===0?"#fafcff":"#fff"}}>
                                  {items.length===0&&<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",minHeight:40}}><span style={{fontSize:8,color:"#a8c4f5",fontWeight:700}}>-</span></div>}
                                  {items.map(m=><MatrixCard key={m.id} mod={m} type={m.anchorTiers?"anchor":"standard"} />)}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{background:"#fff",borderRadius:12,border:"1px solid #a8c4f5",marginBottom:16,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,84,188,0.08)"}}>
                  <div style={{padding:"12px 18px",borderBottom:"2px solid #0054BC",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,#051836,#0E387C)"}}>
                    <div>
                      <h3 style={{fontSize:13,fontWeight:900,color:"#fff",margin:"0 0 2px"}}>Module Configuration</h3>
                      <p style={{fontSize:9,color:"#4196ff",margin:0}}>{getAnchors(tier).length} anchor modules included - {selectableHrsBudget} selectable hrs/yr - {DOMAIN_HOUR_CAP}hr domain cap</p>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      {!allYearsFull&&selectableHrsBudget>0&&<span style={{fontSize:8,color:"#C8DA2B",fontWeight:700,background:"rgba(200,218,43,0.15)",padding:"3px 8px",borderRadius:5}}>{remaining} year{remaining!==1?"s":""} to configure</span>}
                      {allYearsFull&&<button onClick={()=>setSubmitted(true)} style={{padding:"10px 20px",background:"linear-gradient(135deg,#0054BC,#0DAC41)",color:"#fff",fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:1,border:"none",borderRadius:8,cursor:"pointer"}}>Submit to Matrix</button>}
                    </div>
                  </div>
                  <div style={{padding:14}}>
                    <div style={{display:"grid",gridTemplateColumns:`repeat(${contractYears},1fr)`,gap:10}}>
                      {activeYrs.map(y=>{
                        const yd = yearData[y];
                        const hrs = yearHrsUsed(y);
                        const full = hrs>=selectableHrsBudget&&selectableHrsBudget>0;
                        const isCopied = copied===y;
                        return (
                          <div key={y}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,padding:"6px 8px",background:"#e8f0fc",borderRadius:8}}>
                              <span style={{fontSize:9,fontWeight:900,color:"#051836",textTransform:"uppercase",letterSpacing:1}}>Year {y}</span>
                              <span style={{fontSize:8,color:full?"#0DAC41":"#0054BC",fontWeight:700,background:full?"#e8f8ee":"#fff",padding:"2px 7px",borderRadius:6,border:`1px solid ${full?"#0DAC41":"#a8c4f5"}`}}>{hrs}/{selectableHrsBudget}h</span>
                            </div>
                            {(()=>{
                              const availDomains = DOMAINS.filter(d => {
                                const a = d.access[tier];
                                if (!a || a==="excluded") return false;
                                return true;
                              });
                              return availDomains.map(dom => {
                                const isChoice = dom.access[tier]==="choice";
                                const chosenForYear = advDomainChoices[y];
                                const isChoiceAndNotChosen = isChoice && chosenForYear !== dom.id;
                                const domMods = yd.selected.map(id=>ALL_MODULES.find(x=>x.id===id)).filter(m=>m&&m.domain===dom.id);
                                const domHrs = domHrsUsed(y, dom.id);
                                const domFull = domHrs >= dom.hourCap;
                                const isEmpty = domMods.length === 0;
                                return (
                                  <div key={dom.id} style={{marginBottom:8,borderRadius:10,border:`2px solid ${isEmpty&&!isChoiceAndNotChosen?dom.border:domMods.length>0?dom.color:dom.border}`,background:isChoiceAndNotChosen?"#fafafa":isEmpty?dom.bg+"66":dom.bg,overflow:"hidden",opacity:isChoiceAndNotChosen?0.45:1,transition:"opacity 0.2s"}}>
                                    <div style={{padding:"7px 10px",borderBottom:`1px solid ${dom.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:dom.bg}}>
                                      <div style={{flex:1,minWidth:0}}>
                                        <span style={{fontSize:8,fontWeight:900,color:dom.color,display:"block",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{dom.name}</span>
                                      </div>
                                      <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0,marginLeft:6}}>
                                        {isChoice&&<button onClick={()=>{ if(!isChoiceAndNotChosen){ setAdvDomainChoices(p=>({...p,[y]:null})); setYearData(p=>({...p,[y]:{selected:p[y].selected.filter(id=>{ const m=ALL_MODULES.find(x=>x.id===id); return !m||m.domain!==dom.id; })}})); } else { setAdvDomainChoices(p=>({...p,[y]:dom.id})); }}} style={{fontSize:7,fontWeight:900,padding:"2px 7px",borderRadius:5,border:`1px solid ${dom.color}`,background:!isChoiceAndNotChosen?dom.color:"transparent",color:!isChoiceAndNotChosen?"#fff":dom.color,cursor:"pointer",textTransform:"uppercase",letterSpacing:0.5}}>{!isChoiceAndNotChosen?"Selected":"Select"}</button>}
                                        <span style={{fontSize:7,fontWeight:700,color:domFull?"#0DAC41":dom.color,background:"rgba(255,255,255,0.7)",padding:"2px 6px",borderRadius:5}}>{domHrs}/{dom.hourCap}h</span>
                                      </div>
                                    </div>
                                    {isEmpty&&!isChoiceAndNotChosen&&<div style={{padding:"8px 10px 6px"}}>
                                      <p style={{fontSize:8,color:dom.color,opacity:0.65,margin:"0 0 6px",lineHeight:1.4,fontStyle:"italic"}}>{dom.desc}</p>
                                      {!domFull&&!full&&<button onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setMenuRect(r);setMenu({year:y,domainFilter:dom.id});}} style={{width:"100%",border:`1.5px dashed ${dom.border}`,borderRadius:8,padding:"5px 0",fontSize:8,fontWeight:900,color:dom.color,background:"rgba(255,255,255,0.6)",cursor:"pointer",textTransform:"uppercase",letterSpacing:1}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.95)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.6)"}>+ Add modules</button>}
                                    </div>}
                                    {!isEmpty&&<div style={{padding:"6px 8px"}}>
                                      {domMods.map(m=><ModCard key={m.id} mod={m} type="standard" onRemove={()=>remSel(y,m.id)} />)}
                                      {!domFull&&!full&&<button onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setMenuRect(r);setMenu({year:y,domainFilter:dom.id});}} style={{width:"100%",border:`1.5px dashed ${dom.border}`,borderRadius:8,padding:"4px 0",fontSize:7,fontWeight:900,color:dom.color,background:"none",cursor:"pointer",textTransform:"uppercase",letterSpacing:1,marginTop:4}} onMouseEnter={e=>e.currentTarget.style.background=dom.bg} onMouseLeave={e=>e.currentTarget.style.background="none"}>+ Add more</button>}
                                      {domFull&&<div style={{textAlign:"center",fontSize:7,fontWeight:700,color:"#0DAC41",textTransform:"uppercase",padding:"3px 0"}}>Domain full</div>}
                                    </div>}
                                  </div>
                                );
                              });
                            })()}
                            {yd.selected.length>0&&<button onClick={()=>copyAll(y)} style={{width:"100%",marginTop:4,border:`1px solid ${isCopied?"#0DAC41":"#a8c4f5"}`,borderRadius:8,padding:"4px 0",fontSize:7,fontWeight:900,color:isCopied?"#0DAC41":"#0054BC",background:isCopied?"#e8f8ee":"#e8f0fc",cursor:"pointer",textTransform:"uppercase",letterSpacing:1}}>{isCopied?"Copied!":"Copy all"}</button>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {menu&&<ModMenu year={menu.year} tier={tier} selIds={yearData[menu.year].selected} onSelect={mod=>{addSel(menu.year,mod);setMenu(null);}} onClose={()=>setMenu(null)} rect={menuRect} advDomainChoiceForYear={advDomainChoices[menu.year]} domainFilter={menu.domainFilter||null} selectableHrsBudget={selectableHrsBudget} yearHrsUsed={yearHrsUsed} />}
    </div>
  );
}
