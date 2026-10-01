"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Ellipsis, List, Plus, Search } from "lucide-react";
import { locations, type Audit } from "@/data/audits";
import { type AuditProgram } from "@/data/programs";
import { savePrograms, useQmsAudits, useQmsPrograms } from "@/lib/qms-store";
import { AppShell } from "@/components/app-shell";
import { ProgramDrawer } from "./drawers";

function ProgramProgress({
  program,
  audits,
}: {
  program: AuditProgram;
  audits: Audit[];
}) {
  const linked = audits.filter((a) => program.auditIds.includes(a.id));
  const completed = linked.filter((a) => a.status === "Completed").length;
  const progress =
    program.status === "Completed"
      ? 100
      : linked.length
        ? Math.round((completed / linked.length) * 100)
        : 0;
  return (
    <div className="program-progress">
      <b>{progress}%</b>
      <span>
        <i style={{ width: `${progress}%` }} />
      </span>
    </div>
  );
}
function ProgramStatus({ status }: { status: AuditProgram["status"] }) {
  return (
    <span className={`program-status program-status-${status.toLowerCase()}`}>
      <i />
      {status}
    </span>
  );
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

export function ProgramListPage() {
  const programs = useQmsPrograms();
  const audits = useQmsAudits();
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("2026");
  const [status, setStatus] = useState("All");
  const [location, setLocation] = useState("All");
  const [menu, setMenu] = useState<string>();
  const [toast, setToast] = useState("");
  const filtered = useMemo(
    () =>
      programs.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) &&
          p.startDate.startsWith(year) &&
          (status === "All" || p.status === status) &&
          (location === "All" || p.locations.includes(location)),
      ),
    [programs, query, year, status, location],
  );
  function created(
    value: {
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
      frequency: AuditProgram["frequency"];
    },
    draft: boolean,
  ) {
    savePrograms([
      {
        id: value.code,
        name: value.name,
        description: value.description,
        status: draft ? "Draft" : "Active",
        startDate: value.start,
        endDate: value.end,
        period: formatPeriod(value.start, value.end),
        owner: value.owner,
        locations: value.locations,
        businessLineIds: value.businessLineIds,
        departments: value.departments.split(",").filter(Boolean),
        auditTypes: value.types.split(",").filter(Boolean),
        frequency: value.frequency,
        auditIds: [],
        lastUpdated: "Just now",
        created: "Sep 08, 2026",
      },
      ...programs,
    ]);
    setDrawer(false);
    setToast(
      draft
        ? "Audit program saved as draft."
        : "Audit program created successfully.",
    );
    setTimeout(() => setToast(""), 3000);
  }
  return (
    <AppShell>
      <div className="page program-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">AUDIT PLANNING</p>
            <h1>Audit Program</h1>
            <p>
              Plan, schedule and monitor audit activities across the
              organization.
            </p>
          </div>
          <button className="primary-button" onClick={() => setDrawer(true)}>
            <Plus size={16} />
            New Program
          </button>
        </div>
        <div className="command-toolbar">
          <label className="command-search">
            <Search size={15} />
            <input
              placeholder="Search programs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            <span>Year</span>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option>2027</option>
              <option>2026</option>
              <option>2025</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Completed</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </label>
          <label>
            <span>Location</span>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option>All</option>
              {locations.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <div className="view-toggle">
            <button className="selected">
              <List size={14} />
              List
            </button>
            <Link href="/audit-program/PRG-2026-001/calendar">
              <CalendarDays size={14} />
              Calendar
            </Link>
          </div>
        </div>
        <section className="program-table-wrap">
          <div className="program-table-head">
            <span>Program</span>
            <span>Period</span>
            <span>Owner</span>
            <span>Locations</span>
            <span>Audits</span>
            <span>Progress</span>
            <span>Status</span>
            <span>Last Updated</span>
            <span />
          </div>
          {filtered.length ? (
            filtered.map((p) => (
              <Link
                href={`/audit-program/${p.id}`}
                key={p.id}
                className="program-row"
              >
                <span className="program-name">
                  <b>{p.name}</b>
                  <small>{p.id}</small>
                </span>
                <span>{p.period}</span>
                <span>{p.owner}</span>
                <span>
                  {p.locations.length}{" "}
                  {p.locations.length === 1 ? "location" : "locations"}
                </span>
                <span>{p.auditIds.length} audits</span>
                <ProgramProgress program={p} audits={audits} />
                <ProgramStatus status={p.status} />
                <span>{p.lastUpdated}</span>
                <button
                  aria-label={`Actions for ${p.name}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setMenu(menu === p.id ? undefined : p.id);
                  }}
                >
                  <Ellipsis size={17} />
                  {menu === p.id && (
                    <span className="row-menu">
                      <b>Open program</b>
                      <b>Duplicate</b>
                      <b>Archive</b>
                    </span>
                  )}
                </button>
              </Link>
            ))
          ) : (
            <div className="module-empty">
              <h3>No programs found</h3>
              <p>No audit programs match the current filters.</p>
              <button
                className="button-primary"
                onClick={() => setDrawer(true)}
              >
                <Plus size={14} />
                New Program
              </button>
            </div>
          )}
        </section>
        {drawer && (
          <ProgramDrawer
            mode="create"
            onClose={() => setDrawer(false)}
            onSave={created}
          />
        )}{" "}
        {toast && <div className="qms-toast">{toast}</div>}
      </div>
    </AppShell>
  );
}
