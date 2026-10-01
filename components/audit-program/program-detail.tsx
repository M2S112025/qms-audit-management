"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  List,
  PanelRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusIndicator } from "@/components/status";
import { auditTypes, departments, locations, type Audit } from "@/data/audits";
import {
  auditPrograms,
  programActivity,
  scheduleMeta,
  type AuditProgram,
} from "@/data/programs";
import { saveAudit, saveAuditSeries, useQmsAudits } from "@/lib/qms-store";
import type { AuditRecurrence } from "@/data/recurrences";
import { businessLineName, businessLines } from "@/data/organization";
import { AddAuditDrawer, ProgramDrawer } from "./drawers";

type Tab = "overview" | "audits" | "calendar" | "activity";
export function ProgramDetailPage({
  id,
  initialTab = "overview",
}: {
  id: string;
  initialTab?: Tab;
}) {
  const base = auditPrograms.find((p) => p.id === id)!;
  const [program, setProgram] = useState(base);
  const storedAudits = useQmsAudits();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [edit, setEdit] = useState(false);
  const [add, setAdd] = useState(false);
  const [details, setDetails] = useState(false);
  const [toast, setToast] = useState("");
  const linked = useMemo(
    () =>
      storedAudits.filter(
        (a) => program.auditIds.includes(a.id) || a.programId === program.id,
      ),
    [program.auditIds, program.id, storedAudits],
  );
  const completed = linked.filter((a) => a.status === "Completed").length;
  const planned = linked.filter((a) => a.status === "Planned").length;
  const overdue = linked.filter((a) => a.status === "Overdue").length;
  const progress = linked.length
    ? Math.round((completed / linked.length) * 100)
    : 0;
  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }
  function addAudit(audits: Audit[], recurrence?: AuditRecurrence) {
    const linkedAudits = audits.map((audit) => ({
      ...audit,
      programId: program.id,
    }));
    if (recurrence) saveAuditSeries(linkedAudits, recurrence, program.id);
    else linkedAudits.forEach((audit) => saveAudit(audit, program.id));
    setProgram((current) => ({
      ...current,
      auditIds: Array.from(
        new Set([...linkedAudits.map((audit) => audit.id), ...current.auditIds]),
      ),
    }));
    setAdd(false);
    notify(
      audits.length > 1
        ? `${audits.length} recurring audit occurrences added to the program.`
        : `${audits[0].id} added to the program.`,
    );
  }
  return (
    <AppShell>
      <div className="page program-detail">
        <div className="detail-command">
          <div>
            <div className="detail-breadcrumb">
              <Link href="/audit-program">Audit Program</Link>
              <span>/</span>
              <b>{program.id}</b>
            </div>
            <p className="eyebrow">AUDIT PROGRAM</p>
            <h1>{program.name}</h1>
            <div className="program-meta">
              <code>{program.id}</code>
              <span>{program.period}</span>
              <ProgramStatus status={program.status} />
            </div>
          </div>
          <div className="detail-actions">
            <button className="button-secondary" onClick={() => setEdit(true)}>
              Edit Program
            </button>
            <button
              className="button-secondary"
              onClick={() => setDetails(true)}
            >
              <PanelRight size={15} />
              Program Details
            </button>
            <button className="button-primary" onClick={() => setAdd(true)}>
              <Plus size={15} />
              Add Audit
            </button>
            <button className="icon-outline" aria-label="More program actions">
              <Ellipsis size={17} />
            </button>
          </div>
        </div>
        <nav className="program-tabs">
          {(["overview", "audits", "calendar", "activity"] as Tab[]).map((t) =>
            t === "calendar" ? (
              <Link
                key={t}
                href={`/audit-program/${id}/calendar`}
                aria-current={tab === t ? "page" : undefined}
              >
                {title(t)}
              </Link>
            ) : (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {title(t)}
              </button>
            ),
          )}
        </nav>
        <ProgramSummary
          total={linked.length}
          completed={completed}
          planned={planned}
          overdue={overdue}
          progress={progress}
        />
        {tab === "overview" && (
          <div className="program-workspace">
            <AuditSchedule
              audits={linked}
              onCalendar={() => setTab("calendar")}
              onAdd={() => setAdd(true)}
            />
          </div>
        )}
        {tab === "audits" && (
          <AuditSchedule
            audits={linked}
            onCalendar={() => setTab("calendar")}
            onAdd={() => setAdd(true)}
            wide
          />
        )}
        {tab === "calendar" && <AuditCalendar audits={linked} />}{" "}
        {tab === "activity" && <ActivityTimeline />}
        {edit && (
          <ProgramDrawer
            mode="edit"
            program={program}
            onClose={() => setEdit(false)}
            onSave={(v) => {
              setProgram((p) => ({
                ...p,
                name: v.name,
                description: v.description,
                startDate: v.start,
                endDate: v.end,
                period: formatPeriod(v.start, v.end),
                owner: v.owner,
                locations: v.locations,
                businessLineIds: v.businessLineIds,
                departments: v.departments.split(",").filter(Boolean),
                auditTypes: v.types.split(",").filter(Boolean),
                frequency: v.frequency,
                lastUpdated: "Just now",
              }));
              setEdit(false);
              notify("Program changes saved.");
            }}
          />
        )}
        {add && (
          <AddAuditDrawer onClose={() => setAdd(false)} onAdd={addAudit} />
        )}{" "}
        {details && (
          <>
            <button
              className="context-drawer-scrim"
              onClick={() => setDetails(false)}
              aria-label="Close program details"
            />
            <ProgramContext
              program={program}
              audits={linked}
              onClose={() => setDetails(false)}
            />
          </>
        )}
        {toast && <div className="qms-toast">{toast}</div>}
      </div>
    </AppShell>
  );
}

