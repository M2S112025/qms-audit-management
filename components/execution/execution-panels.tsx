"use client";
import { useState } from "react";
import { Check, File, Image as ImageIcon, Link2, Plus, X } from "lucide-react";
import type {
  BestPractice,
  BestPracticeEvidence,
  BestPracticeRecommendation,
} from "@/data/best-practices";
import type { Audit } from "@/data/audits";
import { businessLineName } from "@/data/organization";
import { nextBestPracticeId } from "@/lib/best-practice-store";
import {
  applicableQuestions,
  responseLabels,
  type AuditExecutionState,
  type ExecutionFinding,
  type QuestionEvidence,
  type ResponseValue,
} from "@/data/execution";

export function FindingDrawer({
  state,
  questionId,
  onClose,
  onCreate,
}: {
  state: AuditExecutionState;
  questionId: string;
  onClose: () => void;
  onCreate: (finding: ExecutionFinding) => void;
}) {
  const question = state.checklist.questions.find((q) => q.id === questionId)!;
  const response = state.responses[questionId].response;
  const preset =
    response === "major_nc"
      ? "Major Nonconformity"
      : response === "minor_nc"
        ? "Minor Nonconformity"
        : response === "ofi"
          ? "Opportunity for Improvement"
          : "Observation";
  const [type, setType] = useState<ExecutionFinding["type"]>(preset);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] =
    useState<ExecutionFinding["priority"]>("High");
  const [errors, setErrors] = useState<Record<string, string>>({});
  function submit() {
    const next: Record<string, string> = {};
    if (!title) next.title = "Finding title is required.";
    if (!description) next.description = "Description is required.";
    if (!owner) next.owner = "Responsible person is required.";
    if (!due) next.due = "Due date is required.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const highest = Math.max(
      33,
      ...state.findings.map((f) => Number(f.id.split("-").pop())),
    );
    onCreate({
      id: `FND-2026-${String(highest + 1).padStart(3, "0")}`,
      auditId: state.auditId,
      questionId,
      clause: question.clause,
      type,
      title,
      description,
      owner,
      dueDate: due,
      priority,
      status: "Open",
    });
  }
  return (
    <>
      <button className="drawer-scrim execution-overlay" onClick={onClose} />
      <aside className="qms-drawer finding-drawer">
        <header>
          <div>
            <h2>Create Finding</h2>
            <p>
              {state.auditId} · Question {question.number}
            </p>
          </div>
          <button onClick={onClose}>
            <X size={17} />
          </button>
        </header>
        <div className="drawer-body">
          <form className="drawer-form">
            <Form label="Finding Type *">
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as ExecutionFinding["type"])
                }
              >
                {[
                  "Major Nonconformity",
                  "Minor Nonconformity",
                  "Observation",
                  "Opportunity for Improvement",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Form>
            <Form label="Finding Title *" error={errors.title}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Form>
            <Form label="Description *" error={errors.description}>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form>
            <Form label="Clause">
              <input
                value={`${state.checklist.standard} — ${question.clause}`}
                disabled
              />
            </Form>
            <div className="form-pair">
              <Form label="Location">
                <input value="Chennai Plant" disabled />
              </Form>
              <Form label="Department">
                <input value="Quality" disabled />
              </Form>
            </div>
            <Form label="Evidence">
              <div className="finding-evidence">
                {state.evidence
                  .filter((e) =>
                    state.responses[questionId].evidenceIds.includes(e.id),
                  )
                  .map((e) => (
                    <span key={e.id}>{e.name}</span>
                  ))}
                <button type="button">+ Add Evidence</button>
              </div>
            </Form>
            <Form label="Responsible Person *" error={errors.owner}>
              <select value={owner} onChange={(e) => setOwner(e.target.value)}>
                <option value="">Select person</option>
                {["Siva Kumar", "Rumesh Ravi", "Manoj", "Lakshman"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Form>
            <div className="form-pair">
              <Form label="Due Date *" error={errors.due}>
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </Form>
              <Form label="Priority *">
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as ExecutionFinding["priority"])
                  }
                >
                  {["Critical", "High", "Medium", "Low"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Form>
            </div>
          </form>
        </div>
        <footer>
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button-primary" onClick={submit}>
            Create Finding
          </button>
        </footer>
      </aside>
    </>
  );
}

export function BestPracticeDrawer({
  state,
  audit,
  questionId,
  onClose,
  onCreate,
}: {
  state: AuditExecutionState;
  audit: Audit;
  questionId: string;
  onClose: () => void;
  onCreate: (practice: BestPractice) => void;
}) {
  const question = state.checklist.questions.find(
    (item) => item.id === questionId,
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recordReference, setRecordReference] = useState("");
  const [recommendedFor, setRecommendedFor] =
    useState<BestPracticeRecommendation | "">("");
  const [evidence, setEvidence] = useState<BestPracticeEvidence[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function addEvidence(type: BestPracticeEvidence["type"]) {
    const names = {
      Photo: "Best_Practice_Photo.jpg",
      Document: "Best_Practice_Record.pdf",
      Link: "Reference link",
    };
    setEvidence((items) => [
      ...items,
      {
        id: `BPE-${Date.now()}`,
        name: names[type],
        type,
        recordReference: recordReference || undefined,
      },
    ]);
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Best practice title is required.";
    if (!description.trim()) next.description = "Description is required.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onCreate({
      id: nextBestPracticeId(),
      auditId: audit.id,
      questionId: question?.id,
      title: title.trim(),
      description: description.trim(),
      clause: question?.clause,
      location: audit.location,
      businessLineId: audit.businessLineId,
      department: audit.department,
      recordReference: recordReference.trim() || undefined,
      evidence,
      recommendedFor: recommendedFor || undefined,
      createdBy: "Lakshman",
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <>
      <button
        className="drawer-scrim execution-overlay"
        onClick={onClose}
        aria-label="Close best practice drawer"
      />
      <aside
        className="qms-drawer best-practice-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Record Best Practice"
      >
        <header>
          <div>
            <h2>Record Best Practice</h2>
            <p>
              {audit.id} · {question ? `Question ${question.number}` : "Audit"}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </header>
        <div className="drawer-body">
          <form className="drawer-form" onSubmit={(event) => event.preventDefault()}>
            <Form label="Best Practice Title *" error={errors.title}>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Form>
            <Form label="Description *" error={errors.description}>
              <textarea
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Form>
            <div className="form-pair">
              <Form label="Audit">
                <input value={`${audit.id} · ${audit.title}`} disabled />
              </Form>
              <Form label="Question / Clause">
                <input
                  value={
                    question
                      ? `${question.code} · ${question.clause}`
                      : "Audit-level record"
                  }
                  disabled
                />
              </Form>
            </div>
            <div className="form-pair">
              <Form label="Location">
                <input value={audit.location} disabled />
              </Form>
              <Form label="Business Line">
                <input value={businessLineName(audit.businessLineId)} disabled />
              </Form>
            </div>
            <Form label="Department">
              <input value={audit.department} disabled />
            </Form>
            <Form label="Record / Reference Number">
              <input
                value={recordReference}
                onChange={(event) => setRecordReference(event.target.value)}
                placeholder="CAL-2026-0291"
              />
            </Form>
            <Form label="Evidence">
              <div className="best-practice-evidence">
                {evidence.map((item) => (
                  <div key={item.id}>
                    <span>{item.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEvidence((items) =>
                          items.filter((evidenceItem) => evidenceItem.id !== item.id),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="evidence-add">
                  <button type="button" onClick={() => addEvidence("Photo")}>
                    <ImageIcon size={13} /> Photo
                  </button>
                  <button type="button" onClick={() => addEvidence("Document")}>
                    <File size={13} /> Document
                  </button>
                  <button type="button" onClick={() => addEvidence("Link")}>
                    <Link2 size={13} /> Link
                  </button>
                </div>
              </div>
            </Form>
            <Form label="Recommended For">
              <select
                value={recommendedFor}
                onChange={(event) =>
                  setRecommendedFor(
                    event.target.value as BestPracticeRecommendation | "",
                  )
                }
              >
                <option value="">Not specified</option>
                <option>Local Practice</option>
                <option>Share Across Location</option>
                <option>Share Across Organization</option>
              </select>
            </Form>
          </form>
        </div>
        <footer>
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button-primary" onClick={submit}>
            <Plus size={13} /> Save Best Practice
          </button>
        </footer>
      </aside>
    </>
  );
}

function Form({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`field ${error ? "field-error" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}
export function EvidencePreview({
  evidence,
  question,
  onClose,
}: {
  evidence: QuestionEvidence;
  question: string;
  onClose: () => void;
}) {
  return (
    <div className="evidence-preview-overlay">
      <div className="evidence-preview">
        <header>
          <h2>Evidence Preview</h2>
          <button onClick={onClose}>
            <X size={17} />
          </button>
        </header>
        <div className="preview-stage">
          {evidence.kind === "Photo" ? (
            <ImageIcon size={42} />
          ) : (
            <File size={42} />
          )}
          <b>{evidence.kind} preview</b>
          <span>Preview content is simulated for this MVP.</span>
        </div>
        <div className="preview-meta">
          <Meta label="File Name" value={evidence.name} />
          <Meta label="Uploaded By" value={evidence.uploadedBy} />
          <Meta label="Date" value={evidence.date} />
          <Meta label="Question" value={question} />
          <Meta label="Category" value={evidence.kind} />
          <Meta
            label="Record / Reference Number"
            value={evidence.recordReference || "Not provided"}
          />
        </div>
      </div>
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export function ProgressPopover({
  state,
  onReview,
  onClose,
}: {
  state: AuditExecutionState;
  onReview: () => void;
  onClose: () => void;
}) {
  const visible = applicableQuestions(state);
  const values = visible.map((question) => state.responses[question.id]);
  const count = (v: ResponseValue) =>
    values.filter((r) => r.response === v).length;
  const answered = values.filter((r) => r.response).length;
  const total = visible.length;
  return (
    <div className="progress-popover">
      <header>
        <span>Audit Progress</span>
        <button onClick={onClose}>
          <X size={14} />
        </button>
      </header>
      <div className="progress-big">
        <b>
          {answered} / {total}
        </b>
        <span>{Math.round((answered / total) * 100)}%</span>
      </div>
      <div className="mini-progress">
        <i style={{ width: `${(answered / total) * 100}%` }} />
      </div>
      {(Object.keys(responseLabels) as ResponseValue[]).map((v) => (
        <div className="progress-row" key={v}>
          <span>{responseLabels[v]}</span>
          <b>{count(v)}</b>
        </div>
      ))}
      <div className="progress-row divider">
        <span>Unanswered</span>
        <b>{total - answered}</b>
      </div>
      <div className="progress-row">
        <span>Flagged</span>
        <b>{values.filter((r) => r.flagged).length}</b>
      </div>
      <div className="progress-row">
        <span>Findings</span>
        <b>{state.findings.length}</b>
      </div>
      <button className="progress-review" onClick={onReview}>
        View Audit Review →
      </button>
    </div>
  );
}

export function AuditReview({
  state,
  onQuestion,
  onComplete,
}: {
  state: AuditExecutionState;
  onQuestion: (id: string) => void;
  onComplete: () => void;
}) {
  const visible = applicableQuestions(state);
  const visibleIds = new Set(visible.map((question) => question.id));
  const values = visible.map((question) => state.responses[question.id]);
  const answered = values.filter((r) => r.response).length;
  const flagged = values.filter((r) => r.flagged).length;
  const total = visible.length;
  const issues = completionIssues(state);
  return (
    <div className="audit-review">
      <header>
        <span>Audit Review</span>
        <h1>Checklist completion review</h1>
        <p>
          Resolve incomplete responses and required findings before completing
          execution.
        </p>
      </header>
      <div className="review-summary">
        <Summary value={total} label="Questions" />
        <Summary value={answered} label="Answered" />
        <Summary value={total - answered} label="Unanswered" />
        <Summary value={flagged} label="Flagged" />
        <Summary value={state.findings.length} label="Findings" />
      </div>
      <section>
        <h2>Review by Section</h2>
        {state.checklist.sections.map((s) => {
          const applicableIds = s.questionIds.filter((id) =>
            visibleIds.has(id),
          );
          if (!applicableIds.length) return null;
          const complete = applicableIds.filter(
            (id) => state.responses[id].response,
          ).length;
          return (
            <button
              key={s.id}
              onClick={() =>
                onQuestion(
                  applicableIds.find((id) => !state.responses[id].response) ??
                    applicableIds[0],
                )
              }
            >
              <span>
                <b>
                  {s.number}. {s.title}
                </b>
                <small>
                  {complete === applicableIds.length
                    ? "Complete"
                    : `${applicableIds.length - complete} unanswered`}
                </small>
              </span>
              <strong>
                {complete} / {applicableIds.length}
              </strong>
            </button>
          );
        })}
      </section>
      <section className="review-attention">
        <h2>Requires Attention</h2>
        {issues.length ? (
          issues.map((issue) => (
            <button
              key={issue.questionId}
              onClick={() => onQuestion(issue.questionId)}
            >
              <span>
                Question{" "}
                {
                  state.checklist.questions.find(
                    (q) => q.id === issue.questionId,
                  )?.number
                }
              </span>
              <b>{issue.message}</b>
            </button>
          ))
        ) : (
          <div className="review-ready">
            <Check size={18} />
            <span>All checklist completion requirements are satisfied.</span>
          </div>
        )}
      </section>
      <footer>
        <div>
          <b>
            {issues.length
              ? "Audit checklist cannot be completed"
              : "Ready to complete checklist"}
          </b>
          <span>
            {issues.length
              ? `${issues.length} items require attention`
              : "All mandatory questions and finding requirements are complete."}
          </span>
        </div>
        <button
          className="button-primary"
          disabled={!!issues.length}
          onClick={onComplete}
        >
          Complete Audit Checklist
        </button>
      </footer>
    </div>
  );
}
function Summary({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
export function completionIssues(state: AuditExecutionState) {
  const issues: { questionId: string; message: string }[] = [];
  applicableQuestions(state).forEach((q) => {
    const r = state.responses[q.id];
    if (!r?.response)
      issues.push({
        questionId: q.id,
        message: `${q.clause} ${q.title} has no response`,
      });
    else if (
      r.response === "na" &&
      (q.naRequireJustification ?? true) &&
      !r.naReason.trim()
    )
      issues.push({
        questionId: q.id,
        message: `${q.clause} requires an N/A reason`,
      });
    else if (
      ((r.response === "minor_nc" && (q.findingRules?.minor ?? true)) ||
        (r.response === "major_nc" && (q.findingRules?.major ?? true)) ||
        (r.response === "observation" &&
          (q.findingRules?.observation ?? false)) ||
        (r.response === "ofi" && q.findingRules?.ofi === "required")) &&
      !r.findingIds.length
    )
      issues.push({
        questionId: q.id,
        message: `${responseLabels[r.response]} on ${q.clause} has no finding`,
      });
    else if (q.requireNote && !r.notes.trim())
      issues.push({
        questionId: q.id,
        message: `${q.clause} requires an auditor note`,
      });
    else if (
      (q.evidenceRule?.mode === "required" ||
        (q.evidenceRule?.mode === "conditional" &&
          q.evidenceRule.responses.includes(r.response))) &&
      !r.evidenceIds.length
    )
      issues.push({
        questionId: q.id,
        message: `${q.clause} requires evidence for this response`,
      });
  });
  return issues;
}
