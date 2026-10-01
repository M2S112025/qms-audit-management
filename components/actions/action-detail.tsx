"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ChevronRight,
  Ellipsis,
  File,
  PanelRight,
  Plus,
  X,
} from "lucide-react";
import {
  actionDueLabel,
  type ActionEvidence,
  type ActionVerification,
  type CorrectiveAction,
} from "@/data/actions";
import type { Finding } from "@/data/findings";
import { updateAction } from "@/lib/action-store";
import { isOverdue } from "@/lib/date";
import {
  actionActivity,
  DueDateDrawer,
  NewActionDrawer,
  ReassignDrawer,
} from "./action-drawers";
type Tab =
  | "Overview"
  | "Implementation"
  | "Evidence"
  | "Verification"
  | "Activity";
export function ActionDetail({
  action,
  actions,
  finding,
  findings,
  user,
  onBack,
}: {
  action: CorrectiveAction;
  actions: CorrectiveAction[];
  finding?: Finding;
  findings: Finding[];
  user: string;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [context, setContext] = useState(false);
  const [reassign, setReassign] = useState(false);
  const [due, setDue] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [more, setMore] = useState(false);
  const awaiting =
    action.status === "Awaiting Verification" || action.status === "Submitted";
  const owner = user === action.owner;
  const verifier = user === "Lakshman" || user === "Rumesh Ravi";
  return (
    <main className="action-detail">
      <header className="action-detail-header">
        <button className="action-mobile-back" onClick={onBack} aria-label="Close corrective action details">
          <X size={18} />
        </button>
        <div>
          <code>{action.id}</code>
          <h1>{action.title}</h1>
          <p>
            <span className="action-status">
              <i /> {action.status}
            </span>
            <Link
              href={action.findingId ? `/findings/${action.findingId}` : "#"}
            >
              {action.findingId ?? "Standalone"}
            </Link>
            <span
              className={`action-priority priority-${action.priority.toLowerCase()}`}
            >
              {action.priority} Priority
            </span>
            <b className={isOverdue(action.dueDate) ? "overdue" : ""}>
              {actionDueLabel(action.dueDate)}
            </b>
            <span>Owner: {action.owner}</span>
          </p>
        </div>
        <div className="action-header-buttons">
          {owner && !awaiting && action.status !== "Completed" && (
            <button onClick={() => setTab("Implementation")}>
              Update Progress
            </button>
          )}
          {owner && !awaiting && (
            <button
              className="button-primary"
              onClick={() => setTab("Implementation")}
            >
              Submit for Verification
            </button>
          )}
          {verifier && awaiting && (
            <button
              className="button-primary"
              onClick={() => setTab("Verification")}
            >
              Verify Action
            </button>
          )}
          <button
            onClick={() => setContext(!context)}
            aria-label={
              context ? "Hide action information" : "Show action information"
            }
            title={context ? "Hide information" : "Show information"}
          >
            <PanelRight size={14} />
            <span>Info</span>
          </button>
          <div>
            <button onClick={() => setMore(!more)}>
              <Ellipsis size={15} />
            </button>
            {more && (
              <div className="row-menu action-more">
                <button onClick={() => setDuplicate(true)}>
                  Duplicate Action
                </button>
                <button onClick={() => setReassign(true)}>Reassign</button>
                <button onClick={() => setDue(true)}>Change Due Date</button>
              </div>
            )}
          </div>
        </div>
      </header>
      {action.status === "Returned" && (
        <ReturnedNotice
          action={action}
          onResume={() =>
            updateAction(action.id, (a) => ({
              ...a,
              status: "In Progress",
              activity: [
                actionActivity(user, "resumed work on the returned action."),
                ...a.activity,
              ],
            }))
          }
        />
      )}
      <nav className="action-tabs">
        {(
          [
            "Overview",
            "Implementation",
            "Evidence",
            "Verification",
            "Activity",
          ] as Tab[]
        ).map((x) => (
          <button
            className={tab === x ? "active" : ""}
            key={x}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </nav>
      <div className={`action-work-area ${context ? "with-context" : ""}`}>
        <div className="action-tab-content">
          {tab === "Overview" && (
            <ActionOverview action={action} finding={finding} />
          )}{" "}
          {tab === "Implementation" && (
            <ImplementationTab action={action} user={user} />
          )}{" "}
          {tab === "Evidence" && (
            <ActionEvidenceTab action={action} user={user} />
          )}{" "}
          {tab === "Verification" && (
            <ActionVerificationTab
              action={action}
              finding={finding}
              user={user}
            />
          )}{" "}
          {tab === "Activity" && (
            <ActionActivityTab action={action} user={user} />
          )}
        </div>
        {context && (
          <ActionContext action={action} onClose={() => setContext(false)} />
        )}
      </div>
      {reassign && (
        <ReassignDrawer action={action} onClose={() => setReassign(false)} />
      )}{" "}
      {due && <DueDateDrawer action={action} onClose={() => setDue(false)} />}{" "}
      {duplicate && (
        <NewActionDrawer
          actions={actions}
          findings={findings}
          initial={action}
          onClose={() => setDuplicate(false)}
          onCreated={() => setDuplicate(false)}
        />
      )}
    </main>
  );
}
function ActionOverview({
  action,
  finding,
}: {
  action: CorrectiveAction;
  finding?: Finding;
}) {
  return (
    <div className="action-overview">
      <Section title="Action Requirement">
        <p>{action.description}</p>
        <dl>
          <Meta label="Expected Outcome" value={action.expectedOutcome} />
          <Meta label="Action Type" value={action.type} />
          <Meta label="Priority" value={action.priority} />
          <Meta label="Owner" value={action.owner} />
          <Meta label="Start Date" value={action.startDate ?? "Not defined"} />
          <Meta label="Due Date" value={action.dueDate} />
        </dl>
      </Section>
      <Section title="Source Relationship">
        <div className="action-source">
          <span>Source Finding</span>
          <Link href={finding ? `/findings/${finding.id}` : "#"}>
            <code>{finding?.id ?? "No finding linked"}</code>
            <b>
              {finding?.type === "Nonconformity"
                ? `${finding.severity} Nonconformity`
                : finding?.type}
            </b>
            <p>{finding?.title ?? action.sourceReason}</p>
            <em>
              Open Finding <ChevronRight size={12} />
            </em>
          </Link>
        </div>
        <div className="action-source">
          <span>Source Audit</span>
          <Link href={action.auditId ? `/audits/${action.auditId}` : "#"}>
            <code>{action.auditId ?? "Not linked"}</code>
            <b>Internal QMS Audit</b>
            <p>
              {action.location} · {action.department}
            </p>
            <em>
              Open Audit <ChevronRight size={12} />
            </em>
          </Link>
        </div>
      </Section>
      {finding?.rootCause.rootCauseSummary && (
        <Section title="Root Cause">
          <p>{finding.rootCause.rootCauseSummary}</p>
          <Link className="text-link" href={`/findings/${finding.id}`}>
            View Root Cause →
          </Link>
        </Section>
      )}
    </div>
  );
}
function ImplementationTab({
  action,
  user,
}: {
  action: CorrectiveAction;
  user: string;
}) {
  const locked =
    action.status === "Awaiting Verification" || action.status === "Completed";
  const [plan, setPlan] = useState(action.implementationPlan);
  const [notes, setNotes] = useState(action.implementationNotes);
  const [progress, setProgress] = useState(action.progress);
  const [summary, setSummary] = useState(action.implementationSummary);
  const [date, setDate] = useState(action.actualCompletionDate ?? "");
  const [outcome, setOutcome] = useState(action.outcome);
  const [milestone, setMilestone] = useState("");
  const [target, setTarget] = useState("");
  const [confirm, setConfirm] = useState(false);
  const issues = [
    !summary && "Implementation summary is missing",
    !date && "Actual completion date is missing",
    !outcome && "Outcome is missing",
    action.evidenceRequired &&
      !action.evidence.length &&
      "Required evidence has not been added",
  ].filter(Boolean) as string[];
  function save() {
    updateAction(action.id, (a) => ({
      ...a,
      status: a.status === "Planned" && progress > 0 ? "In Progress" : a.status,
      implementationPlan: plan,
      implementationNotes: notes,
      progress,
      implementationSummary: summary,
      actualCompletionDate: date || undefined,
      outcome,
      activity:
        a.progress !== progress
          ? [
              actionActivity(
                user,
                `updated progress from ${a.progress}% to ${progress}%.`,
              ),
              ...a.activity,
            ]
          : a.activity,
    }));
  }
  function addMilestone() {
    if (!milestone) return;
    updateAction(action.id, (a) => ({
      ...a,
      milestones: [
        ...a.milestones,
        {
          id: `MS-${Date.now()}`,
          actionId: a.id,
          title: milestone,
          targetDate: target || undefined,
          owner: user,
          completed: false,
        },
      ],
    }));
    setMilestone("");
    setTarget("");
  }
  function toggle(id: string) {
    updateAction(action.id, (a) => ({
      ...a,
      milestones: a.milestones.map((m) =>
        m.id === id
          ? {
              ...m,
              completed: !m.completed,
              completedAt: !m.completed ? "2026-09-18" : undefined,
            }
          : m,
      ),
    }));
  }
  function submit() {
    save();
    if (issues.length) return;
    setConfirm(true);
  }
  function confirmSubmit() {
    updateAction(action.id, (a) => ({
      ...a,
      status: "Awaiting Verification",
      progress: 100,
      submittedAt: "2026-09-18",
      submittedBy: user,
      activity: [
        actionActivity(
          user,
          a.status === "Returned"
            ? "resubmitted the action for verification."
            : "submitted the action for verification.",
        ),
        ...a.activity,
      ],
    }));
    setConfirm(false);
  }
  return (
    <section className="implementation-tab">
      <header>
        <div>
          <h2>Implementation</h2>
          <p>Plan, document and complete the assigned corrective work.</p>
        </div>
        <span>{locked ? "Read-only while under verification" : ""}</span>
      </header>
      <fieldset disabled={locked}>
        <Field label="Implementation Plan">
          <textarea
            id="implementation-plan"
            rows={4}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="Describe how this corrective action will be implemented."
          />
        </Field>
        <Field label="Implementation Notes">
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document work completed, decisions and relevant details."
          />
        </Field>
        <Field label={`Progress · ${progress}%`}>
          <input
            className="progress-range"
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
          />
          <div className="action-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
        </Field>
        <div className="milestone-editor">
          <h3>Milestones</h3>
          {action.milestones.map((m) => (
            <label key={m.id}>
              <input
                type="checkbox"
                checked={m.completed}
                onChange={() => toggle(m.id)}
              />
              <span>
                <b>{m.title}</b>
                <small>
                  {m.targetDate ?? "No target date"} · {m.owner}
                </small>
              </span>
            </label>
          ))}
          <div>
            <input
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              placeholder="Add milestone"
            />
            <input
              type="date"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <button onClick={addMilestone}>
              <Plus size={13} />
              Add
            </button>
          </div>
        </div>
        <div className="completion-fields">
          <h3>Completion Details</h3>
          <Field label="Implementation Summary *">
            <textarea
              id="implementation-summary"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </Field>
          <div className="form-pair">
            <Field label="Actual Completion Date *">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Outcome *">
              <textarea
                rows={2}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </fieldset>
      {!locked && (
        <footer>
          <button onClick={save}>Save Update</button>
          <button className="button-primary" onClick={submit}>
            Submit for Verification
          </button>
        </footer>
      )}
      {issues.length > 0 && (
        <div className="submission-issues">
          <b>Action is not ready for verification</b>
          <span>{issues.length} items require attention</span>
          {issues.map((x) => (
            <button
              key={x}
              onClick={() =>
                document
                  .getElementById(
                    x.includes("summary")
                      ? "implementation-summary"
                      : "implementation-plan",
                  )
                  ?.focus()
              }
            >
              {x}
            </button>
          ))}
        </div>
      )}
      {confirm && (
        <div className="action-confirm">
          <section>
            <h2>Submit Action for Verification?</h2>
            <code>{action.id}</code>
            <p>{action.title}</p>
            <dl>
              <Meta label="Progress" value="100%" />
              <Meta
                label="Evidence"
                value={`${action.evidence.length} files`}
              />
            </dl>
            <small>
              The action will be sent to the assigned verifier for review.
            </small>
            <footer>
              <button onClick={() => setConfirm(false)}>Cancel</button>
              <button className="button-primary" onClick={confirmSubmit}>
                Submit for Verification
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
function ActionEvidenceTab({
  action,
  user,
}: {
  action: CorrectiveAction;
  user: string;
}) {
  const [preview, setPreview] = useState<ActionEvidence>();
  function add(kind: ActionEvidence["kind"]) {
    const item: ActionEvidence = {
      id: `AE-${Date.now()}`,
      actionId: action.id,
      name:
        kind === "Photo"
          ? "IMG_2114.jpg"
          : kind === "Link"
            ? "Approval_Workflow_Link"
            : "QP-014_Rev03.pdf",
      category:
        kind === "Photo" ? "Photo" : kind === "Link" ? "Approval" : "Document",
      description:
        kind === "Photo"
          ? "Implementation photo"
          : "Revised controlled procedure and approval record.",
      uploadedBy: user,
      uploadedOn: "Sep 18, 2026",
      kind,
      size: kind === "Document" ? "1.4 MB" : undefined,
    };
    updateAction(action.id, (a) => ({
      ...a,
      evidence: [...a.evidence, item],
      activity: [
        actionActivity(user, `added evidence ${item.name}.`),
        ...a.activity,
      ],
    }));
  }
  return (
    <section className="action-evidence-tab">
      <header>
        <div>
          <h2>Completion Evidence</h2>
          <p>Operational proof supporting implementation and completion.</p>
        </div>
        <div>
          <button onClick={() => add("Photo")}>Photo</button>
          <button onClick={() => add("Document")}>Document</button>
          <button onClick={() => add("Link")}>Link</button>
        </div>
      </header>
      <div className="action-evidence-head">
        <span>File</span>
        <span>Category</span>
        <span>Description</span>
        <span>Uploaded By</span>
        <span>Date</span>
      </div>
      {action.evidence.map((e) => (
        <button
          className="action-evidence-row"
          key={e.id}
          onClick={() => setPreview(e)}
        >
          <File size={15} />
          <span>
            <b>{e.name}</b>
            <small>
              {e.kind} · {e.size ?? "Link"}
            </small>
          </span>
          <span>{e.category}</span>
          <span>{e.description}</span>
          <span>{e.uploadedBy}</span>
          <span>{e.uploadedOn}</span>
        </button>
      ))}
      {!action.evidence.length && (
        <p className="action-empty-evidence">
          No implementation evidence has been added.
        </p>
      )}
      {preview && (
        <EvidencePreview
          action={action}
          evidence={preview}
          onClose={() => setPreview(undefined)}
        />
      )}
    </section>
  );
}
function ActionVerificationTab({
  action,
  finding,
  user,
}: {
  action: CorrectiveAction;
  finding?: Finding;
  user: string;
}) {
  const [decision, setDecision] = useState<"Accept" | "Return for Rework">(
    "Accept",
  );
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [changes, setChanges] = useState("");
  const awaiting = action.status === "Awaiting Verification";
  function verify() {
    if (!notes || (decision === "Return for Rework" && !reason)) return;
    const attempt: ActionVerification = {
      id: `AV-${Date.now()}`,
      actionId: action.id,
      attempt: action.verificationAttempts.length + 1,
      result: decision === "Accept" ? "Accepted" : "Returned",
      notes,
      returnReason: reason || undefined,
      requestedChanges: changes || undefined,
      evidenceIds: [],
      verifiedBy: user,
      verifiedAt: "Sep 21, 2026",
    };
    updateAction(action.id, (a) => ({
      ...a,
      status: decision === "Accept" ? "Completed" : "Returned",
      completedAt: decision === "Accept" ? "2026-09-21" : undefined,
      verifiedBy: decision === "Accept" ? user : undefined,
      verificationAttempts: [...a.verificationAttempts, attempt],
      activity: [
        actionActivity(
          user,
          decision === "Accept"
            ? "verified and completed the action."
            : "returned the action for rework.",
          reason,
        ),
        ...a.activity,
      ],
    }));
  }
  return (
    <section className="action-verification-tab">
      <header>
        <h2>Action Verification</h2>
        <p>
          Confirm the action was implemented as required. Finding effectiveness
          is verified separately in Module 05.
        </p>
      </header>
      <div className="verification-readback">
        <Meta label="Action Requirement" value={action.description} />
        <Meta
          label="Implementation Summary"
          value={action.implementationSummary || "Not submitted"}
        />
        <Meta label="Outcome" value={action.outcome || "Not submitted"} />
        <Meta label="Evidence" value={`${action.evidence.length} files`} />
        <Meta
          label="Source Finding"
          value={finding?.title ?? "Standalone action"}
        />
        <Meta
          label="Root Cause"
          value={finding?.rootCause.rootCauseSummary || "Not available"}
        />
      </div>
      {awaiting && (
        <div className="verification-decision">
          <Field label="Verification Result *">
            <div className="decision-options">
              <button
                className={decision === "Accept" ? "selected" : ""}
                onClick={() => setDecision("Accept")}
              >
                Accept
              </button>
              <button
                className={decision === "Return for Rework" ? "selected" : ""}
                onClick={() => setDecision("Return for Rework")}
              >
                Return for Rework
              </button>
            </div>
          </Field>
          <Field label="Verification Notes *">
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          {decision === "Return for Rework" && (
            <>
              <Field label="Return Reason *">
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
              <Field label="Requested Changes">
                <textarea
                  rows={3}
                  value={changes}
                  onChange={(e) => setChanges(e.target.value)}
                />
              </Field>
            </>
          )}
          <div className="verified-meta">
            <span>
              Verified By <b>{user}</b>
            </span>
            <span>
              Verification Date <b>Sep 21, 2026</b>
            </span>
          </div>
          <button className="button-primary" onClick={verify}>
            {decision === "Accept" ? "Accept Action" : "Return Action"}
          </button>
        </div>
      )}
      <div className="verification-history">
        <h3>Verification History</h3>
        {action.verificationAttempts.map((v) => (
          <article key={v.id}>
            <b>Attempt {v.attempt}</b>
            <span>
              {v.verifiedAt} · {v.result}
            </span>
            <p>Verified by {v.verifiedBy}</p>
            <small>{v.returnReason ?? v.notes}</small>
          </article>
        ))}
        {!action.verificationAttempts.length && (
          <p>No previous verification attempts.</p>
        )}
      </div>
    </section>
  );
}
function ActionActivityTab({
  action,
  user,
}: {
  action: CorrectiveAction;
  user: string;
}) {
  const [comment, setComment] = useState("");
  function add() {
    if (!comment) return;
    updateAction(action.id, (a) => ({
      ...a,
      comments: [
        ...a.comments,
        {
          id: `AC-${Date.now()}`,
          actionId: a.id,
          author: user,
          message: comment,
          createdAt: "Sep 21 · 4:02 PM",
        },
      ],
    }));
    setComment("");
  }
  return (
    <section className="action-activity">
      <h2>Action History</h2>
      {action.activity.map((a) => (
        <article key={a.id}>
          <time>{a.date}</time>
          <i />
          <p>
            <b>{a.actor}</b> {a.action}
            {a.detail && <small>{a.detail}</small>}
          </p>
        </article>
      ))}
      <div className="action-comments">
        <h3>Comments</h3>
        {action.comments.map((c) => (
          <article key={c.id}>
            <b>{c.author}</b>
            <time>{c.createdAt}</time>
            <p>{c.message}</p>
          </article>
        ))}
        <div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add comment..."
          />
          <button onClick={add}>Add Comment</button>
        </div>
      </div>
    </section>
  );
}
function ActionContext({
  action,
  onClose,
}: {
  action: CorrectiveAction;
  onClose: () => void;
}) {
  return (
    <aside className="action-context">
      <button className="context-close" onClick={onClose}>
        <X size={16} /> Close
      </button>
      <ContextGroup title="Action Context">
        <Meta label="Status" value={action.status} />
        <Meta label="Priority" value={action.priority} />
        <Meta label="Owner" value={action.owner} />
        <Meta label="Due" value={action.dueDate} />
        <Meta
          label={isOverdue(action.dueDate) ? "Overdue" : "Days Remaining"}
          value={actionDueLabel(action.dueDate)}
        />
        <Meta label="Type" value={action.type} />
      </ContextGroup>
      <ContextGroup title="Source">
        <Meta label="Finding" value={action.findingId ?? "Standalone"} />
        <Meta label="Audit" value={action.auditId ?? "—"} />
        <Meta label="Location" value={action.location} />
        <Meta label="Department" value={action.department ?? "—"} />
      </ContextGroup>
      <ContextGroup title="Created">
        <Meta label="By" value={action.createdBy} />
        <Meta label="On" value={action.createdAt} />
      </ContextGroup>
      <ContextGroup title="Related">
        <Meta label="Evidence" value={String(action.evidence.length)} />
        <Meta label="Comments" value={String(action.comments.length)} />
        <Meta label="Activity" value={String(action.activity.length)} />
      </ContextGroup>
    </aside>
  );
}
function ReturnedNotice({
  action,
  onResume,
}: {
  action: CorrectiveAction;
  onResume: () => void;
}) {
  const last = [...action.verificationAttempts]
    .reverse()
    .find((v) => v.result === "Returned");
  return (
    <div className="returned-notice">
      <div>
        <b>Returned for Rework</b>
        <span>
          {last?.verifiedBy ?? "Lakshman"} returned this action on{" "}
          {last?.verifiedAt ?? "Sep 19"}.
        </span>
        <p>
          {last?.returnReason ??
            "Additional implementation evidence is required."}
        </p>
      </div>
      <button onClick={onResume}>Resume Work</button>
    </div>
  );
}
function EvidencePreview({
  action,
  evidence,
  onClose,
}: {
  action: CorrectiveAction;
  evidence: ActionEvidence;
  onClose: () => void;
}) {
  return (
    <div className="action-preview">
      <section>
        <header>
          <h2>Evidence Preview</h2>
          <button onClick={onClose}>Close</button>
        </header>
        <div className="action-preview-stage">
          <File size={38} />
          <b>{evidence.name}</b>
          <span>Preview content is simulated for this MVP.</span>
        </div>
        <dl>
          <Meta label="File Name" value={evidence.name} />
          <Meta label="Category" value={evidence.category} />
          <Meta label="Description" value={evidence.description} />
          <Meta label="Uploaded By" value={evidence.uploadedBy} />
          <Meta label="Uploaded Date" value={evidence.uploadedOn} />
          <Meta label="Action" value={action.id} />
          <Meta label="Finding" value={action.findingId ?? "—"} />
          <Meta label="Audit" value={action.auditId ?? "—"} />
        </dl>
      </section>
    </div>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function ContextGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3>{title}</h3>
      {children}
    </section>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="action-meta">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
