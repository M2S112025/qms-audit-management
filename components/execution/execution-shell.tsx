"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Maximize2,
  Menu,
  PanelLeft,
  PanelRight,
  Pause,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  applicableQuestions,
  createSeedExecution,
  executionScore,
  executionCompletionIssues,
  type AuditExecutionState,
  type AuditResponse,
  type ExecutionFinding,
  type QuestionEvidence,
  type ResponseValue,
} from "@/data/execution";
import { useQmsAudits, updateAudit } from "@/lib/qms-store";
import { loadExecution, persistExecution } from "@/lib/execution-store";
import {
  ChecklistNavigator,
  type ChecklistFilter,
} from "./checklist-navigator";
import { ExecutionContext, QuestionWorkspace } from "./question-workspace";
import {
  AuditReview,
  BestPracticeDrawer,
  EvidencePreview,
  FindingDrawer,
  ProgressPopover,
} from "./execution-panels";
import { saveBestPractice } from "@/lib/best-practice-store";
import { currentUser } from "@/data/current-user";

export function AuditExecutionShell({ auditId }: { auditId: string }) {
  const router = useRouter();
  const audits = useQmsAudits();
  const audit = audits.find((a) => a.id === auditId);
  const [state, setState] = useState<AuditExecutionState>(() =>
    createSeedExecution(auditId),
  );
  const [saveState, setSaveState] = useState<"Saving..." | "Saved locally ✓">(
    "Saved locally ✓",
  );
  const [filter, setFilter] = useState<ChecklistFilter>("All");
  const [review, setReview] = useState(false);
  const [progress, setProgress] = useState(false);
  const [finding, setFinding] = useState(false);
  const [bestPractice, setBestPractice] = useState(false);
  const [preview, setPreview] = useState<QuestionEvidence>();
  const [navOpen, setNavOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [toast, setToast] = useState("");
  const [completionIssues,setCompletionIssues]=useState<ReturnType<typeof executionCompletionIssues>>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => setState(loadExecution(auditId)), [auditId]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const commit = useCallback(
    (change: (previous: AuditExecutionState) => AuditExecutionState) => {
      if(audit?.status==="Completed")return;
      setSaveState("Saving...");
      setState((previous) => {
        const next = change(previous);
        persistExecution(next);
        return next;
      });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSaveState("Saved locally ✓"), 650);
    },
    [audit?.status],
  );
  const checklist = state.checklist;
  const visibleQuestions = applicableQuestions(state);
  const current =
    visibleQuestions.find((q) => q.id === state.currentQuestionId) ??
    visibleQuestions[0] ??
    checklist.questions[0];
  const answered = visibleQuestions.filter(
    (question) => state.responses[question.id]?.response,
  ).length;
  const percent = visibleQuestions.length
    ? Math.round((answered / visibleQuestions.length) * 100)
    : 0;
  function updateResponse(change: Partial<AuditResponse>) {
    if(audit?.status==='Completed')return;
    commit((s) => ({
      ...s,
      responses: {
        ...s.responses,
        [current.id]: {
          ...s.responses[current.id],
          ...change,
          answeredBy: change.response
            ? currentUser.name
            : s.responses[current.id].answeredBy,
          answeredAt: change.response
            ? new Date().toISOString()
            : s.responses[current.id].answeredAt,
        },
      },
    }));
  }
  const select = useCallback(
    (id: string) => {
      commit((s) => ({ ...s, currentQuestionId: id }));
      setReview(false);
      setNavOpen(false);
    },
    [commit],
  );
  const navigate = useCallback(
    (delta: number) => {
      const index = visibleQuestions.findIndex((q) => q.id === current.id);
      const next = visibleQuestions[index + delta];
      if (next) select(next.id);
    },
    [current.id, select, visibleQuestions],
  );
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      )
        return;
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [navigate]);
  function evidence(kind: QuestionEvidence["kind"]) {
    const id = `EVD-${Date.now()}`;
    const item: QuestionEvidence = {
      id,
      questionId: current.id,
      name:
        kind === "Photo"
          ? "IMG_2048.jpg"
          : kind === "Document"
            ? "Calibration_Record.pdf"
            : "SOP-QA-014",
      kind,
      size:
        kind === "Photo"
          ? "2.4 MB"
          : kind === "Document"
            ? "1.1 MB"
            : undefined,
      uploadedBy: currentUser.name,
      date: new Date().toLocaleDateString("en",{day:"2-digit",month:"short",year:"numeric"}),
    };
    commit((s) => ({
      ...s,
      evidence: [...s.evidence, item],
      responses: {
        ...s.responses,
        [current.id]: {
          ...s.responses[current.id],
          evidenceIds: [...s.responses[current.id].evidenceIds, id],
        },
      },
    }));
  }
  function createFinding(item: ExecutionFinding) {
    commit((s) => ({
      ...s,
      findings: [...s.findings, item],
      responses: {
        ...s.responses,
        [current.id]: {
          ...s.responses[current.id],
          findingIds: [...s.responses[current.id].findingIds, item.id],
        },
      },
      activity: [
        {
          id: `EA-${Date.now()}`,
          date: "Sep 08 · 4:18 PM",
          actor: currentUser.name,
          action: `created finding ${item.id}.`,
        },
        ...s.activity,
      ],
    }));
    setFinding(false);
    setToast(`Finding ${item.id} created`);
    setTimeout(() => setToast(""), 2500);
  }
  function pause() {
    commit((s) => ({
      ...s,
      activity: [
        {
          id: `EA-${Date.now()}`,
          date: "Sep 08 · 4:30 PM",
          actor: currentUser.name,
          action: "paused the audit.",
        },
        ...s.activity,
      ],
    }));
    router.push(`/audits/${auditId}`);
  }
  function complete() {
    commit((s) => ({
      ...s,
      completed: true,
      activity: [
        {
          id: `EA-${Date.now()}`,
          date: "Sep 08 · 4:42 PM",
          actor: currentUser.name,
          action: "completed the audit checklist.",
        },
        ...s.activity,
      ],
    }));
    updateAudit(auditId, {
      status: "Review & Report",
      score: executionScore(state),
    });
    router.push(`/audits/${auditId}`);
  }
  if (!audit)
    return <div className="execution-loading">Loading audit execution…</div>;
  return (
    <div className={`execution-shell ${audit.status==="Completed"?"is-readonly":""}`}>
      <ExecutionTop
        auditId={auditId}
        title={audit.title}
        answered={answered}
        total={visibleQuestions.length}
        percent={percent}
        saveState={saveState}
        onProgress={() => setProgress(!progress)}
        onPause={pause}
        onExit={() => router.push(`/audits/${auditId}`)}
        onNav={() => setNavOpen(true)}
        onContext={() => setContextOpen(true)}
        navCollapsed={navCollapsed}
        contextCollapsed={contextCollapsed}
        focusMode={focusMode}
        onToggleNav={() => setNavCollapsed((value) => !value)}
        onToggleContext={() => setContextCollapsed((value) => !value)}
        onToggleFocus={() => setFocusMode((value) => !value)}
      />
      {progress && (
        <ProgressPopover
          state={state}
          onClose={() => setProgress(false)}
          onReview={() => {
            setProgress(false);
            setReview(true);
          }}
        />
      )}
      {audit.status==='Completed'&&<div className="execution-readonly-banner">Completed audit · checklist is read-only</div>}
      {!!completionIssues.length&&<div className="execution-validation" role="alert"><b>{completionIssues.length} items need attention before this audit can be completed.</b>{completionIssues.map(issue=><button key={`${issue.questionId}-${issue.message}`} onClick={()=>{select(issue.questionId);setCompletionIssues([])}}><span>{issue.code}</span>{issue.message}</button>)}</div>}
      <div
        className={`execution-layout ${navCollapsed ? "nav-collapsed" : ""} ${contextCollapsed ? "context-collapsed" : ""} ${focusMode ? "focus-mode" : ""}`}
      >
        <div
          className={`execution-nav-pane ${navOpen ? "mobile-pane-open" : ""}`}
        >
          <ChecklistNavigator
            state={state}
            current={current.id}
            filter={filter}
            setFilter={setFilter}
            onSelect={select}
            onClose={() => setNavOpen(false)}
          />
        </div>
        {review ? (
          <AuditReview
            state={state}
            onQuestion={select}
            onComplete={() => {const issues=executionCompletionIssues(state);setCompletionIssues(issues);if(!issues.length)setConfirmComplete(true)}}
          />
        ) : (
          <QuestionWorkspace
            question={current}
            state={state}
            onResponse={(value) =>
              updateResponse({
                response: value,
                naReason:
                  value === "na" ? state.responses[current.id].naReason : "",
                findingIds:
                  value === "conform" || value === "na"
                    ? []
                    : state.responses[current.id].findingIds,
              })
            }
            onNotes={(notes) => updateResponse({ notes })}
            onNaReason={(naReason) => updateResponse({ naReason })}
            onFlag={() =>
              updateResponse({ flagged: !state.responses[current.id].flagged })
            }
            onAddEvidence={evidence}
            onRemoveEvidence={(id) =>
              commit((s) => ({
                ...s,
                evidence: s.evidence.filter((e) => e.id !== id),
                responses: {
                  ...s.responses,
                  [current.id]: {
                    ...s.responses[current.id],
                    evidenceIds: s.responses[current.id].evidenceIds.filter(
                      (x) => x !== id,
                    ),
                  },
                },
              }))
            }
            onPreview={setPreview}
            onCreateFinding={() => setFinding(true)}
            onRecordBestPractice={() => setBestPractice(true)}
            onEvidenceReference={(id, recordReference) =>
              commit((s) => ({
                ...s,
                evidence: s.evidence.map((item) =>
                  item.id === id ? { ...item, recordReference } : item,
                ),
              }))
            }
            onNavigate={navigate}
            onReview={() => setReview(true)}
            conditionalApplicable={visibleQuestions.filter(
              (question) => question.displayRule?.mode === "conditional",
            ).length}
          />
        )}
        <div
          className={`execution-context-pane ${contextOpen ? "mobile-pane-open" : ""}`}
        >
          <ExecutionContext question={current} state={state} audit={audit} />
          <button
            className="context-mobile-close"
            onClick={() => setContextOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      {finding && (
        <FindingDrawer
          state={state}
          questionId={current.id}
          onClose={() => setFinding(false)}
          onCreate={createFinding}
        />
      )}{" "}
      {bestPractice && (
        <BestPracticeDrawer
          state={state}
          audit={audit}
          questionId={current.id}
          onClose={() => setBestPractice(false)}
          onCreate={(practice) => {
            saveBestPractice(practice);
            setBestPractice(false);
            setToast(`${practice.id} best practice recorded`);
            setTimeout(() => setToast(""), 2500);
          }}
        />
      )}{" "}
      {preview && (
        <EvidencePreview
          evidence={preview}
          question={`${current.clause} ${current.title}`}
          onClose={() => setPreview(undefined)}
        />
      )}{" "}
      {confirmComplete && (
        <CompletionConfirm
          state={state}
          onCancel={() => setConfirmComplete(false)}
          onComplete={complete}
        />
      )}{" "}
      {toast && <div className="qms-toast">{toast}</div>}
    </div>
  );
}

