"use client";
import Link from "next/link";
import type { Audit } from "@/data/audits";
import { businessLineName } from "@/data/organization";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Eye,
  File,
  Image as ImageIcon,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  applicableQuestions,
  responseClass,
  responseLabels,
  type AuditExecutionState,
  type AuditQuestion,
  type QuestionEvidence,
  type ResponseValue,
} from "@/data/execution";

export function QuestionWorkspace({
  question,
  state,
  onResponse,
  onNotes,
  onNaReason,
  onFlag,
  onAddEvidence,
  onRemoveEvidence,
  onPreview,
  onCreateFinding,
  onRecordBestPractice,
  onEvidenceReference,
  onNavigate,
  onReview,
  conditionalApplicable,
}: {
  question: AuditQuestion;
  state: AuditExecutionState;
  onResponse: (v: ResponseValue) => void;
  onNotes: (v: string) => void;
  onNaReason: (v: string) => void;
  onFlag: () => void;
  onAddEvidence: (kind: QuestionEvidence["kind"]) => void;
  onRemoveEvidence: (id: string) => void;
  onPreview: (e: QuestionEvidence) => void;
  onCreateFinding: () => void;
  onRecordBestPractice: () => void;
  onEvidenceReference: (id: string, recordReference: string) => void;
  onNavigate: (delta: number) => void;
  onReview: () => void;
  conditionalApplicable: number;
}) {
  const checklist = state.checklist;
  const response = state.responses[question.id];
  const evidences = state.evidence.filter((e) =>
    response.evidenceIds.includes(e.id),
  );
  const finding = state.findings.find((f) =>
    response.findingIds.includes(f.id),
  );
  const rules = question.findingRules;
  const findingRequired =
    response.response === "minor_nc"
      ? (rules?.minor ?? true)
      : response.response === "major_nc"
        ? (rules?.major ?? true)
        : response.response === "observation"
          ? (rules?.observation ?? false)
          : response.response === "ofi"
            ? rules?.ofi === "required"
          : false;
  const findingPermitted =
    response.response === "ofi" && (rules?.ofi ?? "optional") !== "none";
  const allowed =
    question.allowedResponses ??
    (Object.keys(responseLabels) as ResponseValue[]);
  const naRequired = question.naRequireJustification ?? true;
  const visibleQuestions = applicableQuestions(state);
  const visibleIndex = visibleQuestions.findIndex(
    (item) => item.id === question.id,
  );
  return (
    <main className="question-workspace">
      <div className="question-scroll">
        <header className="question-header">
          <div>
            <span>
              Section {question.sectionId.replace(/^(SEC|TS)-/, "")} —{" "}
              {
                checklist.sections.find((s) => s.id === question.sectionId)
                  ?.title
              }
            </span>
            <small>
              Question {visibleIndex + 1} of {visibleQuestions.length}
            </small>
          </div>
          <button
            className={response.flagged ? "flagged" : ""}
            onClick={onFlag}
          >
            <Bookmark size={14} />
            {response.flagged ? "Flagged" : "Flag for Review"}
          </button>
        </header>
        <div className="question-content">
          <div className="clause-line">
            <span>Clause {question.clause}</span>
            <b>
              {question.code} · {checklist.standard} — Clause {question.clause}
            </b>
          </div>
          {conditionalApplicable > 0 && (
            <p className="conditional-applicable-note">
              {conditionalApplicable} conditional question
              {conditionalApplicable === 1 ? " is" : "s are"} currently applicable.
            </p>
          )}
          <h1>{question.question}</h1>
          <section className="response-section">
            <h2>Response</h2>
            <div
              className="response-options"
              role="radiogroup"
              aria-label="Audit response"
            >
              {allowed.map((value) => (
                <button
                  role="radio"
                  aria-checked={response.response === value}
                  className={`${responseClass[value]} ${response.response === value ? "selected" : ""}`}
                  key={value}
                  onClick={() => onResponse(value)}
                >
                  <i />
                  {responseLabels[value]}
                </button>
              ))}
            </div>
            {response.response === "na" && naRequired && (
              <label
                className={`na-reason ${!response.naReason ? "required" : ""}`}
              >
                <span>Reason for N/A *</span>
                <textarea
                  value={response.naReason}
                  onChange={(e) => onNaReason(e.target.value)}
                  placeholder="Explain why this requirement is not applicable..."
                />
                {!response.naReason && (
                  <small>
                    A reason is required before checklist completion.
                  </small>
                )}
              </label>
            )}
            {findingRequired && !finding && (
              <div className="finding-required">
                <span>
                  <b>Finding required</b>
                  <small>Create a finding before checklist completion.</small>
                </span>
                <button className="button-secondary" onClick={onCreateFinding}>
                  <Plus size={13} />
                  Create Finding
                </button>
              </div>
            )}
            {findingPermitted && !finding && !findingRequired && (
              <div className="finding-optional">
                <span>
                  <b>Opportunity for Improvement</b>
                  <small>A finding is optional for this response.</small>
                </span>
                <button className="button-secondary" onClick={onCreateFinding}>
                  <Plus size={13} /> Create Finding
                </button>
              </div>
            )}
            {finding && (
              <div className="question-finding">
                <span>Finding</span>
                <div>
                  <code>{finding.id}</code>
                  <b>{finding.type}</b>
                  <small>{finding.status}</small>
                </div>
                <p>{finding.title}</p>
                <Link href={`/findings?record=${finding.id}`}>
                  Open Finding <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </section>
          <section className="notes-section">
            <h2>Auditor Notes</h2>
            <textarea
              value={response.notes}
              onChange={(e) => onNotes(e.target.value)}
              placeholder="Record observations, interview notes, document references or other audit evidence..."
            />
          </section>
          <section className="evidence-section">
            <header>
              <div>
                <h2>Evidence</h2>
                <span>{evidences.length} attached</span>
              </div>
              <div className="evidence-add">
                <button onClick={() => onAddEvidence("Photo")}>
                  <ImageIcon size={13} />
                  Photo
                </button>
                <button onClick={() => onAddEvidence("Document")}>
                  <File size={13} />
                  Document
                </button>
                <button onClick={() => onAddEvidence("Link")}>
                  <Link2 size={13} />
                  Link
                </button>
              </div>
            </header>
            {evidences.length ? (
              <div className="evidence-list">
                {evidences.map((e) => (
                  <div key={e.id}>
                    <span className="evidence-icon">
                      {e.kind === "Photo" ? (
                        <ImageIcon />
                      ) : e.kind === "Document" ? (
                        <File />
                      ) : (
                        <Link2 />
                      )}
                    </span>
                    <span>
                      <b>{e.name}</b>
                      <small>
                        {e.kind}
                        {e.size ? ` · ${e.size}` : ""}
                      </small>
                    </span>
                    <input
                      className="evidence-reference-input"
                      value={e.recordReference ?? ""}
                      onChange={(event) =>
                        onEvidenceReference(e.id, event.target.value)
                      }
                      placeholder="Record / reference no."
                      aria-label={`Record or reference number for ${e.name}`}
                    />
                    <button onClick={() => onPreview(e)}>
                      <Eye size={14} />
                      Preview
                    </button>
                    <button onClick={() => onRemoveEvidence(e.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-evidence">
                No evidence attached to this question.
              </p>
            )}
            <div className="best-practice-entry">
              <span>
                <b>Recognize a strong practice</b>
                <small>
                  Record a positive practice worth sharing or replicating.
                </small>
              </span>
              <button className="button-secondary" onClick={onRecordBestPractice}>
                <Plus size={13} /> Record Best Practice
              </button>
            </div>
          </section>
        </div>
      </div>
      <footer className="question-actions">
        <button onClick={() => onNavigate(-1)} disabled={visibleIndex <= 0}>
          <ArrowLeft size={14} />
          Previous
        </button>
        <button className="review-link" onClick={onReview}>
          Review Audit
        </button>
        <span>
          {visibleIndex + 1} / {visibleQuestions.length}
        </span>
        <button
          onClick={() => onNavigate(1)}
          disabled={visibleIndex === visibleQuestions.length - 1}
        >
          Save &amp; Next <ArrowRight size={14} />
        </button>
      </footer>
    </main>
  );
}

export function ExecutionContext({
  question,
  state,
  audit,
}: {
  question: AuditQuestion;
  state: AuditExecutionState;
  audit: Audit;
}) {
  const response = state.responses[question.id];
  const finding = state.findings.find((f) =>
    response.findingIds.includes(f.id),
  );
  return (
    <aside className="execution-context">
      <section>
        <h3>Clause Reference</h3>
        <code>{question.code}</code>
        <b>{state.checklist.standard}</b>
        <span>Clause {question.clause}</span>
        <strong>{question.title}</strong>
      </section>
      <section>
        <h3>Internal Guidance</h3>
        <p>{question.guidance}</p>
      </section>
      <section>
        <h3>Expected Evidence</h3>
        {question.expectedEvidence ? (
          <ul className="expected-evidence-list">
            {question.expectedEvidence
              .split("\n")
              .filter(Boolean)
              .map((item) => (
                <li key={item}>{item}</li>
              ))}
          </ul>
        ) : (
          <p>No expected-evidence examples configured.</p>
        )}
        <small>Guidance only unless the evidence rule requires it.</small>
      </section>
      <section>
        <h3>Audit Information</h3>
        <Meta
          label="Template version"
          value={`v${state.checklist.version ?? "—"}`}
        />
        <Meta label="Location" value={audit.location} />
        <Meta
          label="Business Line"
          value={businessLineName(audit.businessLineId)}
        />
        <Meta label="Department" value={audit.department} />
        <Meta label="Process" value={audit.process ?? "Not specified"} />
        <Meta label="Process Owner" value={audit.auditee ?? "Not assigned"} />
        <Meta label="Lead Auditor" value={audit.lead} />
      </section>
      <section>
        <h3>Audit History</h3>
        <p>
          {response.answeredAt
            ? "Previously answered by Lakshman."
            : "No previous response recorded."}
        </p>
      </section>
      <section>
        <h3>Findings</h3>
        {finding ? (
          <Link
            href={`/findings?record=${finding.id}`}
            className="context-finding"
          >
            <code>{finding.id}</code>
            <b>{finding.type}</b>
            <span>{finding.status}</span>
          </Link>
        ) : (
          <p>No finding associated with this question.</p>
        )}
      </section>
    </aside>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="execution-meta">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