function title(tab: Tab) {
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}
function formatPeriod(start: string, end: string) {
  const format = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  return `${format(start)} – ${format(end)}`;
}
function ProgramStatus({ status }: { status: AuditProgram["status"] }) {
  return (
    <span className={`program-status program-status-${status.toLowerCase()}`}>
      <i />
      {status}
    </span>
  );
}
function ProgramSummary({
  total,
  completed,
  planned,
  overdue,
  progress,
}: {
  total: number;
  completed: number;
  planned: number;
  overdue: number;
  progress: number;
}) {
  return (
    <section className="program-summary">
      <Summary value={total} label="Total Audits" />
      <Summary value={completed} label="Completed" />
      <Summary value={planned} label="Planned" />
      <Summary value={overdue} label="Overdue" critical />
      <Summary value={`${progress}%`} label="Program Complete" accent />
    </section>
  );
}
function Summary({
  value,
  label,
  critical,
  accent,
}: {
  value: number | string;
  label: string;
  critical?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`${critical ? "critical-summary" : ""} ${accent ? "accent-summary" : ""}`}
    >
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function AuditSchedule({
  audits,
  onCalendar,
  onAdd,
  wide = false,
}: {
  audits: Audit[];
  onCalendar: () => void;
  onAdd: () => void;
  wide?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [location, setLocation] = useState("All");
  const [businessLine, setBusinessLine] = useState("All");
  const [type, setType] = useState("All");
  const [department, setDepartment] = useState("All");
  const [menu, setMenu] = useState<string>();
  const filtered = audits.filter(
    (a) =>
      (status === "All" || a.status === status) &&
      (location === "All" || a.location === location) &&
      (businessLine === "All" || a.businessLineId === businessLine) &&
      (type === "All" || a.type === type) &&
      (department === "All" || a.department === department) &&
      `${a.id} ${a.title}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className={`schedule-workspace ${wide ? "wide" : ""}`}>
      <header>
        <div>
          <h2>Audit Schedule</h2>
          <p>Audits included in this program</p>
        </div>
        <div className="view-toggle">
          <button className="selected">
            <List size={14} />
            List
          </button>
          <button onClick={onCalendar}>
            <CalendarDays size={14} />
            Calendar
          </button>
        </div>
      </header>
      <div className="schedule-toolbar">
        <label>
          <Search size={14} />
          <input
            placeholder="Search audits"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>All</option>
          {["Planned", "In Progress", "Completed", "Overdue", "Cancelled"].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
        <select
          aria-label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option>All</option>
          {locations.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Audit type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>All</option>
          {auditTypes.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Business line"
          value={businessLine}
          onChange={(e) => setBusinessLine(e.target.value)}
        >
          <option value="All">All business lines</option>
          {businessLines.map((line) => (
            <option value={line.id} key={line.id}>
              {line.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option>All</option>
          {departments.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button className="button-primary" onClick={onAdd}>
          <Plus size={14} />
          Add Audit
        </button>
      </div>
      <div className="audit-program-table">
        <table>
          <thead>
            <tr>
              <th>Planned Date</th>
              <th>Audit</th>
              <th>Type</th>
              <th>Location</th>
              <th>Department</th>
              <th>Lead Auditor</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Score</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const meta = scheduleMeta.find((x) => x.auditId === a.id);
              return (
                <tr key={a.id}>
                  <td>{a.dateRange}</td>
                  <td>
                    <Link href={`/audits/${a.id}`}>
                      <b>{a.title}</b>
                      <small>{a.id}</small>
                    </Link>
                  </td>
                  <td>{a.type}</td>
                  <td>
                    {a.location}
                    <small>{businessLineName(a.businessLineId)}</small>
                  </td>
                  <td>{a.department}</td>
                  <td>{a.lead}</td>
                  <td>{meta?.duration ?? "1 day"}</td>
                  <td>
                    <StatusIndicator status={a.status} />
                  </td>
                  <td
                    className={a.status === "Completed" ? "score-complete" : ""}
                  >
                    {a.score ? `${a.score}%` : "—"}
                  </td>
                  <td className="menu-cell">
                    <button
                      aria-label={`Actions for ${a.id}`}
                      onClick={() => setMenu(menu === a.id ? undefined : a.id)}
                    >
                      <Ellipsis size={16} />
                    </button>
                    {menu === a.id && (
                      <div className="row-menu audit-menu">
                        <Link href={`/audits/${a.id}`}>View Audit</Link>
                        <button>Edit Schedule</button>
                        <button>Change Auditor</button>
                        <button>Duplicate</button>
                        <button>Cancel Audit</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="module-empty">
            <h3>No audits scheduled</h3>
            <p>
              This audit program doesn&apos;t have audits matching the selected
              filters.
            </p>
            <button className="button-primary" onClick={onAdd}>
              <Plus size={14} />
              Add Audit
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ProgramContext({
  program,
  audits,
  onClose,
}: {
  program: AuditProgram;
  audits: Audit[];
  onClose?: () => void;
}) {
  const overdue = audits.filter((a) => a.status === "Overdue");
  return (
    <aside className="program-context program-context-drawer">
      {onClose && (
        <button className="context-close" onClick={onClose}>
          <X size={16} /> Close
        </button>
      )}
      <ContextSection title="Program Information">
        <Meta label="Program Owner" value={program.owner} />
        <Meta label="Period" value={program.period} />
        <Meta label="Locations" value={program.locations.join(" · ")} />
        <Meta
          label="Business Lines"
          value={
            program.businessLineIds?.map(businessLineName).join(" · ") ||
            "Not specified"
          }
        />
        <Meta label="Default Frequency" value={program.frequency} />
        <Meta
          label="Departments"
          value={`${program.departments.length} departments`}
        />
        <Meta
          label="Audit Types"
          value={`${program.auditTypes.length} types`}
        />
        <Meta label="Created" value={program.created} />
        <Meta label="Last Updated" value={program.lastUpdated} />
      </ContextSection>
      <ContextSection title="Program Health">
        <Health
          label="On Track"
          value={
            audits.filter(
              (a) => a.status === "Completed" || a.status === "Planned",
            ).length
          }
        />
        <Health
          label="At Risk"
          value={audits.filter((a) => a.status === "In Progress").length}
          warning
        />
        <Health label="Overdue" value={overdue.length} critical />
        <Health label="Unscheduled" value={0} />
      </ContextSection>
      <ContextSection title="Needs Attention">
        {overdue.map((a) => (
          <Link href={`/audits/${a.id}`} className="attention-mini" key={a.id}>
            <code>{a.id}</code>
            <b>{a.title}</b>
            <span>Overdue</span>
          </Link>
        ))}
        <Link href="/audits/AUD-2026-023" className="attention-mini">
          <code>AUD-2026-023</code>
          <b>Customer Requirements Audit</b>
          <span>Lead review pending</span>
        </Link>
        {!overdue.length && (
          <p className="context-empty">No attention items.</p>
        )}
      </ContextSection>
    </aside>
  );
}
function ContextSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="context-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="context-meta">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
function Health({
  label,
  value,
  warning,
  critical,
}: {
  label: string;
  value: number;
  warning?: boolean;
  critical?: boolean;
}) {
  return (
    <div
      className={`health-row ${warning ? "warning-text" : ""} ${critical ? "danger-text" : ""}`}
    >
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function AuditCalendar({ audits }: { audits: Audit[] }) {
  const [selected, setSelected] = useState<Audit>();
  const [location, setLocation] = useState("All");
  const [type, setType] = useState("All");
  const firstDate = audits[0]?.plannedDate
    ? new Date(audits[0].plannedDate)
    : new Date("2026-09-01T00:00:00");
  const [month, setMonth] = useState(
    () => new Date(firstDate.getFullYear(), firstDate.getMonth(), 1),
  );
  const visible = audits.filter(
    (a) => {
      const date = new Date(a.plannedDate);
      return (
        (location === "All" || a.location === location) &&
        (type === "All" || a.type === type) &&
        date.getMonth() === month.getMonth() &&
        date.getFullYear() === month.getFullYear()
      );
    },
  );
  const dayCount = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const mondayOffset = (new Date(month).getDay() + 6) % 7;
  const cellCount = Math.ceil((mondayOffset + dayCount) / 7) * 7;
  const days = Array.from({ length: cellCount }, (_, index) => {
    const day = index - mondayOffset + 1;
    return day > 0 && day <= dayCount ? day : null;
  });
  const today=new Date();
  const todayNumber=month.getFullYear()===today.getFullYear()&&month.getMonth()===today.getMonth()?today.getDate():undefined;
  return (
    <section className="calendar-workspace">
      <header>
        <div className="calendar-title">
          <button
            aria-label="Previous month"
            onClick={() =>
              setMonth(
                (current) =>
                  new Date(current.getFullYear(), current.getMonth() - 1, 1),
              )
            }
          >
            <ChevronLeft size={17} />
          </button>
          <h2>
            {month.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            aria-label="Next month"
            onClick={() =>
              setMonth(
                (current) =>
                  new Date(current.getFullYear(), current.getMonth() + 1, 1),
              )
            }
          >
            <ChevronRight size={17} />
          </button>
          <button
            className="button-secondary"
            onClick={() => {
              const today = new Date();
              setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            }}
          >
            Today
          </button>
        </div>
        <div>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="All">All locations</option>
            {locations.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="All">All audit types</option>
            {auditTypes.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </header>
      <div className="calendar-week">
        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${day === todayNumber ? "today" : ""} ${!day ? "blank" : ""}`}
          >
            <time>{day}</time>
            {day &&
              visible
                .filter((a) => new Date(a.plannedDate).getDate() === day)
                .map((a) => (
                  <button
                    key={a.id}
                    className={`calendar-audit ${selected?.id === a.id ? "selected" : ""}`}
                    onClick={() => setSelected(a)}
                  >
                    <b>{a.title}</b>
                    <small>{a.location.replace(" Plant", "")}</small>
                    <StatusIndicator status={a.status} />
                  </button>
                ))}
          </div>
        ))}
      </div>
      {!visible.length && (
        <div className="module-empty">
          <h3>No calendar records</h3>
          <p>No audits are scheduled for the selected calendar filters.</p>
        </div>
      )}
      {selected && (
        <AuditQuickView
          audit={selected}
          onClose={() => setSelected(undefined)}
        />
      )}
    </section>
  );
}

