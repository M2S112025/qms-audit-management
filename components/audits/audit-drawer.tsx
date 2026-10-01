"use client";
import { useMemo, useState } from "react";
import { TriangleAlert, X } from "lucide-react";
import { auditTypes, departments, locations, type Audit } from "@/data/audits";
import { auditPrograms } from "@/data/programs";
import { businessLines } from "@/data/organization";
import {
  defaultInterval,
  formatOccurrenceDate,
  generateOccurrenceDates,
  recurrenceLabels,
  recurrenceUnits,
  type RecurrenceEndMode,
  type RecurrenceFrequency,
} from "@/data/recurrences";
import { currentVersion } from "@/data/templates";
import { useTemplates } from "@/lib/template-store";

export type AuditDraft = {
  title: string;
  type: string;
  programId: string;
  framework: string;
  description: string;
  location: string;
  businessLineId: string;
  department: string;
  process: string;
  auditee: string;
  supplier: string;
  objective: string;
  scope: string;
  criteria: string;
  reference: string;
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  frequency: RecurrenceFrequency;
  repeatEvery: number;
  recurrenceEndMode: RecurrenceEndMode;
  recurrenceEndDate: string;
  recurrenceOccurrences: number;
  lead: string;
  team: string[];
  template: string;
  templateId: string;
  templateVersionId: string;
};
const blank: AuditDraft = {
  title: "",
  type: "",
  programId: "",
  framework: "",
  description: "",
  location: "",
  businessLineId: "",
  department: "",
  process: "",
  auditee: "",
  supplier: "",
  objective: "",
  scope: "",
  criteria: "",
  reference: "",
  start: "",
  end: "",
  startTime: "09:00",
  endTime: "17:00",
  frequency: "one_time",
  repeatEvery: 1,
  recurrenceEndMode: "occurrences",
  recurrenceEndDate: "",
  recurrenceOccurrences: 4,
  lead: "",
  team: [],
  template: "",
  templateId: "",
  templateVersionId: "",
};
const people = ["Lakshman", "Rumesh Ravi", "Manoj", "Anand", "Siva Kumar"];
export function CreateAuditDrawer({
  initial,
  variant = "create",
  onClose,
  onSave,
}: {
  initial?: Partial<AuditDraft>;
  variant?: "create" | "edit";
  onClose: () => void;
  onSave: (draft: AuditDraft, mode: "draft" | "create" | "open") => void;
}) {
  const [form, setForm] = useState({ ...blank, ...initial });
  const templates = useTemplates().filter(
    (t) => t.currentVersionId && currentVersion(t).status === "Published",
  );
  const selectedTemplate = templates.find(
    (t) =>
      t.id === form.templateId ||
      currentVersion(t).id === form.templateVersionId,
  );
  const selectedVersion = selectedTemplate
    ? currentVersion(selectedTemplate)
    : undefined;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [continueConflict, setContinueConflict] = useState(false);
  const conflict =
    form.lead === "Lakshman" &&
    !!form.start &&
    form.start <= "2026-09-21" &&
    form.end >= "2026-09-21" &&
    !continueConflict;
  const duration = useMemo(
    () =>
      form.start && form.end
        ? Math.max(
            1,
            Math.round(
              (new Date(form.end).getTime() - new Date(form.start).getTime()) /
                86400000,
            ) + 1,
          )
        : 0,
    [form.start, form.end],
  );
  const occurrencePreview = useMemo(
    () =>
      form.frequency === "one_time" || !form.start
        ? []
        : generateOccurrenceDates({
            frequency: form.frequency,
            interval: form.repeatEvery,
            startDate: form.start,
            endMode: form.recurrenceEndMode,
            endDate: form.recurrenceEndDate || undefined,
            occurrences: form.recurrenceOccurrences,
          }),
    [
      form.frequency,
      form.recurrenceEndDate,
      form.recurrenceEndMode,
      form.recurrenceOccurrences,
      form.repeatEvery,
      form.start,
    ],
  );
  function set<K extends keyof AuditDraft>(key: K, value: AuditDraft[K]) {
    setForm((v) => ({ ...v, [key]: value }));
    setErrors((v) => ({ ...v, [key]: "" }));
    if (key === "lead" || key === "start" || key === "end")
      setContinueConflict(false);
    if (key === "frequency")
      setForm((current) => ({
        ...current,
        frequency: value as RecurrenceFrequency,
        repeatEvery: defaultInterval[value as RecurrenceFrequency],
      }));
  }
  function submit(mode: "draft" | "create" | "open") {
    if (mode === "draft") {
      onSave(form, mode);
      return;
    }
    const required: Array<[keyof AuditDraft, string]> = [
      ["title", "Audit title"],
      ["type", "Audit type"],
      ["location", "Location"],
      ["department", "Department / Process"],
      ["objective", "Objective"],
      ["scope", "Scope"],
      ["start", "Planned start"],
      ["lead", "Lead auditor"],
      ["template", "Audit template"],
    ];
    if (form.frequency === "one_time") required.push(["end", "Planned end"]);
    const next = Object.fromEntries(
      required
        .filter(([key]) => !String(form[key]).trim())
        .map(([key, label]) => [key, `${label} is required.`]),
    );
    if (form.start && form.end && form.end < form.start)
      next.end = "End date must be after the start date.";
    if (
      form.frequency !== "one_time" &&
      form.recurrenceEndMode === "date" &&
      !form.recurrenceEndDate
    )
      next.recurrenceEndDate = "Recurrence end date is required.";
    setErrors(next);
    if (Object.keys(next).length) {
      setTimeout(
        () =>
          document
            .querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)
            ?.focus(),
        0,
      );
      return;
    }
    if (conflict) return;
    onSave(form, mode);
  }
  return (
    <>
      <button
        className="drawer-scrim"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside
        className="qms-drawer audit-create-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={variant === "edit" ? "Edit Audit" : "Create Audit"}
      >
        <header>
          <div>
            <h2>{variant === "edit" ? "Edit Audit" : "Create Audit"}</h2>
            <p>
              {variant === "edit"
                ? "Update audit preparation and scheduling details."
                : "Create and schedule a new audit."}
            </p>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="drawer-body">
          <form className="drawer-form" onSubmit={(e) => e.preventDefault()}>
            <Section title="General Information">
              <Field label="Audit Title *" error={errors.title}>
                <input
                  name="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </Field>
              <Field label="Audit ID">
                <input value="Auto-generated on save" disabled />
              </Field>
              <div className="form-pair">
                <Field label="Audit Type *" error={errors.type}>
                  <select
                    name="type"
                    value={form.type}
                    onChange={(e) => set("type", e.target.value)}
                  >
                    <option value="">Select type</option>
                    {auditTypes.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Program">
                  <select
                    value={form.programId}
                    onChange={(e) => set("programId", e.target.value)}
                  >
                    <option value="">No program</option>
                    {auditPrograms
                      .filter((p) => p.status === "Active")
                      .map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </Field>
              </div>
              <Field label="Standard / Framework">
                <input
                  value={form.framework}
                  onChange={(e) => set("framework", e.target.value)}
                  placeholder="ISO 9001:2015"
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </Section>
            <Section title="Organization">
              <div className="form-pair">
                <Field label="Location *" error={errors.location}>
                  <select
                    name="location"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                  >
                    <option value="">Select location</option>
                    {locations.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Business Line">
                  <select
                    value={form.businessLineId}
                    onChange={(e) => set("businessLineId", e.target.value)}
                  >
                    <option value="">Not assigned</option>
                    {businessLines.map((line) => (
                      <option value={line.id} key={line.id}>
                        {line.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="form-pair">
                <Field label="Department / Function *" error={errors.department}>
                  <select
                    name="department"
                    value={form.department}
                    onChange={(e) => set("department", e.target.value)}
                  >
                    <option value="">Select department</option>
                    {departments.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Process">
                  <input
                    value={form.process}
                    onChange={(e) => set("process", e.target.value)}
                    placeholder="Incoming Inspection"
                  />
                </Field>
              </div>
              <Field label="Auditee / Process Owner">
                <input
                  value={form.auditee}
                  onChange={(e) => set("auditee", e.target.value)}
                />
              </Field>
              {form.type === "Supplier Audit" && (
                <Field label="Supplier">
                  <input
                    value={form.supplier}
                    onChange={(e) => set("supplier", e.target.value)}
                  />
                </Field>
              )}
            </Section>
            <Section title="Audit Scope">
              <Field label="Objective *" error={errors.objective}>
                <textarea
                  name="objective"
                  rows={2}
                  value={form.objective}
                  onChange={(e) => set("objective", e.target.value)}
                />
              </Field>
              <Field label="Scope *" error={errors.scope}>
                <textarea
                  name="scope"
                  rows={2}
                  value={form.scope}
                  onChange={(e) => set("scope", e.target.value)}
                />
              </Field>
              <div className="form-pair">
                <Field label="Criteria">
                  <input
                    value={form.criteria}
                    onChange={(e) => set("criteria", e.target.value)}
                  />
                </Field>
                <Field label="Reference">
                  <input
                    value={form.reference}
                    onChange={(e) => set("reference", e.target.value)}
                  />
                </Field>
              </div>
            </Section>
            <Section title="Schedule">
              <Field label="Frequency *">
                <select
                  value={form.frequency}
                  onChange={(e) =>
                    set("frequency", e.target.value as RecurrenceFrequency)
                  }
                >
                  {(Object.keys(recurrenceLabels) as RecurrenceFrequency[]).map(
                    (frequency) => (
                      <option value={frequency} key={frequency}>
                        {recurrenceLabels[frequency]}
                      </option>
                    ),
                  )}
                </select>
              </Field>
              {form.frequency !== "one_time" && (
                <div className="recurrence-config">
                  <div className="form-pair">
                    <Field label="Repeat Every">
                      <div className="repeat-every-control">
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={form.repeatEvery}
                          onChange={(e) =>
                            set("repeatEvery", Math.max(1, Number(e.target.value)))
                          }
                        />
                        <span>{recurrenceUnits[form.frequency]}</span>
                      </div>
                    </Field>
                    <Field label="Starts *" error={errors.start}>
                      <input
                        name="start"
                        type="date"
                        value={form.start}
                        onChange={(e) => set("start", e.target.value)}
                      />
                    </Field>
                  </div>
                  <fieldset className="recurrence-end-options">
                    <legend>Ends</legend>
                    <label>
                      <input
                        type="radio"
                        checked={form.recurrenceEndMode === "date"}
                        onChange={() => set("recurrenceEndMode", "date")}
                      />
                      On date
                    </label>
                    <label>
                      <input
                        type="radio"
                        checked={form.recurrenceEndMode === "occurrences"}
                        onChange={() => set("recurrenceEndMode", "occurrences")}
                      />
                      After occurrences
                    </label>
                    <label>
                      <input
                        type="radio"
                        checked={form.recurrenceEndMode === "none"}
                        onChange={() => set("recurrenceEndMode", "none")}
                      />
                      No end date
                    </label>
                  </fieldset>
                  {form.recurrenceEndMode === "date" && (
                    <Field
                      label="Recurrence End Date"
                      error={errors.recurrenceEndDate}
                    >
                      <input
                        type="date"
                        value={form.recurrenceEndDate}
                        min={form.start}
                        onChange={(e) => set("recurrenceEndDate", e.target.value)}
                      />
                    </Field>
                  )}
                  {form.recurrenceEndMode === "occurrences" && (
                    <Field label="Number of Occurrences">
                      <div className="repeat-every-control">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={form.recurrenceOccurrences}
                          onChange={(e) =>
                            set(
                              "recurrenceOccurrences",
                              Math.max(1, Number(e.target.value)),
                            )
                          }
                        />
                        <span>occurrences</span>
                      </div>
                    </Field>
                  )}
                  {!!occurrencePreview.length && (
                    <div className="recurrence-preview">
                      <span>Occurrence preview</span>
                      <div>
                        {occurrencePreview.map((date, index) => (
                          <b key={date}>
                            {index + 1}. {formatOccurrenceDate(date)}
                          </b>
                        ))}
                      </div>
                      {form.recurrenceEndMode === "none" && (
                        <small>Preview limited to the next 12 occurrences.</small>
                      )}
                    </div>
                  )}
                </div>
              )}
              {form.frequency === "one_time" && (
              <div className="form-pair">
                <Field label="Planned Start *" error={errors.start}>
                  <input
                    name="start"
                    type="date"
                    value={form.start}
                    onChange={(e) => set("start", e.target.value)}
                  />
                </Field>
                <Field label="Planned End *" error={errors.end}>
                  <input
                    name="end"
                    type="date"
                    value={form.end}
                    onChange={(e) => set("end", e.target.value)}
                  />
                </Field>
              </div>
              )}
              <div className="form-pair">
                <Field label="Start Time">
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set("startTime", e.target.value)}
                  />
                </Field>
                <Field label="End Time">
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set("endTime", e.target.value)}
                  />
                </Field>
              </div>
              {duration > 0 && (
                <p className="duration-note">
                  Calculated duration:{" "}
                  <b>
                    {duration} {duration === 1 ? "day" : "days"}
                  </b>
                </p>
              )}
            </Section>
            <Section title="Audit Team">
              <Field label="Lead Auditor *" error={errors.lead}>
                <select
                  name="lead"
                  value={form.lead}
                  onChange={(e) => set("lead", e.target.value)}
                >
                  <option value="">Select lead auditor</option>
                  {people.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Audit Team">
                <div className="people-select">
                  {people
                    .filter((p) => p !== form.lead)
                    .map((p) => (
                      <label key={p}>
                        <span className="person-avatar">{initials(p)}</span>
                        <span>
                          {p}
                          <small>Available</small>
                        </span>
                        <input
                          type="checkbox"
                          checked={form.team.includes(p)}
                          onChange={() =>
                            set(
                              "team",
                              form.team.includes(p)
                                ? form.team.filter((x) => x !== p)
                                : [...form.team, p],
                            )
                          }
                        />
                      </label>
                    ))}
                </div>
              </Field>
            </Section>
            {conflict && (
              <div className="conflict">
                <TriangleAlert size={17} />
                <div>
                  <b>Scheduling conflict</b>
                  <p>
                    Lakshman is assigned to AUD-2026-030 — Compliance Audit
                    during the selected period.
                  </p>
                  <div>
                    <button type="button" onClick={() => set("lead", "")}>
                      Change Auditor
                    </button>
                    <button
                      type="button"
                      onClick={() => setContinueConflict(true)}
                    >
                      Continue Anyway
                    </button>
                  </div>
                </div>
              </div>
            )}
            <Section title="Checklist">
              <Field label="Audit Template *" error={errors.template}>
                <select
                  name="template"
                  value={form.templateVersionId}
                  onChange={(e) => {
                    const selected = templates.find(
                      (t) => currentVersion(t).id === e.target.value,
                    );
                    setForm((v) => ({
                      ...v,
                      template: selected?.name ?? "",
                      templateId: selected?.id ?? "",
                      templateVersionId: e.target.value,
                      framework: selected?.standard ?? v.framework,
                    }));
                  }}
                >
                  <option value="">Select template</option>
                  {templates.map((x) => (
                    <option key={x.id} value={currentVersion(x).id}>
                      {x.name} · v{currentVersion(x).version}
                    </option>
                  ))}
                </select>
              </Field>
              {form.template && (
                <div className="template-summary">
                  <span>Template</span>
                  <b>{form.template}</b>
                  <div>
                    <small>
                      Sections <b>{selectedVersion?.sections.length ?? 0}</b>
                    </small>
                    <small>
                      Questions <b>{selectedVersion?.questions.length ?? 0}</b>
                    </small>
                    <small>
                      Version <b>v{selectedVersion?.version}</b>
                    </small>
                  </div>
                </div>
              )}
            </Section>
          </form>
        </div>
        <footer>
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          {variant === "create" && (
            <>
              {" "}
              <button
                className="button-secondary"
                onClick={() => submit("draft")}
              >
                Save Draft
              </button>
              <button
                className="button-secondary"
                onClick={() => submit("create")}
              >
                Create Audit
              </button>
            </>
          )}
          <button className="button-primary" onClick={() => submit("open")}>
            {variant === "edit" ? "Save Changes" : "Create & Open"}
          </button>
        </footer>
      </aside>
    </>
  );
}

export function ManageTeamDrawer({
  audit,
  onClose,
  onSave,
}: {
  audit: Audit;
  onClose: () => void;
  onSave: (lead: string, team: string[], auditee: string) => void;
}) {
  const [lead, setLead] = useState(audit.lead);
  const [team, setTeam] = useState(audit.team ?? []);
  const [auditee, setAuditee] = useState(audit.auditee ?? "");
  return (
    <SimpleDrawer
      title="Manage Audit Team"
      description="Assign audit roles and review availability."
      onClose={onClose}
      footer={
        <>
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button-primary"
            onClick={() => onSave(lead, team, auditee)}
          >
            Save Changes
          </button>
        </>
      }
    >
      <div className="drawer-form">
        <Section title="Team Assignment">
          <Field label="Lead Auditor">
            <select value={lead} onChange={(e) => setLead(e.target.value)}>
              {people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Audit Team">
            <div className="people-select">
              {people
                .filter((p) => p !== lead)
                .map((p) => (
                  <label key={p}>
                    <span className="person-avatar">{initials(p)}</span>
                    <span>
                      {p}
                      <small>
                        {p === "Anand" ? "Conflict Sep 09" : "Available"}
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={team.includes(p)}
                      onChange={() =>
                        setTeam(
                          team.includes(p)
                            ? team.filter((x) => x !== p)
                            : [...team, p],
                        )
                      }
                    />
                  </label>
                ))}
            </div>
          </Field>
          <Field label="Auditee / Process Owner">
            <input
              value={auditee}
              onChange={(e) => setAuditee(e.target.value)}
            />
          </Field>
        </Section>
      </div>
    </SimpleDrawer>
  );
}
export function SimpleDrawer({
  title,
  description,
  onClose,
  footer,
  children,
  className = "",
}: {
  title: string;
  description: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <button
        className="drawer-scrim"
        onClick={onClose}
        aria-label="Close panel"
      />
      <aside
        className={`qms-drawer ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        <footer>{footer}</footer>
      </aside>
    </>
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
    <section className="form-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
function Field({
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
export function initials(name: string) {
  return name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);
}
