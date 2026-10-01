"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Filter,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { auditTypes, departments, locations, type Audit } from "@/data/audits";
import { attentionTasks, performance12, performance6 } from "@/data/dashboard";
import { useQmsAudits } from "@/lib/qms-store";
import { useFindings } from "@/lib/finding-store";
import { openFindingStatuses } from "@/data/findings";
import { useActions } from "@/lib/action-store";
import { activeActionStatuses } from "@/data/actions";
import { PriorityIndicator, StatusIndicator } from "./status";
import { QmsPanel } from "./qms-panel";
import { daysBetween, getTodayISO, isOverdue } from "@/lib/date";
import { useRouter } from "next/navigation";

type Filters = {
  location: string;
  year: string;
  type: string;
  department: string;
};
const initial: Filters = {
  location: "All locations",
  year: "2026",
  type: "All audit types",
  department: "All departments",
};
export function Dashboard() {
  const audits = useQmsAudits();
  const [filters, setFilters] = useState(initial);
  const filtered = useMemo(
    () =>
      audits.filter(
        (a) =>
          (filters.location === "All locations" ||
            a.location === filters.location) &&
          a.year === Number(filters.year) &&
          (filters.type === "All audit types" || a.type === filters.type) &&
          (filters.department === "All departments" ||
            a.department === filters.department),
      ),
    [audits, filters],
  );
  function update(key: keyof Filters, value: string) {
    setFilters((v) => ({ ...v, [key]: value }));
  }
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">AUDIT MANAGEMENT</p>
          <h1>Audit Management</h1>
          <p>
            Monitor audit programs, findings, corrective actions and overall
            compliance performance.
          </p>
        </div>
        <Link className="primary-button" href="/audits?new=true">
          <Plus size={16} />
          New Audit
        </Link>
      </div>
      <div className="filterbar">
        <span className="filter-label">
          <Filter size={12} />
          Filters
        </span>
        {(
          [
            ["location", "Location", ["All locations", ...locations]],
            ["year", "Year", ["2026", "2025"]],
            ["type", "Audit Type", ["All audit types", ...auditTypes]],
            ["department", "Department", ["All departments", ...departments]],
          ] as const
        ).map(([key, label, options]) => (
          <label key={key}>
            <span>{label}</span>
            <select
              value={filters[key]}
              onChange={(e) => update(key, e.target.value)}
            >
              {options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        ))}
        <button className="reset" onClick={() => setFilters(initial)}>
          <RotateCcw size={14} />
          Reset filters
        </button>
      </div>
      <div className="dashboard-grid">
        <ProgramHealth items={filtered} year={filters.year} />
        <AuditSchedule audits={filtered.slice(0, 5)} />
        <FindingExposure />
        <AttentionRequired />
        <AuditPerformance />
        <RecentAudits audits={filtered} />
      </div>
    </div>
  );
}

function ProgramHealth({ items, year }: { items: Audit[]; year: string }) {
  const total = items.length;
  const count = (status: Audit["status"]) =>
    items.filter((a) => a.status === status).length;
  const completed = count("Completed");
  const rate = total ? Math.round((completed / total) * 100) : 0;
  return (
    <QmsPanel
      title="Program Health"
      subtitle={`FY ${year} audit plan`}
      className="health"
    >
      <div className="completion">
        <div className="completion-lead">
          <strong>{rate}%</strong>
          <span>Program complete</span>
        </div>
        <p>
          <b>{completed}</b> of <b>{total}</b> audits completed
        </p>
        <div
          className="progress"
          role="progressbar"
          aria-label="Audit completion rate"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rate}
        >
          <i style={{ width: `${rate}%` }} />
        </div>
      </div>
      <div className="metric-list">
        <div>
          <span>Planned</span>
          <b>{count("Planned")}</b>
        </div>
        <div>
          <span>In Progress</span>
          <b>{count("In Progress")}</b>
        </div>
        <div className="danger-text">
          <span>Overdue</span>
          <b>{count("Overdue")}</b>
        </div>
      </div>
    </QmsPanel>
  );
}

function AuditSchedule({ audits: items }: { audits: Audit[] }) {
  return (
    <QmsPanel
      title="Audit Schedule"
      action={
        <Link className="text-link" href="/audits">
          View all <span>→</span>
        </Link>
      }
      className="schedule"
    >
      <div className="schedule-head">
        <span>Date</span>
        <span>Audit</span>
        <span>Location / Lead</span>
        <span>Status</span>
        <span />
      </div>
      <div className="schedule-list">
        {items.length ? (
          items.map((a) => (
            <Link href={`/audits/${a.id}`} key={a.id} className="schedule-row">
              <time>{a.dateRange}</time>
              <span className="audit-name">
                <b>{a.title}</b>
                <small>{a.id}</small>
              </span>
              <span>
                <b>{a.location}</b>
                <small>Lead: {a.lead}</small>
              </span>
              <StatusIndicator status={a.status} />
              <ChevronRight className="schedule-nav" size={15} />
            </Link>
          ))
        ) : (
          <Empty text="No audits match these filters." />
        )}
      </div>
    </QmsPanel>
  );
}

