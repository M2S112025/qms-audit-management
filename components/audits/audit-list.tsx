"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Eye,
  Ellipsis,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { auditStatusLabel, StatusIndicator } from "@/components/status";
import {
  auditTypes,
  departments,
  locations,
  type Audit,
  type AuditStatus,
} from "@/data/audits";
import { auditPrograms } from "@/data/programs";
import { businessLineName, businessLines } from "@/data/organization";
import {
  generateOccurrenceDates,
  recurrenceLabels,
  type AuditRecurrence,
} from "@/data/recurrences";
import {
  nextAuditId,
  nextRecurrenceId,
  saveAudit,
  saveAuditSeries,
  useQmsAudits,
  useQmsPrograms,
} from "@/lib/qms-store";
import { CreateAuditDrawer, type AuditDraft } from "./audit-drawer";

const people = [
  "Lakshman",
  "Rumesh Ravi",
  "Rumesh",
  "Manoj",
  "Anand",
  "Siva Kumar",
];
type View =
  | "All"
  | "My Audits"
  | "Planned"
  | "In Progress"
  | "Completed"
  | "Overdue";
export function AuditsListPage({ openNew = false }: { openNew?: boolean }) {
  const audits = useQmsAudits();
  const programs = useQmsPrograms();
  const router = useRouter();
  const [drawer, setDrawer] = useState(openNew);
  const [quick, setQuick] = useState<Audit>();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("All");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const [location, setLocation] = useState("All");
  const [businessLine, setBusinessLine] = useState("All");
  const [department, setDepartment] = useState("All");
  const [lead, setLead] = useState("All");
  const [date, setDate] = useState("All");
  const [menu, setMenu] = useState<string>();
  const [moreFilters, setMoreFilters] = useState(false);
  const [toast, setToast] = useState("");
  const viewCount = (name: View) =>
    audits.filter((a) => matchView(a, name)).length;
  const filtered = useMemo(
    () =>
      audits.filter(
        (a) =>
          matchView(a, view) &&
          (status === "All" || a.status === status) &&
          (type === "All" || a.type === type) &&
          (location === "All" || a.location === location) &&
          (businessLine === "All" || a.businessLineId === businessLine) &&
          (department === "All" || a.department === department) &&
          (lead === "All" || a.lead === lead) &&
          (date === "All" || a.plannedDate.includes(date)) &&
          `${a.id} ${a.title} ${a.lead}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [
      audits,
      view,
      status,
      type,
      location,
      businessLine,
      department,
      lead,
      date,
      query,
    ],
  );
  function clear() {
    setStatus("All");
    setType("All");
    setLocation("All");
    setBusinessLine("All");
    setDepartment("All");
    setLead("All");
    setDate("All");
    setQuery("");
  }
  function create(form: AuditDraft, mode: "draft" | "create" | "open") {
    const status = mode === "draft" ? "Draft" : "Planned";
    const year = Number(form.start.slice(0, 4)) || 2026;
    const firstId = nextAuditId(audits, year);
    let created: Audit[];
    if (form.frequency === "one_time" || mode === "draft") {
      created = [toAudit(firstId, form, status)];
      saveAudit(created[0], form.programId || undefined);
    } else {
      const dates = generateOccurrenceDates({
        frequency: form.frequency,
        interval: form.repeatEvery,
        startDate: form.start,
        endMode: form.recurrenceEndMode,
        endDate: form.recurrenceEndDate || undefined,
        occurrences: form.recurrenceOccurrences,
      });
      const seriesId = nextRecurrenceId(year);
      const firstNumber = Number(firstId.split("-").pop());
      created = dates.map((date, recurrenceIndex) =>
        toAudit(
          `AUD-${year}-${String(firstNumber + recurrenceIndex).padStart(3, "0")}`,
          { ...form, start: date, end: date },
          status,
          seriesId,
          recurrenceIndex,
        ),
      );
      const recurrence: AuditRecurrence = {
        id: seriesId,
        frequency: form.frequency,
        interval: form.repeatEvery,
        startDate: form.start,
        endMode: form.recurrenceEndMode,
        endDate: form.recurrenceEndDate || undefined,
        occurrences: form.recurrenceOccurrences,
        generatedAuditIds: created.map((audit) => audit.id),
      };
      saveAuditSeries(created, recurrence, form.programId || undefined);
    }
    setDrawer(false);
    setToast(
      created.length > 1
        ? `${created.length} planned occurrences created successfully.`
        : `${created[0].id} ${mode === "draft" ? "saved as draft" : "created successfully"}.`,
    );
    setTimeout(() => setToast(""), 2800);
    if (mode === "open") router.push(`/audits/${created[0].id}`);
  }
  return (
    <AppShell>
      <div className="page audits-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">AUDIT OPERATIONS</p>
            <h1>Audits</h1>
            <p>
              Plan, prepare and manage individual audits across the
              organization.
            </p>
          </div>
          <button className="primary-button" onClick={() => setDrawer(true)}>
            <Plus size={16} />
            New Audit
          </button>
        </div>
        <nav className="audit-view-tabs">
          {(
            [
              "All",
              "My Audits",
              "Planned",
              "In Progress",
              "Completed",
              "Overdue",
            ] as View[]
          ).map((v) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              onClick={() => setView(v)}
            >
              {v}
              <span>{viewCount(v)}</span>
            </button>
          ))}
        </nav>
        <div className={`audit-command ${moreFilters ? "show-more" : ""}`}>
          <label className="command-search">
            <Search size={15} />
            <input
              placeholder="Search audits..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <Filter
            value={status}
            set={setStatus}
            label="Status"
            options={[
              "All",
              "Draft",
              "Planned",
              "Ready",
              "In Progress",
              "Review & Report",
              "Completed",
              "Overdue",
              "Cancelled",
            ]}
            optionLabel={(value) =>
              value === "All" ? value : auditStatusLabel(value as AuditStatus)
            }
          />
          <Filter
            value={type}
            set={setType}
            label="Audit Type"
            options={["All", ...auditTypes]}
          />
          <Filter
            value={location}
            set={setLocation}
            label="Location"
            options={["All", ...locations]}
          />
          <Filter
            value={businessLine}
            set={setBusinessLine}
            label="Business Line"
            options={["All", ...businessLines.map((line) => line.id)]}
            optionLabel={(value) =>
              value === "All" ? "All" : businessLineName(value)
            }
            className="audit-lower-filter"
          />
          <Filter
            value={department}
            set={setDepartment}
            label="Department"
            options={["All", ...departments]}
            className="audit-lower-filter"
          />
          <Filter
            value={lead}
            set={setLead}
            label="Lead Auditor"
            options={["All", ...people]}
            className="audit-lower-filter"
          />
          <Filter
            value={date}
            set={setDate}
            label="Date"
            options={["All", "Sep", "Aug", "Jul"]}
            className="audit-lower-filter"
          />
          <button
            className="more-filters-toggle"
            aria-expanded={moreFilters}
            onClick={() => setMoreFilters((value) => !value)}
          >
            <SlidersHorizontal size={15} />
            {moreFilters ? "Fewer Filters" : "More Filters"}
          </button>
          <button className="clear-filters" onClick={clear}>
            <RotateCcw size={13} />
            Clear
          </button>
        </div>
        <section className="audits-table">
          <table>
            <thead>
              <tr>
                <th>Audit</th>
                <th>Program</th>
                <th title="Location, Business Line and Department">
                  Organization
                </th>
                <th title="Lead Auditor">Lead</th>
                <th title="Planned Date">Planned</th>
                <th>Status</th>
                <th>Score</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => router.push(`/audits/${a.id}`)}>
                  <td>
                    <b>{a.title}</b>
                    <small>
                      {a.id} · {a.type}
                    </small>
                  </td>
                  <td>{programName(a, programs)}</td>
                  <td className="audit-location-cell">
                    <b>{a.location}</b>
                    <small>
                      {a.businessLineId
                        ? `${businessLineName(a.businessLineId)} · `
                        : ""}
                      {a.department}
                    </small>
                  </td>
                  <td>{a.lead}</td>
                  <td>{a.dateRange}</td>
                  <td>
                    <StatusIndicator status={a.status} />
                  </td>
                  <td
                    className={a.status === "Completed" ? "score-complete" : ""}
                  >
                    {a.score ? `${a.score}%` : "—"}
                  </td>
                  <td>
                    <div className="audit-row-actions">
                      <button
                        title="Quick view"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuick(a);
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenu(menu === a.id ? undefined : a.id);
                        }}
                      >
                        <Ellipsis size={15} />
                      </button>
                      {menu === a.id && (
                        <div className="row-menu">
                          <Link href={`/audits/${a.id}`}>Open Audit</Link>
                          <button>Edit Audit</button>
                          <button>Duplicate</button>
                          <button>Reschedule</button>
                          <button>Cancel Audit</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="module-empty">
              <h3>No audits found</h3>
              <p>No audits match the current view and filters.</p>
              <button className="button-primary" onClick={clear}>
                Clear filters
              </button>
            </div>
          )}
        </section>
        {quick && (
          <AuditQuickView
            audit={quick}
            programs={programs}
            onClose={() => setQuick(undefined)}
          />
        )}{" "}
        {drawer && (
          <CreateAuditDrawer onClose={() => setDrawer(false)} onSave={create} />
        )}{" "}
        {toast && <div className="qms-toast">{toast}</div>}
      </div>
    </AppShell>
  );
}

function Filter({
  label,
  value,
  set,
  options,
  className,
  optionLabel,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  options: string[];
  className?: string;
  optionLabel?: (value: string) => string;
}) {
  return (
    <label className={className}>
      <span>{label}</span>
      <select value={value} onChange={(e) => set(e.target.value)}>
        {options.map((x) => (
          <option value={x} key={x}>
            {optionLabel?.(x) ?? x}
          </option>
        ))}
      </select>
    </label>
  );
}
function matchView(a: Audit, view: View) {
  if (view === "All") return true;
  if (view === "My Audits")
    return (
      a.lead === "Rumesh" ||
      a.lead === "Rumesh Ravi" ||
      a.team?.includes("Rumesh Ravi")
    );
  return a.status === view;
}
function programName(a: Audit, programs: typeof auditPrograms) {
  return (
    programs.find((p) => p.id === a.programId || p.auditIds.includes(a.id))
      ?.name ?? "—"
  );
}
function toAudit(
  id: string,
  f: AuditDraft,
  status: AuditStatus,
  recurrenceSeriesId?: string,
  recurrenceIndex?: number,
): Audit {
  const start = new Date(`${f.start || "2026-09-08"}T00:00:00`);
  const end = new Date(`${f.end || f.start || "2026-09-08"}T00:00:00`);
  const short = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  return {
    id,
    title: f.title || "Untitled Audit",
    type: f.type || "Internal Audit",
    location: f.location || "Chennai Plant",
    businessLineId: f.businessLineId || undefined,
    department: f.department || "Quality",
    process: f.process || undefined,
    lead: f.lead || "",
    plannedDate: start.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    dateRange:
      start.getTime() === end.getTime()
        ? short(start)
        : `${short(start)} – ${short(end)}`,
    status,
    year: start.getFullYear(),
    programId: f.programId || undefined,
    framework: f.framework,
    description: f.description,
    objective: f.objective,
    scope: f.scope,
    criteria: f.criteria,
    reference: f.reference,
    auditee: f.auditee,
    supplier: f.supplier,
    startTime: f.startTime,
    endTime: f.endTime,
    team: f.team,
    template: f.template,
    templateId: f.templateId || undefined,
    templateVersionId: f.templateVersionId || undefined,
    recurrenceSeriesId,
    recurrenceIndex,
    recurrenceFrequency: f.frequency,
  };
}
function AuditQuickView({
  audit,
  programs,
  onClose,
}: {
  audit: Audit;
  programs: typeof auditPrograms;
  onClose: () => void;
}) {
  const readiness = [
    audit.plannedDate,
    audit.lead,
    audit.team?.length,
    audit.scope,
    audit.objective,
    audit.template,
  ].filter(Boolean).length;
  return (
    <aside className="audit-quick-view">
      <header>
        <div>
          <code>{audit.id}</code>
          <h2>{audit.title}</h2>
        </div>
        <button onClick={onClose}>
          <X size={17} />
        </button>
      </header>
      <div className="quick-status">
        <StatusIndicator status={audit.status} />
      </div>
      <Quick label="Schedule" value={audit.dateRange} />
      <Quick label="Location" value={audit.location} />
      <Quick
        label="Business Line"
        value={businessLineName(audit.businessLineId)}
      />
      <Quick label="Department" value={audit.department} />
      <Quick
        label="Frequency"
        value={recurrenceLabels[audit.recurrenceFrequency ?? "one_time"]}
      />
      <Quick label="Lead Auditor" value={audit.lead || "Not assigned"} />
      <Quick label="Program" value={programName(audit, programs)} />
      <Quick label="Checklist" value={audit.template ?? "Not selected"} />
      <Quick label="Readiness" value={`${readiness} / 6 complete`} />
      <footer>
        <Link className="button-primary" href={`/audits/${audit.id}`}>
          Open Audit
        </Link>
        <button className="button-secondary">Edit</button>
        <button className="button-quiet" onClick={onClose}>
          Close
        </button>
      </footer>
    </aside>
  );
}
function Quick({ label, value }: { label: string; value: string }) {
  return (
    <div className="quick-field">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
