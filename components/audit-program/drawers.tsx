"use client";
import { useState } from "react";
import { X, TriangleAlert } from "lucide-react";
import { auditTypes, departments, locations, type Audit } from "@/data/audits";
import type { AuditFrequency, AuditProgram } from "@/data/programs";
import { businessLines } from "@/data/organization";
import {
  defaultInterval,
  formatOccurrenceDate,
  generateOccurrenceDates,
  recurrenceLabels,
  recurrenceUnits,
  type AuditRecurrence,
  type RecurrenceEndMode,
  type RecurrenceFrequency,
} from "@/data/recurrences";
import { nextAuditId, nextRecurrenceId, useQmsAudits } from "@/lib/qms-store";

function Drawer({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <>
      <button
        className="drawer-scrim"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside
        className="qms-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        <footer>{footer}</footer>
      </aside>
    </>
  );
}

type ProgramForm = {
  name: string;
  code: string;
  description: string;
  start: string;
  end: string;
  owner: string;
  locations: string[];
  businessLineIds: string[];
  departments: string;
  types: string;
  frequency: AuditFrequency;
  manual: boolean;
};
const empty: ProgramForm = {
  name: "",
  code: "",
  description: "",
  start: "",
  end: "",
  owner: "",
  locations: [],
  businessLineIds: [],
  departments: "",
  types: "",
  frequency: "Annual",
  manual: true,
};
export function ProgramDrawer({
  mode,
  program,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  program?: AuditProgram;
  onClose: () => void;
  onSave: (value: ProgramForm, draft: boolean) => void;
}) {
  const [form, setForm] = useState<ProgramForm>(
    program
      ? {
          name: program.name,
          code: program.id,
          description: program.description,
          start: program.startDate,
          end: program.endDate,
          owner: program.owner,
          locations: program.locations,
          businessLineIds: program.businessLineIds ?? [],
          departments: program.departments.join(", "),
          types: program.auditTypes.join(", "),
          frequency: program.frequency,
          manual: true,
        }
      : empty,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  function set<K extends keyof ProgramForm>(key: K, value: ProgramForm[K]) {
    setForm((v) => ({ ...v, [key]: value }));
    setErrors((v) => ({ ...v, [key]: "" }));
  }
  function submit(draft = false) {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Program name is required.";
    if (!form.code.trim()) next.code = "Program code is required.";
    if (!form.start) next.start = "Start date is required.";
    if (!form.end) next.end = "End date is required.";
    if (!form.owner) next.owner = "Program owner is required.";
    if (!form.locations.length)
      next.locations = "Select at least one location.";
    if (!draft && form.start && form.end && form.end < form.start)
      next.end = "End date must be after the start date.";
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
    onSave(form, draft);
  }
  const title =
    mode === "create" ? "Create Audit Program" : "Edit Audit Program";
  return (
    <Drawer
      title={title}
      description={
        mode === "create"
          ? "Define the scope and period for a new audit program."
          : "Update program scope, ownership and planning settings."
      }
      onClose={onClose}
      footer={
        <>
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          {mode === "create" && (
            <button className="button-secondary" onClick={() => submit(true)}>
              Save as Draft
            </button>
          )}
          <button className="button-primary" onClick={() => submit()}>
            {mode === "create" ? "Create Program" : "Save Changes"}
          </button>
        </>
      }
    >
      <form className="drawer-form" onSubmit={(e) => e.preventDefault()}>
        <FormSection title="Program Information">
          <Field label="Program Name *" error={errors.name}>
            <input
              name="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="Program Code *" error={errors.code}>
            <input
              name="code"
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              disabled={mode === "edit"}
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
        </FormSection>
        <FormSection title="Period">
          <div className="form-pair">
            <Field label="Start Date *" error={errors.start}>
              <input
                name="start"
                type="date"
                value={form.start}
                onChange={(e) => set("start", e.target.value)}
              />
            </Field>
            <Field label="End Date *" error={errors.end}>
              <input
                name="end"
                type="date"
                value={form.end}
                onChange={(e) => set("end", e.target.value)}
              />
            </Field>
          </div>
        </FormSection>
        <FormSection title="Ownership">
          <Field label="Program Owner *" error={errors.owner}>
            <select
              name="owner"
              value={form.owner}
              onChange={(e) => set("owner", e.target.value)}
            >
              <option value="">Select owner</option>
              {["Rumesh Ravi", "Lakshman", "Manoj", "Anand", "Siva Kumar"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          </Field>
        </FormSection>
        <FormSection title="Scope">
          <Field label="Locations *" error={errors.locations}>
            <div className="check-grid" tabIndex={-1} data-name="locations">
              {locations.map((x) => (
                <label key={x}>
                  <input
                    name="locations"
                    type="checkbox"
                    checked={form.locations.includes(x)}
                    onChange={() =>
                      set(
                        "locations",
                        form.locations.includes(x)
                          ? form.locations.filter((v) => v !== x)
                          : [...form.locations, x],
                      )
                    }
                  />
                  {x}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Departments">
            <input
              value={form.departments}
              onChange={(e) => set("departments", e.target.value)}
              placeholder="Quality, Production..."
            />
          </Field>
          <Field label="Business Lines">
            <div className="check-grid">
              {businessLines.map((line) => (
                <label key={line.id}>
                  <input
                    type="checkbox"
                    checked={form.businessLineIds.includes(line.id)}
                    onChange={() =>
                      set(
                        "businessLineIds",
                        form.businessLineIds.includes(line.id)
                          ? form.businessLineIds.filter((id) => id !== line.id)
                          : [...form.businessLineIds, line.id],
                      )
                    }
                  />
                  {line.name}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Audit Types">
            <input
              value={form.types}
              onChange={(e) => set("types", e.target.value)}
              placeholder="Internal Audit, Process Audit..."
            />
          </Field>
        </FormSection>
        <FormSection title="Program Settings">
          <Field label="Default Audit Frequency">
            <select
              value={form.frequency}
              onChange={(e) =>
                set("frequency", e.target.value as AuditFrequency)
              }
            >
              {[
                "One Time",
                "Weekly",
                "Monthly",
                "Quarterly",
                "Semi-Annual",
                "Annual",
                "Custom",
              ].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          </Field>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.manual}
              onChange={(e) => set("manual", e.target.checked)}
            />
            Allow audits to be added manually
          </label>
        </FormSection>
      </form>
    </Drawer>
  );
}

type AuditForm = {
  title: string;
  type: string;
  location: string;
  businessLineId: string;
  department: string;
  process: string;
  start: string;
  end: string;
  lead: string;
  team: string;
  template: string;
  scope: string;
  objective: string;
  frequency: RecurrenceFrequency;
  repeatEvery: number;
  recurrenceEndMode: RecurrenceEndMode;
  recurrenceEndDate: string;
  recurrenceOccurrences: number;
};
const emptyAudit: AuditForm = {
  title: "",
  type: "",
  location: "",
  businessLineId: "",
  department: "",
  process: "",
  start: "",
  end: "",
  lead: "",
  team: "",
  template: "",
  scope: "",
  objective: "",
  frequency: "one_time",
  repeatEvery: 1,
  recurrenceEndMode: "occurrences",
  recurrenceEndDate: "",
  recurrenceOccurrences: 4,
};
export function AddAuditDrawer({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (audits: Audit[], recurrence?: AuditRecurrence) => void;
}) {
  const existingAudits = useQmsAudits();
  const [form, setForm] = useState(emptyAudit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [continueConflict, setContinueConflict] = useState(false);
  const conflict =
    form.lead === "Lakshman" &&
    form.start === "2026-09-10" &&
    !continueConflict;
  function set<K extends keyof AuditForm>(key: K, value: AuditForm[K]) {
    setForm((v) => ({ ...v, [key]: value }));
    setErrors((v) => ({ ...v, [key]: "" }));
    if (key === "lead" || key === "start") setContinueConflict(false);
    if (key === "frequency")
      setForm((current) => ({
        ...current,
        frequency: value as RecurrenceFrequency,
        repeatEvery: defaultInterval[value as RecurrenceFrequency],
      }));
  }
  function submit(draft = false) {
    const required: Array<[keyof AuditForm, string]> = [
      ["title", "Audit title"],
      ["type", "Audit type"],
      ["location", "Location"],
      ["department", "Department / Process"],
      ["start", "Planned start"],
      ["lead", "Lead auditor"],
    ];
    if (form.frequency === "one_time") required.push(["end", "Planned end"]);
    const next = Object.fromEntries(
      required
        .filter(([k]) => !form[k])
        .map(([k, label]) => [k, `${label} is required.`]),
    );
    if (
      form.frequency !== "one_time" &&
      form.recurrenceEndMode === "date" &&
      !form.recurrenceEndDate
    )
      next.recurrenceEndDate = "Recurrence end date is required.";
    setErrors(next);
    if (Object.keys(next).length) return;
    if (conflict) return;
    const dates =
      form.frequency === "one_time" || draft
        ? [form.start]
        : generateOccurrenceDates({
            frequency: form.frequency,
            interval: form.repeatEvery,
            startDate: form.start,
            endMode: form.recurrenceEndMode,
            endDate: form.recurrenceEndDate || undefined,
            occurrences: form.recurrenceOccurrences,
          });
    const year = Number(form.start.slice(0, 4)) || 2026;
    const firstId = nextAuditId(existingAudits, year);
    const firstNumber = Number(firstId.split("-").pop());
    const recurrenceSeriesId =
      dates.length > 1 ? nextRecurrenceId(year) : undefined;
    const created = dates.map((date, recurrenceIndex) => {
      const start = new Date(`${date}T00:00:00`);
      return {
      id: `AUD-${year}-${String(firstNumber + recurrenceIndex).padStart(3, "0")}`,
      title: form.title,
      type: form.type,
      location: form.location,
      businessLineId: form.businessLineId || undefined,
      department: form.department,
      process: form.process || undefined,
      lead: form.lead,
      plannedDate: start.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      dateRange: start.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      }),
      status: draft ? "Draft" : "Planned",
      year,
      recurrenceSeriesId,
      recurrenceIndex: recurrenceSeriesId ? recurrenceIndex : undefined,
      recurrenceFrequency: form.frequency,
      template: form.template || undefined,
      scope: form.scope || undefined,
      objective: form.objective || undefined,
      team: form.team ? form.team.split(",").map((item) => item.trim()) : [],
    } satisfies Audit;
    });
    onAdd(
      created,
      recurrenceSeriesId
        ? {
            id: recurrenceSeriesId,
            frequency: form.frequency,
            interval: form.repeatEvery,
            startDate: form.start,
            endMode: form.recurrenceEndMode,
            endDate: form.recurrenceEndDate || undefined,
            occurrences: form.recurrenceOccurrences,
            generatedAuditIds: created.map((audit) => audit.id),
          }
        : undefined,
    );
  }
  return (
    <Drawer
      title="Add Audit to Program"
      description="Schedule a focused audit within this program."
      onClose={onClose}
      footer={
        <>
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button-secondary" onClick={() => submit(true)}>
            Save Draft
          </button>
          <button className="button-primary" onClick={() => submit()}>
            Add Audit
          </button>
        </>
      }
    >
      <form className="drawer-form" onSubmit={(e) => e.preventDefault()}>
        <FormSection title="Audit Information">
          <Field label="Audit Title *" error={errors.title}>
            <input
              name="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
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
              />
            </Field>
          </div>
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
            <Field label="Starts *" error={errors.start}>
              <input
                name="start"
                type="date"
                value={form.start}
                onChange={(e) => set("start", e.target.value)}
              />
            </Field>
          )}
          {form.frequency !== "one_time" && (
            <div className="recurrence-config compact">
              <div className="form-pair">
                <Field label="Repeat Every">
                  <div className="repeat-every-control">
                    <input
                      type="number"
                      min="1"
                      value={form.repeatEvery}
                      onChange={(e) =>
                        set("repeatEvery", Math.max(1, Number(e.target.value)))
                      }
                    />
                    <span>{recurrenceUnits[form.frequency]}</span>
                  </div>
                </Field>
                <Field label="Recurrence End">
                  <select
                    value={form.recurrenceEndMode}
                    onChange={(e) =>
                      set("recurrenceEndMode", e.target.value as RecurrenceEndMode)
                    }
                  >
                    <option value="date">On date</option>
                    <option value="occurrences">After occurrences</option>
                    <option value="none">No end date</option>
                  </select>
                </Field>
              </div>
              {form.recurrenceEndMode === "date" && (
                <Field label="Ends On" error={errors.recurrenceEndDate}>
                  <input
                    type="date"
                    min={form.start}
                    value={form.recurrenceEndDate}
                    onChange={(e) => set("recurrenceEndDate", e.target.value)}
                  />
                </Field>
              )}
              {form.recurrenceEndMode === "occurrences" && (
                <Field label="Occurrences">
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
                </Field>
              )}
              {form.start && (
                <div className="recurrence-preview">
                  <span>Occurrence preview</span>
                  <div>
                    {generateOccurrenceDates({
                      frequency: form.frequency,
                      interval: form.repeatEvery,
                      startDate: form.start,
                      endMode: form.recurrenceEndMode,
                      endDate: form.recurrenceEndDate || undefined,
                      occurrences: form.recurrenceOccurrences,
                    }).map((date, index) => (
                      <b key={date}>{index + 1}. {formatOccurrenceDate(date)}</b>
                    ))}
                  </div>
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
          <Field label="Lead Auditor *" error={errors.lead}>
            <select
              name="lead"
              value={form.lead}
              onChange={(e) => set("lead", e.target.value)}
            >
              <option value="">Select lead auditor</option>
              {["Rumesh Ravi", "Lakshman", "Manoj", "Anand", "Siva Kumar"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          </Field>
          {conflict && (
            <div className="conflict">
              <TriangleAlert size={17} />
              <div>
                <b>Scheduling conflict</b>
                <p>Lakshman is already assigned to AUD-2026-026 on Sep 10.</p>
                <div>
                  <button
                    type="button"
                    onClick={() => setContinueConflict(true)}
                  >
                    Continue anyway
                  </button>
                  <button type="button" onClick={() => set("lead", "")}>
                    Change auditor
                  </button>
                </div>
              </div>
            </div>
          )}
          <Field label="Audit Team">
            <input
              value={form.team}
              onChange={(e) => set("team", e.target.value)}
            />
          </Field>
          <Field label="Audit Template">
            <input
              value={form.template}
              onChange={(e) => set("template", e.target.value)}
            />
          </Field>
          <Field label="Scope">
            <textarea
              rows={2}
              value={form.scope}
              onChange={(e) => set("scope", e.target.value)}
            />
          </Field>
          <Field label="Objective">
            <textarea
              rows={2}
              value={form.objective}
              onChange={(e) => set("objective", e.target.value)}
            />
          </Field>
        </FormSection>
      </form>
    </Drawer>
  );
}

function FormSection({
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