function FindingExposure() {
  const all = useFindings();
  const open = all.filter((f) => openFindingStatuses.includes(f.status));
  const findings = [
    {
      label: "Major NC",
      count: open.filter((f) => f.severity === "Major").length,
      key: "major",
    },
    {
      label: "Minor NC",
      count: open.filter((f) => f.severity === "Minor").length,
      key: "minor",
    },
    {
      label: "Observation",
      count: open.filter((f) => f.type === "Observation").length,
      key: "observation",
    },
    {
      label: "Opportunity for Improvement",
      count: open.filter((f) => f.type === "Opportunity for Improvement")
        .length,
      key: "ofi",
    },
  ];
  const ages = [
    { label: "0–7 days", min: 0, max: 7 },
    { label: "8–15 days", min: 8, max: 15 },
    { label: "16–30 days", min: 16, max: 30 },
    { label: "> 30 days", min: 31, max: 999 },
  ].map((a, i) => ({
    ...a,
    count: open.filter((f) => {
      const age = Math.max(
        0,
        Math.round(
          daysBetween(f.createdAt,getTodayISO()),
        ),
      );
      return age >= a.min && age <= a.max;
    }).length,
    risk: i === 3,
  }));
  const total = open.length;
  const maximum = Math.max(1, ...findings.map((f) => f.count));
  return (
    <QmsPanel
      title="Finding Exposure"
      subtitle={`${total} findings currently open`}
      className="findings"
    >
      <div className="exposure-bar" aria-label={`${total} open findings`}>
        {findings.map((f) => (
          <i
            key={f.key}
            className={`severity-${f.key}`}
            style={{ width: `${total ? (f.count / total) * 100 : 0}%` }}
            title={`${f.label}: ${f.count}`}
          />
        ))}
      </div>
      <div className="finding-list">
        {findings.map((f) => (
          <Link href={`/findings?severity=${f.key}`} key={f.key}>
            <span>
              <i className={`severity-${f.key}`} />
              {f.label}
            </span>
            <span className="exposure-track" aria-hidden="true">
              <i
                className={`severity-${f.key}`}
                style={{ width: `${(f.count / maximum) * 100}%` }}
              />
            </span>
            <b>{f.count}</b>
          </Link>
        ))}
      </div>
      <div className="total-open">
        <span>Total Open</span>
        <b>{total}</b>
      </div>
      <h3>Finding Age</h3>
      <div className="age-list">
        {ages.map((age) => (
          <span key={age.label} className={age.risk ? "aged" : ""}>
            {age.label} <b>{age.count}</b>
          </span>
        ))}
      </div>
    </QmsPanel>
  );
}

function AttentionRequired() {
  const findings = useFindings();
  const actions = useActions();
  const actionTasks = actions
    .filter(
      (a) =>
        activeActionStatuses.includes(a.status) && isOverdue(a.dueDate),
    )
    .map((a) => ({
      id: a.id,
      title: `Overdue corrective action · ${a.title}`,
      owner: a.owner,
      due: `${daysBetween(a.dueDate,getTodayISO())} days overdue`,
      priority: a.priority === "Critical" ? "High" : a.priority,
      href: `/actions/${a.id}`,
    }));
  const findingTasks = findings
    .filter(
      (f) => openFindingStatuses.includes(f.status) && isOverdue(f.dueDate),
    )
    .map((f) => ({
      id: f.id,
      title: `${f.status} · ${f.title}`,
      owner: f.owner,
      due: `${daysBetween(f.dueDate,getTodayISO())} days overdue`,
      priority: f.priority === "Critical" ? "High" : f.priority,
      href: `/findings/${f.id}`,
    }));
  const tasks = [
    ...actionTasks,
    ...findingTasks,
    ...attentionTasks.filter((t) => t.id.startsWith("AUD-")),
  ].slice(0, 5);
  return (
    <QmsPanel
      title="Attention Required"
      subtitle="Items requiring action or review"
      action={<span className="count-badge">{tasks.length} OPEN</span>}
      className="attention"
    >
      <div className="attention-head">
        <span>Record</span>
        <span>Action</span>
        <span>Owner</span>
        <span>Due</span>
        <span>Priority</span>
        <span />
      </div>
      {tasks.map((t) => {
        const overdue = t.due.includes("overdue");
        return (
          <Link
            href={t.href}
            key={t.id}
            className={`attention-row ${overdue ? "is-overdue" : ""}`}
          >
            <code>{t.id}</code>
            <b>{t.title}</b>
            <span>{t.owner}</span>
            <span className={overdue ? "danger-text" : ""}>{t.due}</span>
            <PriorityIndicator priority={t.priority} />
            <button
              onClick={(e) => e.preventDefault()}
              aria-label="More actions"
            >
              <Ellipsis size={17} />
            </button>
          </Link>
        );
      })}
    </QmsPanel>
  );
}

