"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  Ellipsis,
  FilePlus2,
  Info as InfoIcon,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PriorityIndicator, StatusIndicator } from "@/components/status";
import {
  auditActivity,
  auditDocuments,
  checklistSections,
  type AuditDocument,
} from "@/data/audit-workspace";
import { auditPrograms } from "@/data/programs";
import type { Audit } from "@/data/audits";
import { updateAudit, useQmsAudits, useQmsPrograms } from "@/lib/qms-store";
import { loadExecution } from "@/lib/execution-store";
import type { AuditExecutionState } from "@/data/execution";
import { useFindings } from "@/lib/finding-store";
import { useActions } from "@/lib/action-store";
import { useBestPractices } from "@/lib/best-practice-store";
import { businessLineName } from "@/data/organization";
import { recurrenceLabels } from "@/data/recurrences";
import { AuditReviewWorkspace } from "./audit-review";
import { useTemplates } from "@/lib/template-store";
import { responseLabels } from "@/data/execution";
import {
  CreateAuditDrawer,
  ManageTeamDrawer,
  SimpleDrawer,
  initials,
  type AuditDraft,
} from "./audit-drawer";

type Tab =
  | "overview"
  | "preparation"
  | "checklist"
  | "findings"
  | "actions"
  | "activity";
const labels: Record<Tab, string> = {
  overview: "Overview",
  preparation: "Preparation",
  checklist: "Checklist",
  findings: "Findings",
  actions: "Actions",
  activity: "Activity",
};
function useExecutionSnapshot(auditId: string) {
  const [execution, setExecution] = useState<AuditExecutionState>();
  useEffect(() => setExecution(loadExecution(auditId)), [auditId]);
  return execution;
}
export function AuditWorkspace({ id }: { id: string }) {
  const audits = useQmsAudits();
  const programs = useQmsPrograms();
  const router = useRouter();
  const audit = audits.find((a) => a.id === id);
  const [tab, setTab] = useState<Tab>("overview");
  const [edit, setEdit] = useState(false);
  const [team, setTeam] = useState(false);
  const [scope, setScope] = useState(false);
  const [preview, setPreview] = useState(false);
  const [start, setStart] = useState(false);
  const [more, setMore] = useState(false);
  const [context, setContext] = useState(false);
  const [toast, setToast] = useState("");
  const [reviewView, setReviewView] = useState(false);
  const [cancelConfirm,setCancelConfirm]=useState(false);
  const [docs, setDocs] = useState(auditDocuments);
  if (!audit)
    return (
      <AppShell>
        <div className="page module-empty">
          <h3>Loading audit workspace…</h3>
          <p>The requested audit record is being loaded.</p>
        </div>
      </AppShell>
    );
  if (reviewView)
    return <AppShell><div className="page"><AuditReviewWorkspace audit={audit} onBack={() => setReviewView(false)} /></div></AppShell>;
  const program = programs.find(
    (p) => p.id === audit.programId || p.auditIds.includes(audit.id),
  );
  const readiness = readinessFor(audit);
  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  }
  function save(changes: Partial<Audit>, message = "Audit updated.") {
    updateAudit(id, changes);
    notify(message);
  }
  function saveEdit(f: AuditDraft) {
    save(
      {
        title: f.title,
        type: f.type,
        programId: f.programId || undefined,
        framework: f.framework,
        description: f.description,
        location: f.location,
        businessLineId: f.businessLineId || undefined,
        department: f.department,
        process: f.process || undefined,
        auditee: f.auditee,
        supplier: f.supplier,
        objective: f.objective,
        scope: f.scope,
        criteria: f.criteria,
        reference: f.reference,
        lead: f.lead,
        team: f.team,
        template: f.template,
        templateId: f.templateId || undefined,
        templateVersionId: f.templateVersionId || undefined,
        startTime: f.startTime,
        endTime: f.endTime,
        recurrenceFrequency: f.frequency,
      },
      "Audit changes saved.",
    );
    setEdit(false);
  }
  return (
    <AppShell>
      <div className="page audit-workspace-page">
        <div className="audit-workspace-header">
          <div>
            <div className="detail-breadcrumb">
              <Link href="/audits">Audits</Link>
              <span>/</span>
              <b>{audit.id}</b>
            </div>
            <p className="eyebrow">{audit.type.toUpperCase()}</p>
            <h1>{audit.title}</h1>
            <div className="audit-header-meta">
              <code>{audit.id}</code>
              <span>
                {audit.location} · {businessLineName(audit.businessLineId)} ·{" "}
                {audit.department}
              </span>
              <span>
                {audit.dateRange}, {audit.year}
              </span>
              <StatusIndicator status={audit.status} />
            </div>
          </div>
          <div className="detail-actions">
            <button className="button-secondary" onClick={() => setEdit(true)}>
              Edit
            </button>
            <button
              className="button-secondary"
              onClick={() => setContext(true)}
            >
              <InfoIcon size={15} />
              Info
            </button>
            <div className="more-wrap">
              <button className="icon-outline" onClick={() => setMore(!more)}>
                <Ellipsis size={17} />
              </button>
              {more && (
                <div className="row-menu header-menu">
                  <button onClick={() => setEdit(true)}>Duplicate Audit</button>
                  <button onClick={() => setEdit(true)}>Reschedule</button>
                  <button>Change Program</button>
                  <button
                    onClick={() => {setMore(false);setCancelConfirm(true)}}
                  >
                    Cancel Audit
                  </button>
                  <button>Archive</button>
                </div>
              )}
            </div>
            {tab !== "checklist" && (
              <button
                className="button-primary"
                onClick={() =>
                  audit.status === "Review & Report" || audit.status === "Awaiting Closure" ||
                  audit.status === "Completed"
                    ? setReviewView(true)
                    : setStart(true)
                }
              >
                {audit.status === "Review & Report" || audit.status === "Awaiting Closure"
                  ? "Review & Report"
                  : audit.status === "Completed"
                    ? "View Review"
                  : audit.status === "In Progress"
                    ? "Continue Audit"
                    : "Start Audit"}
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
        <nav className="audit-tabs">
          {(Object.keys(labels) as Tab[]).map((key) => (
            <button
              className={tab === key ? "active" : ""}
              key={key}
              onClick={() => setTab(key)}
            >
              {labels[key]}
            </button>
          ))}
        </nav>
        <div
          className={`audit-workspace-grid ${context ? "with-context" : ""}`}
        >
          <main className="audit-main">
            {tab === "overview" && (
              <Overview audit={audit} program={program} readiness={readiness} />
            )}{" "}
            {tab === "preparation" && (
              <PreparationTab
                audit={audit}
                onManageTeam={() => setTeam(true)}
                onEditScope={() => setScope(true)}
                docs={docs}
                setDocs={setDocs}
                notify={notify}
              />
            )}{" "}
            {tab === "checklist" && (
              <ChecklistTab
                audit={audit}
                onPreview={() => setPreview(true)}
                onStart={() =>
                  audit.status === "Review & Report" || audit.status === "Awaiting Closure" ||
                  audit.status === "Completed"
                    ? setTab("overview")
                    : setStart(true)
                }
              />
            )}{" "}
            {tab === "findings" && <FindingsTab auditId={audit.id} />}{" "}
            {tab === "actions" && <ActionsTab auditId={audit.id} />}{" "}
            {tab === "activity" && <ActivityTab auditId={audit.id} />}
          </main>
          {context && (
            <div className="audit-context-drawer">
              <button
                className="context-close"
                onClick={() => setContext(false)}
              >
                <X size={16} /> Close
              </button>
              <AuditContext
                audit={audit}
                program={program}
                readiness={readiness}
              />
            </div>
          )}
        </div>
        {edit && (
          <CreateAuditDrawer
            variant="edit"
            initial={draftFromAudit(audit)}
            onClose={() => setEdit(false)}
            onSave={saveEdit}
          />
        )}{" "}
        {team && (
          <ManageTeamDrawer
            audit={audit}
            onClose={() => setTeam(false)}
            onSave={(lead, members, auditee) => {
              save({ lead, team: members, auditee }, "Audit team updated.");
              setTeam(false);
            }}
          />
        )}
        {scope && (
          <ScopeDrawer
            audit={audit}
            onClose={() => setScope(false)}
            onSave={(changes) => {
              save(changes, "Scope and criteria updated.");
              setScope(false);
            }}
          />
        )}
        {preview && <ChecklistPreview audit={audit} onClose={() => setPreview(false)} />}{" "}
        {start && (
          <StartPanel
            audit={audit}
            readiness={readiness}
            onClose={() => setStart(false)}
            onManage={() => {
              setStart(false);
              setTeam(true);
            }}
            onStart={() => {
              save({ status: "In Progress" }, "Audit started.");
              router.push(`/audits/${audit.id}/execute`);
            }}
          />
        )}
        {toast && <div className="qms-toast">{toast}</div>}
        {cancelConfirm&&<div className="execution-confirm-overlay"><section className="completion-confirm"><h2>Cancel Audit?</h2><p>This changes the audit to Cancelled. Existing records will remain available.</p><footer><button className="button-secondary" onClick={()=>setCancelConfirm(false)}>Keep Audit</button><button className="button-primary" onClick={()=>{save({status:"Cancelled"},"Audit cancelled.");setCancelConfirm(false)}}>Cancel Audit</button></footer></section></div>}
      </div>
    </AppShell>
  );
}

type ReadinessItem = { label: string; complete: boolean };
function readinessFor(a: Audit): ReadinessItem[] {
  return [
    { label: "Schedule defined", complete: !!a.plannedDate },
    { label: "Lead auditor assigned", complete: !!a.lead },
    { label: "Audit team assigned", complete: !!a.team?.length },
    { label: "Scope defined", complete: !!a.scope },
    { label: "Objective defined", complete: !!a.objective },
    { label: "Checklist assigned", complete: !!a.template },
  ];
}
function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="workspace-section">
      <header>
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
function Overview({
  audit,
  program,
  readiness,
}: {
  audit: Audit;
  program?: (typeof auditPrograms)[number];
  readiness: ReadinessItem[];
}) {
  const complete = readiness.filter((r) => r.complete).length;
  const execution = useExecutionSnapshot(audit.id);
  const findings = useFindings().filter((finding) => finding.auditId === audit.id);
  const actions = useActions().filter((action) => action.auditId === audit.id);
  const bestPractices = useBestPractices().filter(
    (practice) => practice.auditId === audit.id,
  );
  const answered = execution
    ? Object.values(execution.responses).filter((r) => r.response).length
    : 0;
  const lifecycle = [
    "Draft",
    "Scheduled",
    "In Progress",
    "Review & Report",
    "Completed",
  ];
  const lifecycleIndex =
    audit.status === "Draft"
      ? 0
      : audit.status === "Planned" || audit.status === "Ready"
        ? 1
        : audit.status === "In Progress"
          ? 2
          : audit.status === "Review & Report" || audit.status === "Awaiting Closure"
            ? 3
            : audit.status === "Completed"
              ? 4
              : 1;
  return (
    <>
      <section className="audit-lifecycle" aria-label="Audit lifecycle">
        {lifecycle.map((step, index) => (
          <div
            className={`${index < lifecycleIndex ? "complete" : ""} ${index === lifecycleIndex ? "current" : ""}`}
            key={step}
          >
            <i>{index < lifecycleIndex ? <Check size={11} /> : index + 1}</i>
            <span>{step}</span>
          </div>
        ))}
      </section>
      {(audit.status === "Review & Report" || audit.status === "Awaiting Closure") && (
        <section className="review-report-summary">
          <div>
            <span>Checklist</span>
            <b>{execution?.completed ? "Complete" : "In progress"}</b>
          </div>
          <div>
            <span>Score</span>
            <b>{audit.score === undefined ? "—" : `${audit.score}%`}</b>
          </div>
          <div>
            <span>Findings</span>
            <b>{findings.length}</b>
          </div>
          <div>
            <span>Best Practices</span>
            <b>{bestPractices.length}</b>
          </div>
          <div>
            <span>Corrective Actions</span>
            <b>{actions.length}</b>
          </div>
          <div>
            <span>Open Findings</span>
            <b>{findings.filter((finding) => finding.status !== "Closed").length}</b>
          </div>
        </section>
      )}
      <Section title="Audit Summary">
        <Info label="Objective" value={audit.objective ?? "Not yet defined"} />
        <Info label="Scope" value={audit.scope ?? "Not yet defined"} />
        <Info
          label="Criteria"
          value={audit.criteria ?? audit.framework ?? "Not yet defined"}
        />
        <Info
          label="Checklist"
          value={
            execution?.completed
              ? "Complete"
              : execution
                ? `${answered} of 42 answered`
                : "Not started"
          }
        />
      </Section>
      <Section title="Audit Readiness">
        <div className="readiness-intro">
          <b>
            {complete} of {readiness.length} preparation items complete
          </b>
          <span>{complete === readiness.length ? "READY" : "INCOMPLETE"}</span>
        </div>
        <div className="readiness-progress">
          <i style={{ width: `${(complete / readiness.length) * 100}%` }} />
        </div>
        <div className="readiness-list">
          {readiness.map((r) => (
            <div key={r.label} className={r.complete ? "complete" : ""}>
              <i>{r.complete ? <Check size={12} /> : null}</i>
              <span>{r.label}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Program">
        {program ? (
          <Link
            href={`/audit-program/${program.id}`}
            className="program-reference"
          >
            <span>
              <b>{program.name}</b>
              <small>{program.id}</small>
            </span>
            Open Program <ChevronRight size={14} />
          </Link>
        ) : (
          <p className="empty-copy">
            This audit is not associated with an audit program.
          </p>
        )}
      </Section>
      <Section
        title="Best Practices"
        action={<span className="section-count">{bestPractices.length} recorded</span>}
      >
        {bestPractices.length ? (
          <div className="audit-best-practices">
            {bestPractices.map((practice) => (
              <article key={practice.id}>
                <span>
                  <code>{practice.id}</code>
                  <b>{practice.title}</b>
                  <small>
                    Clause {practice.clause ?? "—"} · {practice.recommendedFor ?? "Local Practice"}
                  </small>
                </span>
                <ChevronRight size={14} />
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-copy">No best practices recorded for this audit.</p>
        )}
      </Section>
    </>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="workspace-info">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}
function AuditContext({
  audit,
  program,
  readiness,
}: {
  audit: Audit;
  program?: (typeof auditPrograms)[number];
  readiness: ReadinessItem[];
}) {
  const complete = readiness.filter((r) => r.complete).length;
  const findings = useFindings();
  return (
    <aside className="audit-context">
      <h3>Audit Context</h3>
      <Context label="Status">
        <StatusIndicator status={audit.status} />
      </Context>
      <Context label="Program" value={program?.name ?? "Not assigned"} />
      <Context label="Audit Type" value={audit.type} />
      <Context label="Location" value={audit.location} />
      <Context
        label="Business Line"
        value={businessLineName(audit.businessLineId)}
      />
      <Context label="Department" value={audit.department} />
      <Context label="Process" value={audit.process ?? "Not specified"} />
      <Context
        label="Frequency"
        value={recurrenceLabels[audit.recurrenceFrequency ?? "one_time"]}
      />
      <Context label="Lead Auditor" value={audit.lead || "Not assigned"} />
      <Context label="Schedule" value={audit.dateRange} />
      <Context
        label="Duration"
        value={audit.dateRange.includes("–") ? "3 days" : "1 day"}
      />
      <Context label="Template" value={audit.template ?? "Not selected"} />
      <Context label="Questions" value={audit.template ? "42" : "—"} />
      <Context
        label="Findings"
        value={String(findings.filter((f) => f.auditId === audit.id).length)}
      />
      <Context
        label="Actions"
        value={String(
          findings
            .filter((f) => f.auditId === audit.id)
            .flatMap((f) => f.actions).length,
        )}
      />
      <Context
        label="Readiness"
        value={`${complete} / ${readiness.length} complete`}
      />
      <Context label="Last Updated" value="Sep 08 · 10:42 AM" />
    </aside>
  );
}
function Context({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="audit-context-row">
      <span>{label}</span>
      {children ?? <b>{value}</b>}
    </div>
  );
}
function PreparationTab({
  audit,
  onManageTeam,
  onEditScope,
  docs,
  setDocs,
  notify,
}: {
  audit: Audit;
  onManageTeam: () => void;
  onEditScope: () => void;
  docs: AuditDocument[];
  setDocs: (v: AuditDocument[]) => void;
  notify: (message: string) => void;
}) {
  return (
    <div className="preparation-sections">
      <Section title="Schedule">
        <div className="preparation-schedule">
          <Info
            label="Planned dates"
            value={`${audit.dateRange}, ${audit.year}`}
          />
          <Info
            label="Working hours"
            value={`${audit.startTime ?? "09:00"} – ${audit.endTime ?? "17:00"}`}
          />
          <Info label="Location" value={audit.location} />
          <Info
            label="Business Line"
            value={businessLineName(audit.businessLineId)}
          />
          <Info label="Department / function" value={audit.department} />
          <Info label="Process" value={audit.process ?? "Not specified"} />
        </div>
      </Section>
      <TeamTab audit={audit} onManage={onManageTeam} />
      <ScopeTab audit={audit} onEdit={onEditScope} />
      <DocumentsTab
        auditId={audit.id}
        docs={docs}
        setDocs={setDocs}
        notify={notify}
      />
    </div>
  );
}
function TeamTab({ audit, onManage }: { audit: Audit; onManage: () => void }) {
  return (
    <Section
      title="Audit Team"
      action={
        <button className="button-secondary" onClick={onManage}>
          Manage Team
        </button>
      }
    >
      <h3 className="subsection-label">Lead Auditor</h3>
      <Person name={audit.lead || "Not assigned"} role="Lead Auditor" />
      <h3 className="subsection-label">Audit Team</h3>
      {audit.team?.length ? (
        audit.team.map((p, i) => (
          <Person key={p} name={p} role={i ? "Technical Auditor" : "Auditor"} />
        ))
      ) : (
        <p className="empty-copy">No audit team members assigned.</p>
      )}
      <h3 className="subsection-label">Auditee / Process Owner</h3>
      <Person name={audit.auditee ?? "Not assigned"} role="Quality Manager" />
    </Section>
  );
}
function Person({ name, role }: { name: string; role: string }) {
  return (
    <div className="person-row">
      <span className="person-avatar">{initials(name)}</span>
      <span>
        <b>{name}</b>
        <small>{role}</small>
      </span>
    </div>
  );
}
function ScopeTab({ audit, onEdit }: { audit: Audit; onEdit: () => void }) {
  return (
    <Section
      title="Scope & Criteria"
      action={
        <button className="button-secondary" onClick={onEdit}>
          Edit Scope &amp; Criteria
        </button>
      }
    >
      <Info label="Objective" value={audit.objective ?? "Not defined"} />
      <Info label="Scope" value={audit.scope ?? "Not defined"} />
      <Info label="Criteria" value={audit.criteria ?? "Not defined"} />
      <Info
        label="References"
        value={
          audit.reference ??
          "Quality Manual QM-001 · Internal Procedure QP-014 · Previous Audit AUD-2025-019"
        }
      />
    </Section>
  );
}
function ChecklistTab({
  audit,
  onPreview,
  onStart,
}: {
  audit: Audit;
  onPreview: () => void;
  onStart: () => void;
}) {
  return (
    <Section
      title="Checklist Preparation"
      action={
        <div className="inline-actions">
          <button className="button-secondary" onClick={onPreview}>
            Preview Checklist
          </button>
          <button className="button-secondary">Change Template</button>
          <button className="button-primary" onClick={onStart}>
            {audit.status === "Review & Report" || audit.status === "Awaiting Closure"
              ? "Review & Report"
              : audit.status === "Completed"
                ? "View Audit Summary"
              : audit.status === "In Progress"
                ? "Continue Audit"
                : "Start Audit"}
          </button>
        </div>
      }
    >
      <div className="checklist-heading">
        <div>
          <b>{audit.template ?? "No checklist selected"}</b>
          <span>42 Questions · 7 Sections</span>
        </div>
        <small>Last updated Aug 21, 2026</small>
      </div>
      <div className="checklist-sections">
        {checklistSections.map(([name, count]) => (
          <div key={name}>
            <b>{name}</b>
            <span>{count} questions</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
function FindingsTab({ auditId }: { auditId: string }) {
  const findings = useFindings();
  const rows = findings
    .filter((f) => f.auditId === auditId)
    .map((f) => [
      <Link href={`/findings/${f.id}`} key={f.id}>
        <b>{f.title}</b>
        <small>{f.id}</small>
      </Link>,
      f.clause ?? "—",
      f.type === "Nonconformity" ? `${f.severity} NC` : f.type,
      f.owner,
      f.dueDate,
      f.status,
    ]);
  return (
    <Section title="Related Findings">
      <DataTable
        headers={["Finding", "Clause", "Severity", "Owner", "Due", "Status"]}
        rows={rows}
      />
    </Section>
  );
}
function ActionsTab({ auditId }: { auditId: string }) {
  const actions = useActions();
  const rows = actions.filter((a) => a.auditId === auditId);
  return (
    <Section title="Corrective Actions">
      <DataTable
        headers={["Action", "Finding", "Owner", "Due", "Priority", "Status"]}
        rows={rows.map((a) => [
          <Link href={`/actions/${a.id}`} key={a.id}>
            <b>{a.title}</b>
            <small>{a.id}</small>
          </Link>,
          a.findingId ?? "—",
          a.owner,
          a.dueDate,
          <PriorityIndicator
            key="p"
            priority={a.priority === "Critical" ? "High" : a.priority}
          />,
          a.status,
        ])}
      />
    </Section>
  );
}
function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="workspace-table">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty-copy">No related records.</p>}
    </div>
  );
}
function DocumentsTab({
  auditId,
  docs,
  setDocs,
  notify,
}: {
  auditId: string;
  docs: AuditDocument[];
  setDocs: (v: AuditDocument[]) => void;
  notify: (m: string) => void;
}) {
  const rows = docs.filter((d) => d.auditId === auditId);
  function add() {
    const doc = {
      id: `DOC-${docs.length + 1}`,
      auditId,
      name: "New Reference Document.pdf",
      category: "Reference Document",
      uploadedBy: "Rumesh Ravi",
      date: "Just now",
      size: "624 KB",
    };
    setDocs([...docs, doc]);
    notify("Document added to audit.");
  }
  return (
    <Section
      title="Documents"
      action={
        <button className="button-primary" onClick={add}>
          <FilePlus2 size={14} />
          Add Document
        </button>
      }
    >
      <DataTable
        headers={["Document", "Category", "Uploaded By", "Date", "Size", ""]}
        rows={rows.map((d) => [
          <span key={d.id}>
            <b>{d.name}</b>
            <small>{d.id}</small>
          </span>,
          d.category,
          d.uploadedBy,
          d.date,
          d.size,
          <button className="row-icon" key="more">
            <Ellipsis size={15} />
          </button>,
        ])}
      />
    </Section>
  );
}
function ActivityTab({ auditId }: { auditId: string }) {
  const execution = useExecutionSnapshot(auditId);
  const live = execution?.activity ?? [];
  return (
    <Section title="Audit Activity">
      <div className="audit-timeline">
        {live.map((x) => (
          <article key={x.id}>
            <time>{x.date}</time>
            <i />
            <p>
              <b>{x.actor}</b> {x.action}
            </p>
          </article>
        ))}
        {auditActivity
          .filter(
            (a) =>
              a.auditId === auditId && !live.some((x) => x.action === a.action),
          )
          .map((x) => (
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
    </Section>
  );
}
function ScopeDrawer({
  audit,
  onClose,
  onSave,
}: {
  audit: Audit;
  onClose: () => void;
  onSave: (c: Partial<Audit>) => void;
}) {
  const [objective, setObjective] = useState(audit.objective ?? "");
  const [scope, setScope] = useState(audit.scope ?? "");
  const [criteria, setCriteria] = useState(audit.criteria ?? "");
  const [reference, setReference] = useState(audit.reference ?? "");
  return (
    <SimpleDrawer
      title="Edit Scope & Criteria"
      description="Update the audit purpose and applicable requirements."
      onClose={onClose}
      footer={
        <>
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button-primary"
            onClick={() => onSave({ objective, scope, criteria, reference })}
          >
            Save Changes
          </button>
        </>
      }
    >
      <div className="drawer-form">
        <section className="form-section">
          <label className="field">
            <span>Objective</span>
            <textarea
              rows={4}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Scope</span>
            <textarea
              rows={4}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Criteria</span>
            <input
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
            />
          </label>
          <label className="field">
            <span>References</span>
            <textarea
              rows={3}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </label>
        </section>
      </div>
    </SimpleDrawer>
  );
}
function ChecklistPreview({ audit, onClose }: { audit: Audit; onClose: () => void }) {
  const templates=useTemplates();
  const template=templates.find(item=>item.id===audit.templateId);
  const version=template?.versions.find(item=>item.id===audit.templateVersionId);
  return (
    <SimpleDrawer
      className="checklist-preview"
      title="Checklist Preview"
      description={version?`${template?.name} · Version ${version.version} · ${template?.standard}`:"The exact assigned template version is unavailable."}
      onClose={onClose}
      footer={
        <button className="button-primary" onClick={onClose}>
          Close Preview
        </button>
      }
    >
      <div className="preview-list">
        {version?.sections.slice().sort((a,b)=>a.order-b.order).map(section => {
          const questions=version.questions.filter(q=>q.sectionId===section.id).sort((a,b)=>a.order-b.order);
          return <section key={section.id}><h3>{section.number}. {section.title} <small>{questions.length} questions</small></h3>{questions.map(q=><article key={q.id}><b>{q.code} · Clause {q.clause} · {q.shortTitle}</b><p>{q.question}</p>{q.expectedEvidence&&<span>Expected evidence: {q.expectedEvidence.split("\n").join(" · ")}</span>}<small>Responses: {q.allowedResponses.map(value=>responseLabels[value]).join(" / ")}</small></article>)}</section>
        })}
      </div>
    </SimpleDrawer>
  );
}
function StartPanel({
  audit,
  readiness,
  onClose,
  onManage,
  onStart,
}: {
  audit: Audit;
  readiness: ReadinessItem[];
  onClose: () => void;
  onManage: () => void;
  onStart: () => void;
}) {
  const missing = readiness.filter((r) => !r.complete);
  return (
    <SimpleDrawer
      title={missing.length ? "Audit is not ready" : `Start ${audit.title}?`}
      description={
        missing.length
          ? `${missing.length} preparation item${missing.length === 1 ? "" : "s"} requires attention.`
          : `${audit.id} · 42 questions · 7 sections`
      }
      onClose={onClose}
      footer={
        missing.length ? (
          <>
            <button className="button-secondary" onClick={onClose}>
              Close
            </button>
            <button className="button-primary" onClick={onManage}>
              Manage Team
            </button>
          </>
        ) : (
          <>
            <button className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="button-primary" onClick={onStart}>
              Start Audit
            </button>
          </>
        )
      }
    >
      <div className="start-panel-body">
        {missing.length ? (
          <>
            <p>Resolve the mandatory preparation items before starting.</p>
            {missing.map((x) => (
              <div className="readiness-block" key={x.label}>
                <i />
                <span>{x.label}</span>
              </div>
            ))}
          </>
        ) : (
          <div className="start-confirm">
            <span className="start-mark">
              <Check size={20} />
            </span>
            <h3>Audit preparation is complete</h3>
            <p>
              Starting changes the audit status to In Progress and opens the
              execution workspace.
            </p>
          </div>
        )}
      </div>
    </SimpleDrawer>
  );
}
function draftFromAudit(a: Audit): Partial<AuditDraft> {
  const planned = new Date(a.plannedDate);
  const plannedValue = Number.isNaN(planned.getTime())
    ? `${a.year}-09-08`
    : `${planned.getFullYear()}-${String(planned.getMonth() + 1).padStart(2, "0")}-${String(planned.getDate()).padStart(2, "0")}`;
  return {
    title: a.title,
    type: a.type,
    programId: a.programId ?? "",
    framework: a.framework ?? "",
    description: a.description ?? "",
    location: a.location,
    businessLineId: a.businessLineId ?? "",
    department: a.department,
    process: a.process ?? "",
    auditee: a.auditee ?? "",
    supplier: a.supplier ?? "",
    objective: a.objective ?? "",
    scope: a.scope ?? "",
    criteria: a.criteria ?? "",
    reference: a.reference ?? "",
    start: plannedValue,
    end: plannedValue,
    startTime: a.startTime ?? "09:00",
    endTime: a.endTime ?? "17:00",
    frequency: a.recurrenceFrequency ?? "one_time",
    repeatEvery: 1,
    recurrenceEndMode: "occurrences",
    recurrenceEndDate: "",
    recurrenceOccurrences: 4,
    lead: a.lead,
    team: a.team ?? [],
    template: a.template ?? "",
    templateId: a.templateId ?? "",
    templateVersionId: a.templateVersionId ?? "",
  };
}