function AuditQuickView({
  audit,
  onClose,
}: {
  audit: Audit;
  onClose: () => void;
}) {
  const meta = scheduleMeta.find((x) => x.auditId === audit.id);
  return (
    <aside className="quick-view">
      <header>
        <div>
          <code>{audit.id}</code>
          <h2>{audit.title}</h2>
        </div>
        <button onClick={onClose} aria-label="Close quick view">
          <X size={17} />
        </button>
      </header>
      <div className="quick-status">
        <StatusIndicator status={audit.status} />
      </div>
      <Meta label="Planned Date" value={audit.plannedDate} />
      <Meta label="Location" value={audit.location} />
      <Meta
        label="Business Line"
        value={businessLineName(audit.businessLineId)}
      />
      <Meta label="Department" value={audit.department} />
      <Meta label="Lead Auditor" value={audit.lead} />
      <Meta label="Audit Type" value={audit.type} />
      <Meta
        label="Checklist"
        value={meta?.checklist ?? "QMS Audit Checklist"}
      />
      <footer>
        <Link className="button-primary" href={`/audits/${audit.id}`}>
          Open Audit
        </Link>
        <button className="button-secondary">Edit Schedule</button>
        <button className="button-quiet" onClick={onClose}>
          Close
        </button>
      </footer>
    </aside>
  );
}

function ActivityTimeline() {
  return (
    <section className="activity-panel">
      <header>
        <h2>Program Activity</h2>
        <p>Audit trail and recent planning changes</p>
      </header>
      <div>
        {programActivity.map((x) => (
          <article key={x.id}>
            <time>
              {x.date}
              <small>{x.time}</small>
            </time>
            <i />
            <p>
              <b>{x.actor}</b> {x.action}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