function AuditPerformance() {
  const [period, setPeriod] = useState<"6" | "12">("6");
  const [group, setGroup] = useState("All");
  const data = period === "6" ? performance6 : performance12;
  return (
    <QmsPanel
      title="Audit Performance"
      subtitle="Audit completion and compliance score trend"
      action={
        <div className="chart-controls">
          <div className="segmented">
            <button
              className={period === "6" ? "selected" : ""}
              onClick={() => setPeriod("6")}
            >
              Last 6 months
            </button>
            <button
              className={period === "12" ? "selected" : ""}
              onClick={() => setPeriod("12")}
            >
              Last 12 months
            </button>
          </div>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            aria-label="Group performance"
          >
            <option>All</option>
            <option>By location</option>
            <option>By audit type</option>
          </select>
        </div>
      }
      className="performance"
    >
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 18, right: 16, left: -10, bottom: 4 }}
          >
            <CartesianGrid stroke="#E2E2DE" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 10]}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[70, 100]}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                border: "1px solid #E2E2DE",
                borderRadius: 6,
                fontSize: 12,
                boxShadow: "0 8px 20px rgba(21,24,30,.08)",
              }}
            />
            <Legend iconType="circle" iconSize={7} />
            <Bar
              yAxisId="left"
              dataKey="completed"
              name="Audits completed"
              fill="#555555"
              barSize={18}
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="score"
              name="Average score"
              stroke="#B88700"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#FFFFFF", stroke: "#9B7200", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </QmsPanel>
  );
}

type SortKey = keyof Pick<
  Audit,
  | "id"
  | "title"
  | "type"
  | "location"
  | "department"
  | "lead"
  | "plannedDate"
  | "status"
  | "score"
>;
function RecentAudits({ audits: items }: { audits: Audit[] }) {
  const router=useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState<SortKey>("plannedDate");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const shown = useMemo(
    () =>
      items
        .filter(
          (a) =>
            (status === "All" || a.status === status) &&
            `${a.id} ${a.title} ${a.location} ${a.lead}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort(
          (a, b) =>
            String(a[sort] ?? "").localeCompare(String(b[sort] ?? "")) *
            (asc ? 1 : -1),
        ),
    [items, query, status, sort, asc],
  );
  function changeSort(k: SortKey) {
    if (k === sort) setAsc(!asc);
    else {
      setSort(k);
      setAsc(true);
    }
  }
  const columns: [string, SortKey][] = [
    ["Audit ID", "id"],
    ["Audit", "title"],
    ["Type", "type"],
    ["Location", "location"],
    ["Department", "department"],
    ["Lead Auditor", "lead"],
    ["Planned Date", "plannedDate"],
    ["Status", "status"],
    ["Score", "score"],
  ];
  const actions = (
    <div className="recent-actions">
      <label>
        <Search size={15} />
        <input
          aria-label="Search recent audits"
          placeholder="Search audits"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <select
        aria-label="Filter recent audits by status"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
      >
        <option value="All">All statuses</option>
        {["Planned", "In Progress", "Completed", "Overdue", "Cancelled"].map(
          (s) => (
            <option key={s}>{s}</option>
          ),
        )}
      </select>
      <Link className="text-link" href="/audits">
        View all <span>→</span>
      </Link>
    </div>
  );
  return (
    <QmsPanel
      title="Recent Audits"
      subtitle={`${shown.length} records in current view`}
      action={actions}
      className="recent"
    >
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map(([label, key]) => (
                <th key={key}>
                  <button onClick={() => changeSort(key)}>
                    {label}
                    {sort === key ? (
                      asc ? (
                        <ArrowUp />
                      ) : (
                        <ArrowDown />
                      )
                    ) : (
                      <ArrowUpDown />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.slice((page - 1) * 8, page * 8).map((a) => (
              <tr
                key={a.id}
                onClick={() => router.push(`/audits/${a.id}`)}
              >
                <td>
                  <code>{a.id}</code>
                </td>
                <td>
                  <b>{a.title}</b>
                </td>
                <td>{a.type}</td>
                <td>{a.location}</td>
                <td>{a.department}</td>
                <td>{a.lead}</td>
                <td>{a.plannedDate}</td>
                <td>
                  <StatusIndicator status={a.status} />
                </td>
                <td
                  className={a.status === "Completed" ? "score-complete" : ""}
                >
                  {a.score ? `${a.score}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <Empty text="No audits match your search." />}
      </div>
      <div className="pagination">
        <span>
          Showing {shown.length ? (page-1)*8+1 : 0}–{Math.min(page*8, shown.length)} of{" "}
          {shown.length}
        </span>
        <div>
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={16} />
          </button>
          <b>{page}</b>
          <button
            disabled={page * 8 >= shown.length}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </QmsPanel>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}
