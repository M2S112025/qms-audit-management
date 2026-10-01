"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { nextActionId, saveAction, updateAction } from "@/lib/action-store";
import type { ActionType, CorrectiveAction } from "@/data/actions";
import type { Finding, FindingPriority } from "@/data/findings";
const people = ["Rumesh Ravi", "Lakshman", "Siva Kumar", "Manoj", "Anand"];
export const actionActivity = (
  actor: string,
  action: string,
  detail?: string,
) => ({
  id: `AH-${Date.now()}-${Math.random()}`,
  date: "Sep 21 · 3:45 PM",
  actor,
  action,
  detail,
});
export function NewActionDrawer({
  actions,
  findings,
  initial,
  onClose,
  onCreated,
}: {
  actions: CorrectiveAction[];
  findings: Finding[];
  initial?: Partial<CorrectiveAction>;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<ActionType>(initial?.type ?? "Corrective");
  const [findingId, setFindingId] = useState(initial?.findingId ?? "");
  const finding = findings.find((f) => f.id === findingId);
  const [owner, setOwner] = useState("Siva Kumar");
  const [priority, setPriority] = useState<FindingPriority>(
    initial?.priority ?? "High",
  );
  const [start, setStart] = useState("2026-09-09");
  const [due, setDue] = useState("2026-09-25");
  const [outcome, setOutcome] = useState(initial?.expectedOutcome ?? "");
  const [required, setRequired] = useState(initial?.evidenceRequired ?? true);
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);
  function submit() {
    if (
      !title ||
      !description ||
      !owner ||
      !due ||
      !outcome ||
      (!findingId && !reason)
    ) {
      setError(true);
      return;
    }
    const id = nextActionId(actions);
    saveAction({
      id,
      findingId: findingId || undefined,
      auditId: finding?.auditId,
      title,
      description,
      type,
      status: "Planned",
      priority,
      owner,
      createdBy: "Rumesh Ravi",
      createdAt: "2026-09-08",
      startDate: start,
      dueDate: due,
      expectedOutcome: outcome,
      evidenceRequired: required,
      progress: 0,
      milestones: [],
      implementationPlan: "",
      implementationNotes: "",
      implementationSummary: "",
      outcome: "",
      evidence: [],
      comments: [],
      verificationAttempts: [],
      location: finding?.location ?? "Chennai Plant",
      department: finding?.department ?? "Quality",
      sourceReason: reason || undefined,
      activity: [
        actionActivity("Rumesh Ravi", "created the corrective action."),
      ],
      updatedAt: "2026-09-08",
    });
    onCreated(id);
  }
  return (
    <Drawer
      title="New Corrective Action"
      subtitle={
        initial ? "Duplicate action" : "Create operational follow-up work"
      }
      action="Create Action"
      onClose={onClose}
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
      <Field label="Action Type *">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ActionType)}
        >
          {[
            "Corrective",
            "Preventive",
            "Containment",
            "Systemic",
            "Follow-up",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="Source Finding (optional)">
        <select
          value={findingId}
          onChange={(e) => setFindingId(e.target.value)}
        >
          <option value="">Standalone action</option>
          {findings.map((f) => (
            <option key={f.id} value={f.id}>
              {f.id} · {f.title}
            </option>
          ))}
        </select>
      </Field>
      {!findingId && (
        <Field label="Reason / Source *" error={error && !reason}>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Select source</option>
            {[
              "Audit Follow-up",
              "Management Request",
              "Preventive Improvement",
              "Other",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Audit">
        <input value={finding?.auditId ?? "Not linked"} disabled />
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
      <Field label="Due Date *">
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
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
        />
        Evidence Required
      </label>
    </Drawer>
  );
}
export function ReassignDrawer({
  action,
  onClose,
}: {
  action: CorrectiveAction;
  onClose: () => void;
}) {
  const [owner, setOwner] = useState(action.owner);
  const [reason, setReason] = useState("");
  const [due, setDue] = useState(action.dueDate);
  const [error, setError] = useState(false);
  function submit() {
    if (!owner || !reason) {
      setError(true);
      return;
    }
    updateAction(action.id, (a) => ({
      ...a,
      owner,
      dueDate: due,
      activity: [
        actionActivity(
          "Rumesh Ravi",
          `reassigned the action from ${a.owner} to ${owner}.`,
          reason,
        ),
        ...a.activity,
      ],
    }));
    onClose();
  }
  return (
    <Drawer
      title="Reassign Action"
      subtitle={`${action.id} · Current owner: ${action.owner}`}
      action="Save Reassignment"
      onClose={onClose}
      onAction={submit}
    >
      <Field label="New Owner *">
        <select value={owner} onChange={(e) => setOwner(e.target.value)}>
          {people.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="Reason for Reassignment *" error={error && !reason}>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <Field label="Due Date">
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </Field>
    </Drawer>
  );
}
export function DueDateDrawer({
  action,
  onClose,
}: {
  action: CorrectiveAction;
  onClose: () => void;
}) {
  const [due, setDue] = useState(action.dueDate);
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);
  function submit() {
    if (!due || !reason) {
      setError(true);
      return;
    }
    updateAction(action.id, (a) => ({
      ...a,
      dueDate: due,
      activity: [
        actionActivity(
          "Rumesh Ravi",
          `changed the due date from ${a.dueDate} to ${due}.`,
          reason,
        ),
        ...a.activity,
      ],
    }));
    onClose();
  }
  return (
    <Drawer
      title="Change Due Date"
      subtitle={`${action.id} · Current: ${action.dueDate}`}
      action="Update Due Date"
      onClose={onClose}
      onAction={submit}
    >
      <Field label="New Due Date *">
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </Field>
      <Field label="Reason *" error={error && !reason}>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
    </Drawer>
  );
}
function Drawer({
  title,
  subtitle,
  action,
  onClose,
  onAction,
  children,
}: {
  title: string;
  subtitle: string;
  action: string;
  onClose: () => void;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button className="drawer-scrim" onClick={onClose} />
      <aside className="qms-drawer action-drawer">
        <header>
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button onClick={onClose}>
            <X size={17} />
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
