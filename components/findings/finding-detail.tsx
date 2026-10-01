"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Check,
  Ellipsis,
  FilePlus2,
  Info,
  Plus,
  X,
} from "lucide-react";
import {
  findingLabel,
  openFindingStatuses,
  type Finding,
  type FindingEvidence,
} from "@/data/findings";
import { updateFinding } from "@/lib/finding-store";
import {
  activity,
  AssignFindingDrawer,
  CreateActionDrawer,
  VerificationDrawer,
} from "./finding-panels";
import { daysBetween, displayDate } from "./finding-list";
import { updateAction, useActions } from "@/lib/action-store";
import type { CorrectiveAction } from "@/data/actions";
import { currentUser as demoUser } from "@/data/current-user";
import { getTodayISO, isOverdue } from "@/lib/date";

type Tab =
  | "Overview"
  | "Response"
  | "Root Cause"
  | "Actions"
  | "Evidence"
  | "Activity";
export function FindingDetailPane({
  finding,
  currentUser,
  onBack,
  onContext,
}: {
  finding: Finding;
  currentUser: string;
  onBack: () => void;
  onContext: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [assign, setAssign] = useState(false);
  const [action, setAction] = useState(false);
  const [verify, setVerify] = useState(false);
  const [more, setMore] = useState(false);
  const closed = finding.status === "Closed" || finding.status === "Cancelled";
  const linkedActions=useActions().filter(action=>action.findingId===finding.id);
  return (
    <main className="finding-detail-pane">
      <header className="finding-detail-header">
        <button className="finding-mobile-back" onClick={onBack} aria-label="Close finding details">
          <X size={18} />
        </button>
        <div>
          <code>{finding.id}</code>
          <span
            className={`severity severity-${finding.severity.toLowerCase()}`}
          >
            {findingLabel(finding)}
          </span>
          <h1>{finding.title}</h1>
          <span className="finding-status">
            <i />
            {finding.status}
          </span>
        </div>
        <div className="finding-header-actions">
          <button
            onClick={onContext}
            className="finding-info"
            aria-label="Show finding information"
          >
            <Info size={15} />
            <span>Info</span>
          </button>
          {!closed && <button onClick={() => setAssign(true)}>Assign</button>}
          {finding.status === "Response Required" && (
            <button
              className="button-primary"
              onClick={() => setTab("Response")}
            >
              Submit Response
            </button>
          )}
          {finding.status === "Awaiting Verification" && (
            <button className="button-primary" onClick={() => setVerify(true)}>
              Verify Effectiveness
            </button>
          )}
          <div>
            <button onClick={() => setMore(!more)}>
              <Ellipsis size={16} />
            </button>
            {more && (
              <div className="row-menu finding-more">
                {closed && (
                  <button
                    onClick={() =>
                      updateFinding(finding.id, {
                        status: "Returned",
                        closedAt: undefined,
                        closedBy: undefined,
                      })
                    }
                  >
                    Reopen Finding
                  </button>
                )}
                <button>Export / Print</button>
                <button
                  onClick={() => navigator.clipboard?.writeText(location.href)}
                >
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="finding-source-strip">
        <span>Source</span>
        <Link href={finding.auditId ? `/audits/${finding.auditId}` : "#"}>
          <b>{finding.auditId ?? "Manual Finding"}</b>
          <small>
            {finding.auditId ? "Internal QMS Audit" : "No linked audit"}
          </small>
        </Link>
        {finding.questionNumber && (
          <Link href={`/audits/${finding.auditId}/execute`}>
            <b>Question {finding.questionNumber}</b>
            <small>Clause {finding.clause}</small>
          </Link>
        )}
        <div className="source-links">
          {finding.auditId && (
            <Link href={`/audits/${finding.auditId}`}>Open Audit →</Link>
          )}
          {finding.questionId && (
            <Link href={`/audits/${finding.auditId}/execute`}>
              Open Question →
            </Link>
          )}
        </div>
      </div>
      {finding.status === "Returned" && (
        <div className="finding-returned-banner">
          Finding returned for additional corrective action.
        </div>
      )}
      <nav className="finding-tabs">
        {(
          [
            "Overview",
            "Response",
            "Root Cause",
            "Actions",
            "Evidence",
            "Activity",
          ] as Tab[]
        ).map((x) => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </nav>
      <div className="finding-tab-content">
        {tab === "Overview" && <FindingOverview finding={finding} actions={linkedActions} />}{" "}
        {tab === "Response" && (
          <FindingResponseTab finding={finding} currentUser={currentUser} />
        )}{" "}
        {tab === "Root Cause" && (
          <RootCauseTab finding={finding} currentUser={currentUser} />
        )}{" "}
        {tab === "Actions" && (
          <ActionsTab actions={linkedActions} onAdd={() => setAction(true)} />
        )}{" "}
        {tab === "Evidence" && (
          <EvidenceTab finding={finding} currentUser={currentUser} />
        )}{" "}
        {tab === "Activity" && <ActivityTab finding={finding} />}
      </div>
      {assign && (
        <AssignFindingDrawer
          finding={finding}
          onClose={() => setAssign(false)}
        />
      )}{" "}
      {action && (
        <CreateActionDrawer
          finding={finding}
          onClose={() => setAction(false)}
        />
      )}{" "}
      {verify && (
        <VerificationDrawer
          finding={finding}
          onClose={() => setVerify(false)}
        />
      )}
    </main>
  );
}

function FindingOverview({ finding,actions }: { finding: Finding;actions:CorrectiveAction[] }) {
  const stages = [
    "Raised",
    "Response",
    "Root Cause",
    "Corrective Action",
    "Verification",
    "Closed",
  ];
  const stage = statusStage(finding);
  const closed = finding.status === "Closed";
  return (
    <div className="finding-overview">
      <section>
        <h2>Finding Description</h2>
        <p>{finding.description}</p>
        <dl>
          <Meta label="Immediate Risk / Impact" value={finding.impact} />
          <Meta label="Owner" value={finding.owner} />
          <Meta label="Due Date" value={displayDate(finding.dueDate)} />
          <Meta label="Priority" value={finding.priority} />
          <Meta label="Source Audit" value={finding.auditId ?? "Manual"} />
          <Meta
            label="Clause"
            value={
              finding.clause
                ? `ISO 9001:2015 — ${finding.clause}`
                : "Not linked"
            }
          />
          <Meta label="Created By" value={finding.createdBy} />
          <Meta label="Created On" value={displayDate(finding.createdAt)} />
          <Meta label="Current Status" value={finding.status} />
        </dl>
      </section>
      <section>
        <h2>Workflow</h2>
        <div className="finding-workflow">
          {stages.map((x, i) => (
            <div
              key={x}
              className={i < stage ? "complete" : i === stage ? "current" : ""}
            >
              <i>{i < stage ? <Check size={10} /> : null}</i>
              <span>{x}</span>
            </div>
          ))}
        </div>
      </section>
      {closed && (
        <section className="closure-summary">
          <h2>Closure Summary</h2>
          <dl>
            <Meta label="Closed By" value={finding.closedBy ?? "Lakshman"} />
            <Meta
              label="Closed On"
              value={displayDate(finding.closedAt ?? "2026-09-22")}
            />
            <Meta
              label="Effectiveness"
              value={finding.verification.result ?? "Effective"}
            />
            <Meta label="Closure Notes" value={finding.verification.notes} />
            <Meta
              label="Corrective Actions"
              value={`${actions.filter((a) => a.status === "Completed").length} completed`}
            />
            <Meta
              label="Total Cycle Time"
              value={`${daysBetween(finding.createdAt, finding.closedAt ?? "2026-09-22")} days`}
            />
          </dl>
        </section>
      )}
    </div>
  );
}

function FindingResponseTab({
  finding,
  currentUser,
}: {
  finding: Finding;
  currentUser: string;
}) {
  const [containment, setContainment] = useState(finding.response.containment);
  const [date, setDate] = useState(finding.response.containmentDate);
  const [person, setPerson] = useState(
    finding.response.responsiblePerson || finding.owner,
  );
  const [impacts, setImpacts] = useState(finding.response.impactCategories);
  const [comments, setComments] = useState(finding.response.comments);
  const submitted = !!finding.response.submittedAt;
  const [reviewComment, setReviewComment] = useState("");
  const impactOptions = [
    "Product quality",
    "Customer",
    "Safety",
    "Compliance",
    "Other",
  ];
  function save(submit = false) {
    updateFinding(finding.id, (f) => ({
      ...f,
      status: submit ? "Under Review" : f.status,
      response: {
        ...f.response,
        containment,
        containmentDate: date,
        responsiblePerson: person,
        impactCategories: impacts,
        comments,
        submittedBy: submit ? currentUser : f.response.submittedBy,
        submittedAt: submit ? "2026-09-09T14:14:00" : f.response.submittedAt,
      },
      activity: submit
        ? [
            activity(currentUser, "submitted a finding response."),
            ...f.activity,
          ]
        : f.activity,
    }));
  }
  function review(accept: boolean) {
    if (!accept && !reviewComment) return;
    updateFinding(finding.id, (f) => ({
      ...f,
      status: accept ? "Root Cause Required" : "Response Required",
      response: {
        ...f.response,
        reviewerComment: reviewComment,
        submittedAt: accept ? f.response.submittedAt : undefined,
      },
      activity: [
        activity(
          currentUser,
          accept
            ? "accepted the finding response."
            : "returned the response for revision.",
        ),
        ...f.activity,
      ],
    }));
  }
  return (
    <section className="finding-form-section">
      <header>
        <div>
          <h2>Finding Response</h2>
          <p>Document containment and assess the immediate impact.</p>
        </div>
        {submitted && (
          <span>Submitted by {finding.response.submittedBy} · Sep 09</span>
        )}
      </header>
      <fieldset disabled={submitted}>
        <Field label="Immediate Containment">
          <textarea
            rows={5}
            value={containment}
            onChange={(e) => setContainment(e.target.value)}
            placeholder="What immediate action was taken to control the issue?"
          />
        </Field>
        <div className="form-pair">
          <Field label="Containment Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Responsible Person">
            <select value={person} onChange={(e) => setPerson(e.target.value)}>
              {people.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Impact Assessment">
          <div className="impact-options">
            {impactOptions.map((x) => (
              <label key={x}>
                <input
                  type="checkbox"
                  checked={impacts.includes(x)}
                  onChange={() =>
                    setImpacts((v) =>
                      v.includes(x) ? v.filter((i) => i !== x) : [...v, x],
                    )
                  }
                />
                {x}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Response Comments">
          <textarea
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </Field>
        <button
          className="evidence-add-button"
          type="button"
          onClick={() => addEvidence(finding, currentUser, "Finding Response")}
        >
          <FilePlus2 size={14} />
          Add Evidence
        </button>
      </fieldset>
      {!submitted ? (
        <footer>
          <button onClick={() => save(false)}>Save Draft</button>
          <button
            className="button-primary"
            onClick={() => save(true)}
            disabled={!containment || !date}
          >
            Submit Response
          </button>
        </footer>
      ) : (
        finding.status === "Under Review" && (
          <div className="response-review">
            <h3>Lead Auditor Review</h3>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Reviewer comment (required when returning)"
            />
            <div>
              <button onClick={() => review(false)}>Return for Revision</button>
              <button className="button-primary" onClick={() => review(true)}>
                Accept Response
              </button>
            </div>
          </div>
        )
      )}
    </section>
  );
}

function RootCauseTab({
  finding,
  currentUser,
}: {
  finding: Finding;
  currentUser: string;
}) {
  const [method, setMethod] = useState(finding.rootCause.method);
  const [problem, setProblem] = useState(finding.rootCause.problemStatement);
  const [whys, setWhys] = useState(
    finding.rootCause.whyItems.length ? finding.rootCause.whyItems : [""],
  );
  const [summary, setSummary] = useState(finding.rootCause.rootCauseSummary);
  const [factors, setFactors] = useState(finding.rootCause.contributingFactors);
  const completed = !!finding.rootCause.completedAt;
  function save(done = false) {
    if (done && (!problem || !whys.some(Boolean) || !summary)) return;
    updateFinding(finding.id, (f) => ({
      ...f,
      status: done ? "Action In Progress" : f.status,
      rootCause: {
        method,
        problemStatement: problem,
        whyItems: whys,
        rootCauseSummary: summary,
        contributingFactors: factors,
        completedBy: done ? currentUser : f.rootCause.completedBy,
        completedAt: done ? "2026-09-10" : f.rootCause.completedAt,
      },
      activity: done
        ? [
            activity(currentUser, "completed the root cause analysis."),
            ...f.activity,
          ]
        : f.activity,
    }));
  }
  return (
    <section className="finding-form-section">
      <header>
        <div>
          <h2>Root Cause Analysis</h2>
          <p>Use a structured method to identify the underlying cause.</p>
        </div>
        {completed && <span>Completed by {finding.rootCause.completedBy}</span>}
      </header>
      <fieldset disabled={completed}>
        <Field label="Root Cause Method">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
          >
            <option>5 Why</option>
            <option>Fishbone</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Problem Statement *">
          <textarea
            rows={3}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
          />
        </Field>
        {method === "5 Why" && (
          <div className="why-editor">
            <h3>5 Why Analysis</h3>
            {whys.map((why, i) => (
              <Field key={i} label={`Why ${i + 1}`}>
                <div className="why-row">
                  <input
                    value={why}
                    onChange={(e) =>
                      setWhys((v) =>
                        v.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                    placeholder="Why did this occur?"
                  />
                  {whys.length > 1 && (
                    <button
                      onClick={() =>
                        setWhys((v) => v.filter((_, j) => j !== i))
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
              </Field>
            ))}
            {whys.length < 5 && (
              <button onClick={() => setWhys([...whys, ""])}>
                <Plus size={13} />
                Add Why
              </button>
            )}
          </div>
        )}
        <Field label="Root Cause Summary *">
          <textarea
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </Field>
        <Field label="Contributing Factors">
          <textarea
            rows={3}
            value={factors}
            onChange={(e) => setFactors(e.target.value)}
          />
        </Field>
      </fieldset>
      {!completed && (
        <footer>
          <button onClick={() => save(false)}>Save Draft</button>
          <button
            className="button-primary"
            disabled={!problem || !whys.some(Boolean) || !summary}
            onClick={() => save(true)}
          >
            Complete Root Cause
          </button>
        </footer>
      )}
    </section>
  );
}

function ActionsTab({
  actions,
  onAdd,
}: {
  actions: CorrectiveAction[];
  onAdd: () => void;
}) {
  function toggle(id: string) {
    updateAction(id,a=>({...a,status:a.status==="Completed"?"In Progress":"Completed",progress:a.status==="Completed"?75:100,completedAt:a.status==="Completed"?undefined:new Date().toISOString(),verifiedBy:a.status==="Completed"?undefined:demoUser.name}));
  }
  return (
    <section className="finding-actions-tab">
      <header>
        <div>
          <h2>Corrective Actions</h2>
          <p>Linked remediation activities for this finding.</p>
        </div>
        <button className="button-primary" onClick={onAdd}>
          <Plus size={13} />
          Add Corrective Action
        </button>
      </header>
      <div className="finding-action-table">
        <div className="action-head">
          <span>Action</span>
          <span>Owner</span>
          <span>Due</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Effectiveness</span>
        </div>
        {actions.map((a) => (
          <div className="action-row" key={a.id}>
            <span>
              <b>{a.title}</b>
              <small>
                {a.id} · {a.type}
              </small>
            </span>
            <span>{a.owner}</span>
            <span>{displayDate(a.dueDate)}</span>
            <span>{a.priority}</span>
            <button onClick={() => toggle(a.id)}>{a.status}</button>
            <span>{a.verificationAttempts.at(-1)?.result ?? "—"}</span>
            {a.status === "Completed" && (
              <small className="action-completion">
                Completed by {a.verifiedBy ?? "Action owner"} on {a.completedAt}
              </small>
            )}
          </div>
        ))}
        {!actions.length && (
          <p className="finding-empty">
            No corrective actions have been created.
          </p>
        )}
      </div>
    </section>
  );
}

function EvidenceTab({
  finding,
  currentUser,
}: {
  finding: Finding;
  currentUser: string;
}) {
  const groups: FindingEvidence["source"][] = [
    "Audit Question",
    "Finding Response",
    "Root Cause",
    "Corrective Action",
  ];
  return (
    <section className="finding-evidence-tab">
      <header>
        <div>
          <h2>Evidence</h2>
          <p>Files and references collected throughout the finding workflow.</p>
        </div>
        <button
          className="button-primary"
          onClick={() => addEvidence(finding, currentUser, "Finding Response")}
        >
          <FilePlus2 size={13} />
          Add Evidence
        </button>
      </header>
      {groups.map((group) => {
        const rows = finding.evidence.filter((e) => e.source === group);
        return (
          <div className="evidence-group" key={group}>
            <h3>
              {group} Evidence <span>{rows.length} files</span>
            </h3>
            {rows.map((e) => (
              <div key={e.id}>
                <span>
                  <b>{e.name}</b>
                  <small>
                    {e.type} · {e.size ?? "Link"}
                  </small>
                </span>
                <span>{e.uploadedBy}</span>
                <span>{e.date}</span>
                <button>Preview</button>
              </div>
            ))}
            {!rows.length && <p>No evidence from this source.</p>}
          </div>
        );
      })}
    </section>
  );
}
function ActivityTab({ finding }: { finding: Finding }) {
  return (
    <section className="finding-activity-tab">
      <h2>Workflow Activity</h2>
      {finding.activity.map((a) => (
        <article key={a.id}>
          <time>{a.date}</time>
          <i />
          <p>
            <b>{a.actor}</b> {a.action}
            {a.detail && <small>{a.detail}</small>}
          </p>
        </article>
      ))}
    </section>
  );
}
export function FindingContextPane({
  finding,
  onClose,
}: {
  finding: Finding;
  onClose?: () => void;
}) {
  const linkedActions=useActions().filter(action=>action.findingId===finding.id);
  const today=getTodayISO();
  const overdue =
    isOverdue(finding.dueDate,today) &&
    openFindingStatuses.includes(finding.status);
  return (
    <aside className="finding-context-pane">
      {onClose && (
        <button className="context-close" onClick={onClose}>
          Close
        </button>
      )}
      <ContextGroup title="Finding Context">
        <Meta label="Severity" value={findingLabel(finding)} />
        <Meta label="Status" value={finding.status} />
        <Meta label="Priority" value={finding.priority} />
        <Meta label="Owner" value={finding.owner} />
        <Meta label="Due" value={displayDate(finding.dueDate)} />
        <Meta
          label={overdue ? "Overdue" : "Days Remaining"}
          value={
            overdue
              ? `${daysBetween(finding.dueDate, today)} days`
              : `${daysBetween(today, finding.dueDate)} days`
          }
        />
      </ContextGroup>
      <ContextGroup title="Source">
        <Meta label="Audit" value={finding.auditId ?? "Manual"} />
        <Meta label="Program" value="2026 Internal Audit Program" />
        <Meta label="Location" value={finding.location} />
        <Meta label="Department" value={finding.department ?? "—"} />
        <Meta label="Clause" value={finding.clause ?? "—"} />
      </ContextGroup>
      <ContextGroup title="Auditor">
        <Meta label="Raised By" value={finding.createdBy} />
        <Meta label="Reviewer" value={finding.reviewer ?? "Lakshman"} />
      </ContextGroup>
      <ContextGroup title="Related">
        <Meta
          label="Corrective Actions"
          value={String(linkedActions.length)}
        />
        <Meta label="Evidence" value={String(finding.evidence.length)} />
        <Meta label="Activity" value={String(finding.activity.length)} />
        <Meta
          label={finding.status === "Closed" ? "Closed in" : "Age"}
          value={`${daysBetween(finding.createdAt, finding.closedAt ?? today)} days`}
        />
      </ContextGroup>
    </aside>
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
    <div className="finding-meta">
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
function statusStage(f: Finding) {
  if (f.status === "Closed") return 5;
  if (f.status === "Awaiting Verification") return 4;
  if (f.status === "Action In Progress" || f.status === "Returned") return 3;
  if (f.status === "Root Cause Required") return 2;
  if (f.status === "Under Review" || f.status === "Response Required") return 1;
  return 0;
}
function addEvidence(
  finding: Finding,
  user: string,
  source: FindingEvidence["source"],
) {
  const evidence: FindingEvidence = {
    id: `EVD-${Date.now()}`,
    findingId: finding.id,
    name:
      source === "Finding Response"
        ? "Containment_Record.pdf"
        : "Supporting_Evidence.pdf",
    source,
    uploadedBy: user,
    date: "Sep 09, 2026",
    type: "Document",
    size: "1.1 MB",
  };
  updateFinding(finding.id, (f) => ({
    ...f,
    evidence: [...f.evidence, evidence],
    response:
      source === "Finding Response"
        ? {
            ...f.response,
            evidenceIds: [...f.response.evidenceIds, evidence.id],
          }
        : f.response,
    activity: [
      activity(user, `added evidence ${evidence.name}.`),
      ...f.activity,
    ],
  }));
}
const people = ["Rumesh Ravi", "Lakshman", "Siva Kumar", "Manoj", "Anand"];
