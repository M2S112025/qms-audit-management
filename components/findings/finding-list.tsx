"use client";
import { useMemo, useState } from "react";
import { Check, Filter, Search, Square } from "lucide-react";
import {
  findingLabel,
  openFindingStatuses,
  type Finding,
} from "@/data/findings";
import { getTodayISO } from "@/lib/date";

export type FindingView =
  | "All Open"
  | "Assigned to Me"
  | "Overdue"
  | "Major NC"
  | "Awaiting Verification"
  | "Closed";
export type FindingFilters = {
  status: string;
  severity: string;
  audit: string;
  location: string;
  department: string;
  owner: string;
  auditor: string;
  priority: string;
  due: string;
  type: string;
};
const emptyFilters: FindingFilters = {
  status: "",
  severity: "",
  audit: "",
  location: "",
  department: "",
  owner: "",
  auditor: "",
  priority: "",
  due: "",
  type: "",
};
export function FindingListPane({
  items,
  selected,
  onSelect,
  currentUser,
}: {
  items: Finding[];
  selected?: string;
  onSelect: (id: string) => void;
  currentUser: string;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<FindingView>("All Open");
  const [sort, setSort] = useState(() =>
    typeof window === "undefined"
      ? "Newest"
      : (localStorage.getItem("qms-finding-sort") ?? "Newest"),
  );
  const [filters, setFilters] = useState(emptyFilters);
  const [draft, setDraft] = useState(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const today = getTodayISO();
  const active = Object.values(filters).filter(Boolean).length;
  const views: FindingView[] = [
    "All Open",
    "Assigned to Me",
    "Overdue",
    "Major NC",
    "Awaiting Verification",
    "Closed",
  ];
  const shown = useMemo(
    () =>
      items
        .filter((f) => {
          const hay =
            `${f.id} ${f.title} ${f.description} ${f.auditId} ${f.owner} ${f.clause} ${f.location}`.toLowerCase();
          if (!hay.includes(query.toLowerCase())) return false;
          if (view === "All Open" && !openFindingStatuses.includes(f.status))
            return false;
          if (view === "Assigned to Me" && f.owner !== currentUser)
            return false;
          if (
            view === "Overdue" &&
            !(f.dueDate < today && openFindingStatuses.includes(f.status))
          )
            return false;
          if (view === "Major NC" && f.severity !== "Major") return false;
          if (
            view === "Awaiting Verification" &&
            f.status !== "Awaiting Verification"
          )
            return false;
          if (view === "Closed" && f.status !== "Closed") return false;
          return (
            (!filters.status || f.status === filters.status) &&
            (!filters.severity || f.severity === filters.severity) &&
            (!filters.audit || f.auditId === filters.audit) &&
            (!filters.location || f.location === filters.location) &&
            (!filters.department || f.department === filters.department) &&
            (!filters.owner || f.owner === filters.owner) &&
            (!filters.auditor || f.createdBy === filters.auditor) &&
            (!filters.priority || f.priority === filters.priority) &&
            (!filters.type || f.type === filters.type) &&
            (!filters.due ||
              (filters.due === "Overdue"
                ? f.dueDate < today
                : f.dueDate >= today))
          );
        })
        .sort((a, b) => sortFindings(a, b, sort, today)),
    [items, query, view, filters, sort, currentUser, today],
  );
  return (
    <aside className="finding-list-pane">
      <div className="finding-search">
        <label>
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search findings..."
          />
        </label>
        <button
          onClick={() => {
            setDraft(filters);
            setFilterOpen(!filterOpen);
          }}
          aria-label="Filter findings"
        >
          <Filter size={14} />
          {active > 0 && <b>{active}</b>}
        </button>
        {filterOpen && (
          <FindingFilterPanel
            draft={draft}
            setDraft={setDraft}
            items={items}
            onReset={() => {
              setDraft(emptyFilters);
              setFilters(emptyFilters);
            }}
            onApply={() => {
              setFilters(draft);
              setFilterOpen(false);
            }}
          />
        )}
      </div>
      <div className="finding-views">
        {views.map((v) => (
          <button
            key={v}
            className={view === v ? "active" : ""}
            onClick={() => setView(v)}
          >
            <span>{v}</span>
            <b>{viewCount(items, v, currentUser, today)}</b>
          </button>
        ))}
      </div>
      <div className="finding-list-tools">
        <span>{shown.length} findings</span>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            localStorage.setItem("qms-finding-sort", e.target.value);
          }}
          aria-label="Sort findings"
        >
          {[
            "Newest",
            "Oldest",
            "Due Soon",
            "Overdue First",
            "Severity",
            "Status",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      {checked.length > 0 && (
        <div className="finding-bulk">
          <b>{checked.length} selected</b>
          <button>Assign</button>
          <button>Change Due Date</button>
          <button>Export</button>
        </div>
      )}
      <div className="finding-records">
        {shown.map((f) => {
          const overdue =
            f.dueDate < today && openFindingStatuses.includes(f.status);
          return (
            <article
              key={f.id}
              className={selected === f.id ? "selected" : ""}
              onClick={() => onSelect(f.id)}
            >
              <button
                className="record-check"
                aria-label={`Select ${f.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setChecked((v) =>
                    v.includes(f.id)
                      ? v.filter((x) => x !== f.id)
                      : [...v, f.id],
                  );
                }}
              >
                {checked.includes(f.id) ? (
                  <Check size={11} />
                ) : (
                  <Square size={11} />
                )}
              </button>
              <div className="finding-row-id">
                <code>{f.id}</code>
                <span>{f.status}</span>
              </div>
              <h3>{f.title}</h3>
              <div className="finding-row-meta">
                <span
                  className={`severity severity-${f.severity.toLowerCase()}`}
                >
                  {findingLabel(f)}
                </span>
                <span>
                  {f.location} · {f.department}
                </span>
              </div>
              <footer>
                <span>{f.owner}</span>
                <b className={overdue ? "overdue" : ""}>
                  {overdue
                    ? `${daysBetween(f.dueDate, today)} days overdue`
                    : `Due ${displayDate(f.dueDate)}`}
                </b>
              </footer>
            </article>
          );
        })}
        {!shown.length && (
          <div className="finding-list-empty">No findings match this view.</div>
        )}
      </div>
    </aside>
  );
}

function FindingFilterPanel({
  draft,
  setDraft,
  items,
  onReset,
  onApply,
}: {
  draft: FindingFilters;
  setDraft: (v: FindingFilters) => void;
  items: Finding[];
  onReset: () => void;
  onApply: () => void;
}) {
  const field = (
    key: keyof FindingFilters,
    label: string,
    values: string[],
  ) => (
    <label>
      <span>{label}</span>
      <select
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
      >
        <option value="">All</option>
        {Array.from(new Set(values.filter(Boolean))).map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="finding-filter-panel">
      <header>
        <b>Filter Findings</b>
        <span>{Object.values(draft).filter(Boolean).length} active</span>
      </header>
      {field(
        "status",
        "Status",
        items.map((x) => x.status),
      )}
      {field(
        "severity",
        "Severity",
        items.map((x) => x.severity),
      )}
      {field(
        "audit",
        "Audit",
        items.map((x) => x.auditId ?? ""),
      )}
      {field(
        "location",
        "Location",
        items.map((x) => x.location),
      )}
      {field(
        "department",
        "Department",
        items.map((x) => x.department ?? ""),
      )}
      {field(
        "owner",
        "Owner",
        items.map((x) => x.owner),
      )}
      {field(
        "auditor",
        "Auditor",
        items.map((x) => x.createdBy),
      )}
      {field(
        "priority",
        "Priority",
        items.map((x) => x.priority),
      )}
      {field("due", "Due Date", ["Overdue", "Upcoming"])}
      {field(
        "type",
        "Finding Type",
        items.map((x) => x.type),
      )}
      <footer>
        <button onClick={onReset}>Reset</button>
        <button onClick={onApply}>Apply</button>
      </footer>
    </div>
  );
}
function viewCount(
  items: Finding[],
  view: FindingView,
  user: string,
  today: string,
) {
  if (view === "All Open")
    return items.filter((f) => openFindingStatuses.includes(f.status)).length;
  if (view === "Assigned to Me")
    return items.filter(
      (f) => f.owner === user && openFindingStatuses.includes(f.status),
    ).length;
  if (view === "Overdue")
    return items.filter(
      (f) => f.dueDate < today && openFindingStatuses.includes(f.status),
    ).length;
  if (view === "Major NC")
    return items.filter((f) => f.severity === "Major").length;
  if (view === "Awaiting Verification")
    return items.filter((f) => f.status === "Awaiting Verification").length;
  return items.filter((f) => f.status === "Closed").length;
}
function sortFindings(a: Finding, b: Finding, sort: string, today: string) {
  if (sort === "Oldest") return a.createdAt.localeCompare(b.createdAt);
  if (sort === "Due Soon") return a.dueDate.localeCompare(b.dueDate);
  if (sort === "Overdue First")
    return (
      Number(!(a.dueDate < today)) - Number(!(b.dueDate < today)) ||
      a.dueDate.localeCompare(b.dueDate)
    );
  if (sort === "Severity")
    return (
      ["Major", "Minor", "Not Applicable"].indexOf(a.severity) -
      ["Major", "Minor", "Not Applicable"].indexOf(b.severity)
    );
  if (sort === "Status") return a.status.localeCompare(b.status);
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}
export function daysBetween(from: string, to: string) {
  return Math.max(
    0,
    Math.round(
      (new Date(`${to}T00:00:00`).getTime() -
        new Date(`${from}T00:00:00`).getTime()) /
        86400000,
    ),
  );
}
export function displayDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
