"use client";
import { useState } from "react";
import { X } from "lucide-react";
import {
  nextFindingId,
  saveFinding,
  updateFinding,
} from "@/lib/finding-store";
import { nextActionId, saveAction, useActions } from "@/lib/action-store";
import type { ActionType, CorrectiveAction } from "@/data/actions";
import { currentUser } from "@/data/current-user";
import { getTodayISO } from "@/lib/date";
import type {
  Finding,
  FindingPriority,
  FindingSeverity,
  FindingType,
} from "@/data/findings";

export function AssignFindingDrawer({
  finding,
  onClose,
}: {
  finding: Finding;
  onClose: () => void;
}) {
  const [owner, setOwner] = useState(finding.owner);
  const [due, setDue] = useState(finding.dueDate);
  const [priority, setPriority] = useState(finding.priority);
  const [department, setDepartment] = useState(finding.department ?? "");
  const [reviewer, setReviewer] = useState(finding.reviewer ?? "Lakshman");
  function submit() {
    updateFinding(finding.id, (f) => ({
      ...f,
      owner,
      dueDate: due,
      priority,
      department,
      reviewer,
      response: { ...f.response, responsiblePerson: owner },
      activity: [
        activity("Lakshman", `assigned the finding to ${owner}.`),
        ...f.activity,
      ],
    }));
    onClose();
  }
  return (
    <Drawer
      title="Assign Finding"
      subtitle={`${finding.id} · ${finding.title}`}
      onClose={onClose}
      action="Assign Finding"
      onAction={submit}
    >
      <Field label="Responsible Person *">
        <select value={owner} onChange={(e) => setOwner(e.target.value)}>
          {people.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <small>Siva Kumar · Quality · 3 active findings</small>
      </Field>
      <Field label="Due Date *">
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </Field>
      <Field label="Priority *">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as FindingPriority)}
        >
          {["Critical", "High", "Medium", "Low"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="Department">
        <input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
      </Field>
      <Field label="Reviewer">
        <select value={reviewer} onChange={(e) => setReviewer(e.target.value)}>
          {people.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
    </Drawer>
  );
}

export function CreateActionDrawer({
  finding,
  onClose,
}: {
  finding: Finding;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const actions = useActions();
  const [type, setType] = useState<ActionType>("Corrective");
  const [owner, setOwner] = useState(finding.owner);
  const [priority, setPriority] = useState<FindingPriority>("High");
  const [start, setStart] = useState(getTodayISO());
  const [due, setDue] = useState("2026-09-20");
  const [outcome, setOutcome] = useState("");
  const [evidence, setEvidence] = useState(true);
  const [error, setError] = useState(false);
  function submit() {
    if (!title || !description || !owner || !due || !outcome) {
      setError(true);
      return;
    }
    const action: CorrectiveAction = {
      id: nextActionId(actions),
      findingId: finding.id,
      auditId: finding.auditId,
      title,
      description,
      type,
      owner,
      priority,
      startDate: start,
      dueDate: due,
      expectedOutcome: outcome,
      evidenceRequired: evidence,
      status: "Planned",
      createdBy: currentUser.name,
      createdAt: getTodayISO(),
      progress: 0,
      milestones: [],
      implementationPlan: "",
      implementationNotes: "",
      implementationSummary: "",
      outcome: "",
      evidence: [],
      comments: [],
      verificationAttempts: [],
      location: finding.location,
      department: finding.department,
      activity: [],
      updatedAt: getTodayISO(),
    };
    saveAction(action);
    updateFinding(finding.id, (f) => ({...f,activity:[activity(currentUser.name, `created corrective action ${action.id}.`),...f.activity]}));
    onClose();
  }
  return (
    <Drawer
      title="Create Corrective Action"
      subtitle={finding.id}
      onClose={onClose}
      action="Create Action"
      onAction={submit}
    >
      <Field label="Action Title *" error={error && !title}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Description *" error={error && !description}>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Action Type">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ActionType)}
        >
          {["Corrective", "Preventive", "Containment", "Systemic"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="Owner *">
        <select value={owner} onChange={(e) => setOwner(e.target.value)}>
          {people.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <div className="form-pair">
        <Field label="Priority *">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as FindingPriority)}
          >
            {["Critical", "High", "Medium", "Low"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Start Date">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Due Date *" error={error && !due}>
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </Field>
      <Field label="Expected Outcome *" error={error && !outcome}>
        <textarea
          rows={3}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
        />
      </Field>
      <label className="finding-toggle">
        <input
          type="checkbox"
          checked={evidence}
          onChange={(e) => setEvidence(e.target.checked)}
        />
        <span>Evidence required</span>
      </label>
    </Drawer>
  );
}

export function VerificationDrawer({
  finding,
  onClose,
}: {
  finding: Finding;
  onClose: () => void;
}) {
  const linkedActions=useActions().filter(action=>action.findingId===finding.id);
  const [result, setResult] = useState<
    "Effective" | "Partially Effective" | "Not Effective"
  >("Effective");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);
  function submit() {
    if (!notes || (result !== "Effective" && !reason)) {
      setError(true);
      return;
    }
    if (result === "Effective") {
      updateFinding(finding.id, (f) => ({
        ...f,
        status: "Closed",
        closedBy: "Lakshman",
        closedAt: "2026-09-22",
        verification: {
          result,
          notes,
          evidenceIds: [],
          verifiedBy: "Lakshman",
          verifiedAt: "2026-09-22",
        },
        activity: [
          activity(
            "Lakshman",
            "verified effectiveness and closed the finding.",
          ),
          ...f.activity,
        ],
      }));
    } else {
      updateFinding(finding.id, (f) => ({
        ...f,
        status: "Returned",
        verification: {
          result,
          notes,
          evidenceIds: [],
          verifiedBy: "Lakshman",
          verifiedAt: "2026-09-22",
          returnReason: reason,
        },
        activity: [
          activity(
            "Lakshman",
            result === "Not Effective"
              ? "returned the finding for additional corrective action."
              : "requested additional follow-up action.",
          ),
          ...f.activity,
        ],
      }));
    }
    onClose();
  }
  return (
    <Drawer
      title="Effectiveness Verification"
      subtitle={`${finding.id} · ${linkedActions.length} corrective actions`}
      onClose={onClose}
      action={result === "Effective" ? "Close Finding" : "Return Finding"}
      onAction={submit}
    >
      <p className="workflow-helper">
        Confirm that the completed corrective actions addressed the root cause
        and prevented the issue from recurring.
      </p>
      <div className="verification-reference">
        <b>{finding.title}</b>
        <span>
          {finding.rootCause.rootCauseSummary || "Root cause summary pending"}
        </span>
        {linkedActions.map((a) => (
          <small key={a.id}>
            {a.id} · {a.title} · {a.status}
          </small>
        ))}
      </div>
      <Field label="Verification Result *">
        <select
          value={result}
          onChange={(e) => setResult(e.target.value as typeof result)}
        >
          {["Effective", "Partially Effective", "Not Effective"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="Verification Notes *" error={error && !notes}>
        <textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      {result !== "Effective" && (
        <Field
          label={
            result === "Not Effective"
              ? "Return Reason *"
              : "Additional Action Required *"
          }
          error={error && !reason}
        >
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      )}
      <Field label="Verified By">
        <input value="Lakshman" disabled />
      </Field>
      <Field label="Verification Date">
        <input value="Sep 22, 2026" disabled />
      </Field>
    </Drawer>
  );
}

export function NewFindingDrawer({
  items,
  onClose,
  onCreated,
}: {
  items: Finding[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<FindingType>("Nonconformity");
  const [severity, setSeverity] = useState<FindingSeverity>("Major");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Chennai Plant");
  const [department, setDepartment] = useState("Quality");
  const [auditId, setAuditId] = useState("AUD-2026-026");
  const [clause, setClause] = useState("");
  const [owner, setOwner] = useState("Siva Kumar");
  const [due, setDue] = useState("2026-09-20");
  const [priority, setPriority] = useState<FindingPriority>("High");
  const [error, setError] = useState(false);
  function submit() {
    if (!title || !description || !location || !owner || !due) {
      setError(true);
      return;
    }
    const id = nextFindingId(items);
    saveFinding({
      id,
      auditId: auditId || undefined,
      title,
      description,
      impact: "To be assessed by the responsible person.",
      type,
      severity: type === "Nonconformity" ? severity : "Not Applicable",
      priority,
      status: "Open",
      owner,
      reviewer: "Lakshman",
      location,
      department,
      clause: clause || undefined,
      createdBy: "Rumesh Ravi",
      createdAt: "2026-09-08",
      dueDate: due,
      response: {
        containment: "",
        containmentDate: "",
        responsiblePerson: owner,
        impactCategories: [],
        comments: "",
        evidenceIds: [],
      },
      rootCause: {
        method: "5 Why",
        problemStatement: "",
        whyItems: [""],
        rootCauseSummary: "",
        contributingFactors: "",
      },
      actions: [],
      evidence: [],
      verification: { notes: "", evidenceIds: [] },
      activity: [activity("Rumesh Ravi", "created the finding manually.")],
    });
    onCreated(id);
  }
  return (
    <Drawer
      title="New Finding"
      subtitle="Manual audit finding"
      onClose={onClose}
      action="Create Finding"
      onAction={submit}
    >
      <Field label="Finding Title *" error={error && !title}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Finding Type *">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FindingType)}
        >
          {["Nonconformity", "Observation", "Opportunity for Improvement"].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </Field>
      {type === "Nonconformity" && (
        <Field label="Severity *">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as FindingSeverity)}
          >
            <option>Major</option>
            <option>Minor</option>
          </select>
        </Field>
      )}
      <Field label="Description *" error={error && !description}>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <div className="form-pair">
        <Field label="Location *">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            {["Chennai Plant", "Hosur Plant", "Pune Plant"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Department">
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Audit (optional)">
        <input value={auditId} onChange={(e) => setAuditId(e.target.value)} />
      </Field>
      <Field label="Clause (optional)">
        <input value={clause} onChange={(e) => setClause(e.target.value)} />
      </Field>
      <Field label="Owner *">
        <select value={owner} onChange={(e) => setOwner(e.target.value)}>
          {people.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <div className="form-pair">
        <Field label="Due Date *">
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </Field>
        <Field label="Priority *">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as FindingPriority)}
          >
            {["Critical", "High", "Medium", "Low"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
    </Drawer>
  );
}

function Drawer({
  title,
  subtitle,
  onClose,
  action,
  onAction,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button className="drawer-scrim" onClick={onClose} />
      <aside className="qms-drawer finding-workflow-drawer">
        <header>
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="drawer-body">
          <div className="drawer-form">{children}</div>
        </div>
        <footer>
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button-primary" onClick={onAction}>
            {action}
          </button>
        </footer>
      </aside>
    </>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`field ${error ? "field-error" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small>This field is required.</small>}
    </label>
  );
}
const people = ["Rumesh Ravi", "Lakshman", "Siva Kumar", "Manoj", "Anand"];
export const activity = (actor: string, action: string) => ({
  id: `FA-${Date.now()}-${Math.random()}`,
  date: "Sep 08 · 4:44 PM",
  actor,
  action,
});
