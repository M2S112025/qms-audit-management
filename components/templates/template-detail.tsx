"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Ellipsis } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { currentVersion, type AuditTemplate } from "@/data/templates";
import {
  createDraftVersion,
  updateTemplate,
  useTemplates,
} from "@/lib/template-store";
import { useRouter } from "next/navigation";
type Tab = "Overview" | "Structure" | "Versions" | "Usage" | "Activity";
export function TemplateDetail({ id }: { id: string }) {
  const templates = useTemplates();
  const template = templates.find((t) => t.id === id);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");
  const [more, setMore] = useState(false);
  const [archiveConfirm,setArchiveConfirm]=useState(false);
  if (!template)
    return (
      <AppShell>
        <div className="page module-empty">Loading template…</div>
      </AppShell>
    );
  const version = currentVersion(template);
  function newVersion() {
    const existing = template!.versions.find((v) => v.status === "Draft");
    const draft = existing ?? createDraftVersion(template!);
    router.push(`/audit-templates/${template!.id}/edit?version=${draft.id}`);
  }
  function archive() {
    updateTemplate(template!.id, (t) => ({
      ...t,
      status: "Archived",
      archivedAt: "2026-09-08",
    }));
  }
  return (
    <AppShell>
      <div className="page template-detail-page">
        <div className="template-detail-header">
          <div>
            <div className="detail-breadcrumb">
              <Link href="/audit-templates">Audit Templates</Link>
              <span>/</span>
              <b>{template.id}</b>
            </div>
            <p className="eyebrow">{template.auditType.toUpperCase()}</p>
            <h1>{template.name}</h1>
            <div>
              <code>{template.id}</code>
              <span>v{version.version}</span>
              <span
                className={`template-status status-${template.status.toLowerCase()}`}
              >
                <i />
                {template.status}
              </span>
            </div>
          </div>
          <div className="detail-actions">
            <button
              onClick={() =>
                router.push(`/audit-templates/${template.id}/edit?preview=true`)
              }
            >
              Preview
            </button>
            <button className="button-primary" onClick={newVersion}>
              Create New Version
            </button>
            <div>
              <button onClick={() => setMore(!more)}>
                <Ellipsis size={16} />
              </button>
              {more && (
                <div className="row-menu">
                  <button onClick={newVersion}>Duplicate</button>
                  <button onClick={()=>{setMore(false);setArchiveConfirm(true)}}>Archive</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <nav className="template-detail-tabs">
          {(
            ["Overview", "Structure", "Versions", "Usage", "Activity"] as Tab[]
          ).map((x) => (
            <button
              className={tab === x ? "active" : ""}
              key={x}
              onClick={() => setTab(x)}
            >
              {x}
            </button>
          ))}
        </nav>
        <TemplateSummary template={template} />
        {(tab === "Overview" || tab === "Structure") && (
          <Overview template={template} />
        )}{" "}
        {tab === "Versions" && <Versions template={template} />}{" "}
        {tab === "Usage" && <Usage template={template} />}{" "}
        {tab === "Activity" && <Activity />}
        {archiveConfirm&&<div className="execution-confirm-overlay"><section className="completion-confirm"><h2>Archive Template?</h2><p>Existing audits will not be affected.</p><footer><button className="button-secondary" onClick={()=>setArchiveConfirm(false)}>Cancel</button><button className="button-primary" onClick={()=>{archive();setArchiveConfirm(false)}}>Archive Template</button></footer></section></div>}
      </div>
    </AppShell>
  );
}
function TemplateSummary({ template }: { template: AuditTemplate }) {
  const v = currentVersion(template);
  return (
    <div className="template-summary-strip">
      <Summary value={v.sections.length} label="Sections" />
      <Summary value={v.questions.length} label="Questions" />
      <Summary
        value={v.questions.reduce((n, q) => n + q.weight, 0)}
        label="Total Points"
      />
      <Summary value={v.usageCount} label="Audits" />
      <Summary value={`v${v.version}`} label="Current Version" />
    </div>
  );
}
function Overview({ template }: { template: AuditTemplate }) {
  const v = currentVersion(template);
  return (
    <div className="template-overview-grid">
      <section>
        <h2>Template Structure</h2>
        {v.sections.map((s) => (
          <div className="readonly-section" key={s.id}>
            <span>
              <b>
                {s.number}. {s.title}
              </b>
              <small>{s.questionIds.length} questions</small>
            </span>
            <strong>
              {v.questions
                .filter((q) => s.questionIds.includes(q.id))
                .reduce((n, q) => n + q.weight, 0)}{" "}
              points
            </strong>
            <ChevronRight size={14} />
          </div>
        ))}
        <footer>
          <b>{v.questions.length} questions</b>
          <b>{v.questions.reduce((n, q) => n + q.weight, 0)} points</b>
        </footer>
      </section>
      <aside>
        <h2>Template Information</h2>
        <Meta label="Status" value={template.status} />
        <Meta label="Version" value={v.version} />
        <Meta label="Standard" value={template.standard} />
        <Meta label="Audit Type" value={template.auditType} />
        <Meta label="Owner" value={template.owner} />
        <Meta label="Created" value="Jan 12, 2026" />
        <Meta label="Published" value={v.publishedAt ?? "Not published"} />
        <Meta label="Used In" value={`${v.usageCount} audits`} />
        <Meta label="Last Updated" value={template.updatedAt} />
      </aside>
    </div>
  );
}
function Versions({ template }: { template: AuditTemplate }) {
  return (
    <section className="template-version-list">
      <header>
        <h2>Version History</h2>
        <button>Compare Versions</button>
      </header>
      {template.versions.map((v, i) => (
        <article key={v.id}>
          <b>v{v.version}</b>
          <span className={`template-status status-${v.status.toLowerCase()}`}>
            <i />
            {v.status}
            {v.id === template.currentVersionId ? " · Current" : ""}
          </span>
          <span>Created {v.createdAt}</span>
          <span>{v.createdBy}</span>
          <span>{v.usageCount} audits</span>
          <div>
            <Link href={`/audit-templates/${template.id}/edit?version=${v.id}`}>
              View
            </Link>
            {i === 0 && v.status === "Draft" && (
              <Link
                href={`/audit-templates/${template.id}/edit?version=${v.id}`}
              >
                Edit
              </Link>
            )}
            <button>Compare</button>
          </div>
        </article>
      ))}
      <div className="version-comparison">
        <h3>v3.2 → v3.3 Comparison</h3>
        <div>
          <b>2</b>
          <span>questions added</span>
          <b>1</b>
          <span>question removed</span>
          <b>4</b>
          <span>questions modified</span>
          <b>1</b>
          <span>scoring rule changed</span>
        </div>
        <h4>Modified</h4>
        <p>
          <b>6.3 Planning of Changes</b> · Question wording changed
        </p>
        <p>
          <b>8.4 External Providers</b> · Evidence requirement changed
        </p>
      </div>
    </section>
  );
}
function Usage({ template }: { template: AuditTemplate }) {
  return (
    <section className="template-usage">
      <h2>Template Usage</h2>
      <div className="usage-head">
        <span>Audit</span>
        <span>Program</span>
        <span>Location</span>
        <span>Lead Auditor</span>
        <span>Date</span>
        <span>Status</span>
        <span>Template Version</span>
      </div>
      <Link href="/audits/AUD-2026-026">
        <span>
          <b>Internal QMS Audit</b>
          <small>AUD-2026-026</small>
        </span>
        <span>2026 Internal Audit Program</span>
        <span>Chennai Plant</span>
        <span>Lakshman</span>
        <span>Sep 08–10</span>
        <span>Review &amp; Report</span>
        <b>v3.2</b>
      </Link>
      {Array.from(
        { length: Math.min(5, currentVersion(template).usageCount - 1) },
        (_, i) => (
          <div key={i}>
            <span>
              <b>Internal Audit {i + 2}</b>
              <small>AUD-2026-0{20 + i}</small>
            </span>
            <span>2026 Internal Audit Program</span>
            <span>{i % 2 ? "Hosur" : "Pune"} Plant</span>
            <span>Rumesh Ravi</span>
            <span>Aug {12 + i}</span>
            <span>Completed</span>
            <b>v{currentVersion(template).version}</b>
          </div>
        ),
      )}
    </section>
  );
}
function Activity() {
  return (
    <section className="template-activity">
      <h2>Template Activity</h2>
      {[
        ["Sep 08 · 02:42 PM", "Rumesh Ravi", "created draft v3.3 from v3.2."],
        ["Aug 21 · 04:18 PM", "Rumesh Ravi", "published v3.2."],
        ["Aug 20 · 11:32 AM", "Question 8.4", "evidence requirement changed."],
      ].map(([date, actor, text]) => (
        <article key={date}>
          <time>{date}</time>
          <i />
          <p>
            <b>{actor}</b> {text}
          </p>
        </article>
      ))}
    </section>
  );
}
function Summary({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="template-meta">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