function ExecutionTop({
  auditId,
  title,
  answered,
  total,
  percent,
  saveState,
  onProgress,
  onPause,
  onExit,
  onNav,
  onContext,
  navCollapsed,
  contextCollapsed,
  focusMode,
  onToggleNav,
  onToggleContext,
  onToggleFocus,
}: {
  auditId: string;
  title: string;
  answered: number;
  total: number;
  percent: number;
  saveState: string;
  onProgress: () => void;
  onPause: () => void;
  onExit: () => void;
  onNav: () => void;
  onContext: () => void;
  navCollapsed: boolean;
  contextCollapsed: boolean;
  focusMode: boolean;
  onToggleNav: () => void;
  onToggleContext: () => void;
  onToggleFocus: () => void;
}) {
  return (
    <header className="execution-top">
      <div className="execution-brand">
        <span>Q</span>
        <i />
        <div>
          <b>{auditId}</b>
          <small>{title}</small>
        </div>
      </div>
      <button className="mobile-execution-control" onClick={onNav}>
        <Menu size={16} />
      </button>
      <button className="top-progress" onClick={onProgress}>
        <span>
          <b>
            {answered} / {total} answered
          </b>
          <small>{percent}%</small>
        </span>
        <i>
          <em style={{ width: `${percent}%` }} />
        </i>
        <ChevronDown size={13} />
      </button>
      <div className="execution-actions">
        <span className={saveState === "Saving..." ? "saving" : ""}>
          {saveState === "Saving..." ? <Save size={13} /> : <Check size={13} />}{" "}
          {saveState}
        </span>
        <button
          className={navCollapsed ? "is-active" : ""}
          onClick={onToggleNav}
          aria-pressed={navCollapsed}
        >
          <PanelLeft size={14} /> Checklist
        </button>
        <button
          className={focusMode ? "is-active" : ""}
          onClick={onToggleFocus}
          aria-pressed={focusMode}
        >
          <Maximize2 size={14} /> Focus Mode
        </button>
        <button
          className={contextCollapsed ? "is-active" : ""}
          onClick={onToggleContext}
          aria-pressed={contextCollapsed}
        >
          <PanelRight size={14} /> Context
        </button>
        <button onClick={onPause}>
          <Pause size={13} />
          Pause Audit
        </button>
        <button onClick={onExit}>Exit</button>
        <button className="mobile-execution-control" onClick={onContext}>
          <PanelRight size={16} />
        </button>
      </div>
    </header>
  );
}
function CompletionConfirm({
  state,
  onCancel,
  onComplete,
}: {
  state: AuditExecutionState;
  onCancel: () => void;
  onComplete: () => void;
}) {
  const visible = applicableQuestions(state);
  const values = visible.map((question) => state.responses[question.id]);
  const count = (v: ResponseValue) =>
    values.filter((r) => r.response === v).length;
  return (
    <div className="execution-confirm-overlay">
      <section className="completion-confirm">
        <h2>Complete Audit Checklist?</h2>
        <p>
          Completing moves this audit to Review &amp; Report. Further edits require
          reopening.
        </p>
        <div className="confirm-total">
          <b>
            {visible.length} / {visible.length}
          </b>
          <span>answered</span>
        </div>
        {(
          [
            "conform",
            "minor_nc",
            "major_nc",
            "observation",
            "ofi",
            "na",
          ] as ResponseValue[]
        ).map((v) => (
          <div key={v}>
            <span>
              {v.replace("_", " ").replace(/\b\w/g, (x) => x.toUpperCase())}
            </span>
            <b>{count(v)}</b>
          </div>
        ))}
        <div>
          <span>Findings</span>
          <b>{state.findings.length}</b>
        </div>
        <footer>
          <button className="button-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="button-primary" onClick={onComplete}>
            Complete Checklist
          </button>
        </footer>
      </section>
    </div>
  );
}
