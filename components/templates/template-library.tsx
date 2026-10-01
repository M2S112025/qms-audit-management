"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Ellipsis, Grid2X2, LayoutList, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getTodayISO } from "@/lib/date";
import { AppShell } from "@/components/app-shell";
import {
  currentVersion,
  standards,
  type AuditTemplate,
} from "@/data/templates";
import {
  nextTemplateId,
  saveTemplate,
  useTemplates,
} from "@/lib/template-store";
type View =
  | "All Templates"
  | "Published"
  | "Draft"
  | "Archived"
  | "My Templates";
export function TemplateLibrary() {
  const templates = useTemplates();
  const [view, setView] = useState<View>("All Templates");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [auditType, setAuditType] = useState("");
  const [standard, setStandard] = useState("");
  const [owner, setOwner] = useState("");
  const [sort, setSort] = useState("Recently Updated");
  const [grid, setGrid] = useState(false);
  const [creating, setCreating] = useState(false);
  const views: View[] = [
    "All Templates",
    "Published",
    "Draft",
    "Archived",
    "My Templates",
  ];
  const shown = useMemo(
    () =>
      templates
        .filter(
          (t) =>
            `${t.id} ${t.name} ${t.standard} ${t.auditType}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (view === "All Templates" ||
              (view === "My Templates" && t.owner === "Rumesh Ravi") ||
              t.status === view) &&
            (!status || t.status === status) &&
            (!auditType || t.auditType === auditType) &&
            (!standard || t.standard === standard) &&
            (!owner || t.owner === owner),
        )
        .sort((a, b) =>
          sort === "Name"
            ? a.name.localeCompare(b.name)
            : sort === "Most Used"
              ? currentVersion(b).usageCount - currentVersion(a).usageCount
              : sort === "Oldest"
                ? a.createdAt.localeCompare(b.createdAt)
                : sort === "Newest"
                  ? b.createdAt.localeCompare(a.createdAt)
                  : b.updatedAt.localeCompare(a.updatedAt),
        ),
    [templates, view, query, status, auditType, standard, owner, sort],
  );
  return (
    <AppShell>
      <div className="page template-library-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">CHECKLIST CONFIGURATION</p>
            <h1>Audit Templates</h1>
            <p>Create and manage standardized checklists used during audits.</p>
          </div>
          <button className="primary-button" onClick={() => setCreating(true)}>
            <Plus size={15} />
            New Template
          </button>
        </div>
        <nav className="template-views">
          {views.map((v) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              onClick={() => setView(v)}
            >
              {v}
              <b>{countView(templates, v)}</b>
            </button>
          ))}
        </nav>
        <div className="template-toolbar">
          <label>
            <Search size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates..."
            />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {["Published", "Draft", "Archived"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            value={auditType}
            onChange={(e) => setAuditType(e.target.value)}
          >
            <option value="">All audit types</option>
            {Array.from(new Set(templates.map((t) => t.auditType))).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
          >
            <option value="">All standards</option>
            {standards.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">All owners</option>
            {["Rumesh Ravi", "Lakshman"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {["Recently Updated", "Name", "Most Used", "Newest", "Oldest"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
          <div>
            <button
              className={!grid ? "active" : ""}
              onClick={() => setGrid(false)}
            >
              <LayoutList size={14} />
            </button>
            <button
              className={grid ? "active" : ""}
              onClick={() => setGrid(true)}
            >
              <Grid2X2 size={14} />
            </button>
          </div>
        </div>
        {grid ? (
          <TemplateGrid templates={shown} />
        ) : (
          <TemplateTable templates={shown} />
        )}{" "}
        {!shown.length && (
          <div className="template-empty">
            <h2>No audit templates yet</h2>
            <p>Create a reusable checklist for your audits.</p>
            <button onClick={() => setCreating(true)}>New Template</button>
          </div>
        )}
        {creating && (
          <CreateTemplateDrawer
            templates={templates}
            onClose={() => setCreating(false)}
          />
        )}
      </div>
    </AppShell>
  );
}
function TemplateTable({ templates }: { templates: AuditTemplate[] }) {
  return (
    <div className="template-table">
      <div className="template-table-head">
        <span>Template</span>
        <span>Standard</span>
        <span>Audit Type</span>
        <span>Sections</span>
        <span>Questions</span>
        <span>Version</span>
        <span>Status</span>
        <span>Used In</span>
        <span>Updated</span>
        <span>Owner</span>
        <span />
      </div>
      {templates.map((t) => {
        const v = currentVersion(t);
        return (
          <Link
            href={`/audit-templates/${t.id}`}
            key={t.id}
            className="template-row"
          >
            <span>
              <b>{t.name}</b>
              <small>{t.id}</small>
            </span>
            <span>{t.standard}</span>
            <span>{t.auditType}</span>
            <span>{v.sections.length}</span>
            <span>{v.questions.length}</span>
            <span>v{v.version}</span>
            <span
              className={`template-status status-${t.status.toLowerCase()}`}
            >
              <i />
              {t.status}
            </span>
            <span>{v.usageCount} audits</span>
            <span>{displayDate(t.updatedAt)}</span>
            <span>{t.owner}</span>
            <button onClick={(e) => e.preventDefault()}>
              <Ellipsis size={15} />
            </button>
          </Link>
        );
      })}
    </div>
  );
}
function TemplateGrid({ templates }: { templates: AuditTemplate[] }) {
  return (
    <div className="template-grid">
      {templates.map((t) => {
        const v = currentVersion(t);
        return (
          <Link href={`/audit-templates/${t.id}`} key={t.id}>
            <code>{t.id}</code>
            <h3>{t.name}</h3>
            <p>
              {t.standard} · {t.auditType}
            </p>
            <div>
              <span>{v.sections.length} sections</span>
              <span>{v.questions.length} questions</span>
              <span>v{v.version}</span>
            </div>
            <footer>
              <span
                className={`template-status status-${t.status.toLowerCase()}`}
              >
                <i />
                {t.status}
              </span>
              <b>{v.usageCount} audits</b>
            </footer>
          </Link>
        );
      })}
    </div>
  );
}
function CreateTemplateDrawer({
  templates,
  onClose,
}: {
  templates: AuditTemplate[];
  onClose: () => void;
}) {
  const router=useRouter();
  const [name, setName] = useState("");
  const [auditType, setAuditType] = useState("Internal Audit");
  const [standard, setStandard] = useState("ISO 9001:2015");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("Rumesh Ravi");
  const [starting, setStarting] = useState<"blank" | "duplicate">("blank");
  const [source, setSource] = useState("TMP-001");
  const [error, setError] = useState(false);
  function create() {
    if (!name) {
      setError(true);
      return;
    }
    const id = nextTemplateId(templates);
    const sourceTemplate =
      templates.find((t) => t.id === source) ?? templates[0];
    const sourceVersion = currentVersion(sourceTemplate);
    const versionId = `TV-${id}-1.0`;
    const version = {
      ...structuredClone(sourceVersion),
      id: versionId,
      templateId: id,
      version: "1.0",
      status: "Draft" as const,
      sections:
        starting === "duplicate"
          ? sourceVersion.sections.map((s) => ({
              ...structuredClone(s),
              versionId,
            }))
          : [],
      questions:
        starting === "duplicate"
          ? structuredClone(sourceVersion.questions)
          : [],
      createdAt: getTodayISO(),
      publishedAt: undefined,
      publishedBy: undefined,
      basedOnVersionId: starting === "duplicate" ? sourceVersion.id : undefined,
      usageCount: 0,
    };
    saveTemplate({
      id,
      code: id,
      name,
      description,
      auditType,
      standard,
      owner,
      reviewers: ["Lakshman"],
      status: "Draft",
      versions: [version],
      createdAt: getTodayISO(),
      updatedAt: getTodayISO(),
    });
    router.push(`/audit-templates/${id}/edit`);
  }
  return (
    <>
      <button className="drawer-scrim" onClick={onClose} />
      <aside className="qms-drawer template-create-drawer">
        <header>
          <div>
            <h2>New Template</h2>
            <p>Create a reusable audit checklist draft.</p>
          </div>
          <button onClick={onClose}>
            <X size={17} />
          </button>
        </header>
        <div className="drawer-body">
          <div className="drawer-form">
            <section className="form-section">
              <h3>Template Information</h3>
              <label className={`field ${error ? "field-error" : ""}`}>
                <span>Template Name *</span>
                <input value={name} onChange={(e) => setName(e.target.value)} />
                {error && <small>Template name is required.</small>}
              </label>
              <label className="field">
                <span>Template Code</span>
                <input value={nextTemplateId(templates)} disabled />
              </label>
              <label className="field">
                <span>Audit Type *</span>
                <select
                  value={auditType}
                  onChange={(e) => setAuditType(e.target.value)}
                >
                  {[
                    "Internal Audit",
                    "Process Audit",
                    "Supplier Audit",
                    "Compliance Audit",
                    "Customer Audit",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Standard / Framework</span>
                <select
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                >
                  {standards.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Description</span>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Owner *</span>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                >
                  <option>Rumesh Ravi</option>
                  <option>Lakshman</option>
                </select>
              </label>
            </section>
            <section className="form-section">
              <h3>Starting Point</h3>
              <label className="template-start">
                <input
                  type="radio"
                  checked={starting === "blank"}
                  onChange={() => setStarting("blank")}
                />
                Blank Template
              </label>
              <label className="template-start">
                <input
                  type="radio"
                  checked={starting === "duplicate"}
                  onChange={() => setStarting("duplicate")}
                />
                Duplicate Existing Template
              </label>
              {starting === "duplicate" && (
                <label className="field">
                  <span>Source Template *</span>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </section>
          </div>
        </div>
        <footer>
          <button onClick={onClose}>Cancel</button>
          <button className="button-primary" onClick={create}>
            Create Draft
          </button>
        </footer>
      </aside>
    </>
  );
}
function countView(items: AuditTemplate[], v: View) {
  if (v === "All Templates") return items.length;
  if (v === "My Templates")
    return items.filter((t) => t.owner === "Rumesh Ravi").length;
  return items.filter((t) => t.status === v).length;
}
function displayDate(v: string) {
  return new Date(`${v}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
