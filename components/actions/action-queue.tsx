"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, Filter, Search, Square } from "lucide-react";
import {
  actionDueLabel,
  activeActionStatuses,
  type CorrectiveAction,
} from "@/data/actions";
import { getTodayISO } from "@/lib/date";
export type ActionView =
  | "All Actions"
  | "My Actions"
  | "Due Soon"
  | "Overdue"
  | "Awaiting Verification"
  | "Returned"
  | "Completed";
type ActionFilterValues = {
  status: string;
  priority: string;
  owner: string;
  location: string;
  department: string;
  audit: string;
  finding: string;
  type: string;
  due: string;
};
export function ActionQueue({
  actions,
  selected,
  user,
  onSelect,
}: {
  actions: CorrectiveAction[];
  selected?: string;
  user: string;
  onSelect: (id: string) => void;
}) {
  const [view, setView] = useState<ActionView>(
    user === "Siva Kumar" ? "My Actions" : "All Actions",
  );
  useEffect(() => {
    if (user === "Siva Kumar") setView("My Actions");
  }, [user]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Due Soon");
  const [group, setGroup] = useState("None");
  const [filters, setFilters] = useState<ActionFilterValues>({
    status: "",
    priority: "",
    owner: "",
    location: "",
    department: "",
    audit: "",
    finding: "",
    type: "",
    due: "",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const today = getTodayISO();
  const shown = useMemo(
    () =>
      actions
        .filter((a) => {
          const hay =
            `${a.id} ${a.title} ${a.description} ${a.owner} ${a.findingId} ${a.auditId} ${a.location} ${a.department}`.toLowerCase();
          if (!hay.includes(query.toLowerCase())) return false;
          if (
            view === "My Actions" &&
            !(a.owner === user && activeActionStatuses.includes(a.status))
          )
            return false;
          if (
            view === "Due Soon" &&
            !(
              a.dueDate >= today &&
              a.dueDate <= new Date(Date.now()+7*86400000).toISOString().slice(0,10) &&
              activeActionStatuses.includes(a.status)
            )
          )
            return false;
          if (
            view === "Overdue" &&
            !(a.dueDate < today && activeActionStatuses.includes(a.status))
          )
            return false;
          if (
            view === "Awaiting Verification" &&
            a.status !== "Awaiting Verification"
          )
            return false;
          if (view === "Returned" && a.status !== "Returned") return false;
          if (view === "Completed" && a.status !== "Completed") return false;
          return (
            (!filters.status || a.status === filters.status) &&
            (!filters.priority || a.priority === filters.priority) &&
            (!filters.owner || a.owner === filters.owner) &&
            (!filters.location || a.location === filters.location) &&
            (!filters.department || a.department === filters.department) &&
            (!filters.audit || a.auditId === filters.audit) &&
            (!filters.finding || a.findingId === filters.finding) &&
            (!filters.type || a.type === filters.type) &&
            (!filters.due ||
              (filters.due === "Overdue"
                ? a.dueDate < today
                : a.dueDate >= today))
          );
        })
        .sort((a, b) => sortActions(a, b, sort, today)),
    [actions, query, view, filters, sort, user, today],
  );
  const grouped = shown.reduce<Record<string, CorrectiveAction[]>>(
    (result, action) => {
      const key = groupValue(action, group);
      result[key] = [...(result[key] ?? []), action];
      return result;
    },
    {},
  );
  const groups: [string, CorrectiveAction[]][] =
    group === "None" ? [["", shown]] : Object.entries(grouped);
  const views: ActionView[] = [
    "All Actions",
    "My Actions",
    "Due Soon",
    "Overdue",
    "Awaiting Verification",
    "Returned",
    "Completed",
  ];
  return (
    <aside className="action-queue">
      <div className="action-search">
        <label>
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions..."
          />
        </label>
        <button onClick={() => setFilterOpen(!filterOpen)}>
          <Filter size={14} />
          {Object.values(filters).filter(Boolean).length > 0 && (
            <b>{Object.values(filters).filter(Boolean).length}</b>
          )}
        </button>
        {filterOpen && (
          <ActionFilters
            actions={actions}
            filters={filters}
            setFilters={setFilters}
            onClose={() => setFilterOpen(false)}
          />
        )}
      </div>
      <nav>
        {views.map((v) => (
          <button
            className={view === v ? "active" : ""}
            key={v}
            onClick={() => setView(v)}
          >
            <span>{v}</span>
            <b>{countView(actions, v, user, today)}</b>
          </button>
        ))}
      </nav>
      <div className="action-queue-tools">
        <span>{shown.length} actions</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {[
            "Due Soon",
            "Overdue First",
            "Newest",
            "Oldest",
            "Priority",
            "Recently Updated",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select value={group} onChange={(e) => setGroup(e.target.value)}>
          {["None", "Status", "Owner", "Due Date", "Priority", "Finding"].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </div>
      {checked.length > 0 && (
        <div className="action-bulk">
          <b>{checked.length} selected</b>
          <button>Assign Owner</button>
          <button>Change Due Date</button>
          <button>Export</button>
        </div>
      )}
      <div className="action-records">
        {groups.map(([label, items]) => (
          <section key={label || "all"}>
            {label && (
              <h3>
                {label} · {items?.length ?? 0}
              </h3>
            )}
            {items?.map((a) => (
              <article
                key={a.id}
                className={selected === a.id ? "selected" : ""}
                onClick={() => onSelect(a.id)}
              >
                <button
                  className="record-check"
                  onClick={(e) => {
                    e.stopPropagation();
                    setChecked((v) =>
                      v.includes(a.id)
                        ? v.filter((x) => x !== a.id)
                        : [...v, a.id],
                    );
                  }}
                >
                  {checked.includes(a.id) ? (
                    <Check size={11} />
                  ) : (
                    <Square size={11} />
                  )}
                </button>
                <div>
                  <code>{a.id}</code>
                  <span
                    className={`action-priority priority-${a.priority.toLowerCase()}`}
                  >
                    {a.priority}
                  </span>
                </div>
                <h4>{a.title}</h4>
                <p>
                  <span>{a.owner}</span>
                  <b
                    className={
                      a.dueDate < today &&
                      activeActionStatuses.includes(a.status)
                        ? "overdue"
                        : ""
                    }
                  >
                    {actionDueLabel(a.dueDate, today)}
                  </b>
                </p>
                <footer>
                  <span>
                    <i /> {a.status}
                  </span>
                  <code>{a.findingId ?? "Standalone"}</code>
                  {a.evidenceRequired && !a.evidence.length && (
                    <em>Evidence missing</em>
                  )}
                </footer>
              </article>
            ))}
          </section>
        ))}
        {!shown.length && (
          <div className="action-empty">
            <b>
              {view === "My Actions"
                ? "You're all caught up"
                : view === "Awaiting Verification"
                  ? "No actions awaiting verification"
                  : "No corrective actions found"}
            </b>
            <span>
              {view === "My Actions"
                ? "You don't have any open corrective actions assigned to you."
                : "Try adjusting the current filters."}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
function ActionFilters({
  actions,
  filters,
  setFilters,
  onClose,
}: {
  actions: CorrectiveAction[];
  filters: ActionFilterValues;
  setFilters: React.Dispatch<React.SetStateAction<ActionFilterValues>>;
  onClose: () => void;
}) {
  const field = (
    key: keyof ActionFilterValues,
    label: string,
    values: string[],
  ) => (
    <label>
      <span>{label}</span>
      <select
        value={filters[key]}
        onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
      >
        <option value="">All</option>
        {Array.from(new Set(values.filter(Boolean))).map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="action-filter-panel">
      <header>
        <b>Filter Actions</b>
        <span>{Object.values(filters).filter(Boolean).length} active</span>
      </header>
      {field(
        "status",
        "Status",
        actions.map((a) => a.status),
      )}
      {field(
        "priority",
        "Priority",
        actions.map((a) => a.priority),
      )}
      {field(
        "owner",
        "Owner",
        actions.map((a) => a.owner),
      )}
      {field(
        "location",
        "Location",
        actions.map((a) => a.location),
      )}
      {field(
        "department",
        "Department",
        actions.map((a) => a.department ?? ""),
      )}
      {field(
        "audit",
        "Audit",
        actions.map((a) => a.auditId ?? ""),
      )}
      {field(
        "finding",
        "Finding",
        actions.map((a) => a.findingId ?? ""),
      )}
      {field(
        "type",
        "Action Type",
        actions.map((a) => a.type),
      )}
      {field("due", "Due Date", ["Overdue", "Upcoming"])}
      <footer>
        <button
          onClick={() =>
            setFilters({
              status: "",
              priority: "",
              owner: "",
              location: "",
              department: "",
              audit: "",
              finding: "",
              type: "",
              due: "",
            })
          }
        >
          Reset
        </button>
        <button onClick={onClose}>Apply</button>
      </footer>
    </div>
  );
}
function countView(
  items: CorrectiveAction[],
  view: ActionView,
  user: string,
  today: string,
) {
  if (view === "My Actions")
    return items.filter(
      (a) => a.owner === user && activeActionStatuses.includes(a.status),
    ).length;
  if (view === "Due Soon")
    return items.filter(
      (a) =>
        a.dueDate >= today &&
        a.dueDate <= "2026-09-15" &&
        activeActionStatuses.includes(a.status),
    ).length;
  if (view === "Overdue")
    return items.filter(
      (a) => a.dueDate < today && activeActionStatuses.includes(a.status),
    ).length;
  if (view === "Awaiting Verification")
    return items.filter((a) => a.status === "Awaiting Verification").length;
  if (view === "Returned")
    return items.filter((a) => a.status === "Returned").length;
  if (view === "Completed")
    return items.filter((a) => a.status === "Completed").length;
  return items.length;
}
function sortActions(
  a: CorrectiveAction,
  b: CorrectiveAction,
  sort: string,
  today: string,
) {
  if (sort === "Overdue First")
    return (
      Number(!(a.dueDate < today)) - Number(!(b.dueDate < today)) ||
      a.dueDate.localeCompare(b.dueDate)
    );
  if (sort === "Newest") return b.createdAt.localeCompare(a.createdAt);
  if (sort === "Oldest") return a.createdAt.localeCompare(b.createdAt);
  if (sort === "Priority")
    return (
      ["Critical", "High", "Medium", "Low"].indexOf(a.priority) -
      ["Critical", "High", "Medium", "Low"].indexOf(b.priority)
    );
  if (sort === "Recently Updated")
    return b.updatedAt.localeCompare(a.updatedAt);
  return a.dueDate.localeCompare(b.dueDate);
}
function groupValue(a: CorrectiveAction, group: string) {
  if (group === "Status") return a.status;
  if (group === "Owner") return a.owner;
  if (group === "Due Date")
    return a.dueDate < getTodayISO()
      ? "Overdue"
      : a.dueDate === getTodayISO()
        ? "Due Today"
        : "Upcoming";
  if (group === "Priority") return a.priority;
  if (group === "Finding") return a.findingId ?? "Standalone";
  return "";
}
