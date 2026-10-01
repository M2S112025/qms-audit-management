"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, PanelLeft, PanelRight, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import type {
  AuditTemplate,
  TemplateQuestion,
  TemplateVersion,
} from "@/data/templates";
import {
  createDraftVersion,
  publishVersion,
  updateDraft,
  useTemplates,
} from "@/lib/template-store";
import { useOverlayFocus } from "@/lib/use-overlay-focus";
import {
  QuestionConfiguration,
  QuestionEditor,
  StructureNavigator,
} from "./builder-panels";
type Issue = {
  type: "error" | "warning";
  message: string;
  questionId?: string;
};
export function TemplateBuilder({ id }: { id: string }) {
  useOverlayFocus();
  const templates = useTemplates();
  const search = useSearchParams();
  const router = useRouter();
  const template = templates.find((t) => t.id === id);
  const requested = search.get("version");
  const stored =
    template?.versions.find((v) => v.id === requested) ??
    template?.versions.find((v) => v.status === "Draft") ??
    template?.versions.find((v) => v.id === template.currentVersionId);
  const [version, setVersion] = useState<TemplateVersion>();
  const [selected, setSelected] = useState("");
  const [saved, setSaved] = useState<
    "Saving..." | "Saved ✓" | "Unable to save locally"
  >("Saved ✓");
  const [configMode, setConfigMode] = useState<"configure" | "preview">(
    "configure",
  );
  const [structureOpen, setStructureOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [structureCollapsed, setStructureCollapsed] = useState(false);
  const [configCollapsed, setConfigCollapsed] = useState(false);
  const [validation, setValidation] = useState(false);
  const [preview, setPreview] = useState(false);
  const [publish, setPublish] = useState(false);
  const [librarySection, setLibrarySection] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (stored && stored.id !== version?.id) {
      setVersion(structuredClone(stored));
      setSelected(
        stored.questions.find((q) => q.clause === "6.3")?.id ??
          stored.questions[0]?.id ??
          "",
      );
    }
  }, [stored, version?.id]);
  useEffect(() => {
    if (search.get("preview") === "true") setPreview(true);
  }, [search]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const change = useCallback(
    (next: TemplateVersion) => {
      if (next.status === "Published" || next.status === "Superseded") return;
      setVersion(next);
      setSaved("Saving...");
      try {
        updateDraft(id, next.id, () => next);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setSaved("Saved ✓"), 550);
      } catch {
        setSaved("Unable to save locally");
      }
    },
    [id],
  );
  const question = version?.questions.find((q) => q.id === selected);
  const section = version?.sections.find((s) => s.id === question?.sectionId);
  const issues = version ? validate(version) : [];
  function changeQuestion(next: TemplateQuestion) {
    if (!version) return;
    change({
      ...version,
      questions: version.questions.map((q) => (q.id === next.id ? next : q)),
    });
  }
  function duplicate() {
    if (!version || !question) return;
    const id = `TQ-${Date.now()}`;
    const copy = {
      ...structuredClone(question),
      id,
      number: `${section?.number}.${(section?.questionIds.length ?? 0) + 1}`,
      shortTitle: `Copy of ${question.shortTitle}`,
      order: version.questions.length,
    };
    change({
      ...version,
      questions: [...version.questions, copy],
      sections: version.sections.map((s) =>
        s.id === section?.id
          ? { ...s, questionIds: [...s.questionIds, id] }
          : s,
      ),
    });
    setSelected(id);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (version) change(version);
      }
      if (
        e.key.toLowerCase() === "d" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        duplicate();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  if (!template || !version)
    return <div className="builder-loading">Loading template builder…</div>;
  const immutable =
    version.status === "Published" || version.status === "Superseded";
  function publishNow() {
    publishVersion(template!.id, version!.id);
    setPublish(false);
    router.push(`/audit-templates/${template!.id}`);
  }
  function createDraft() {
    const draft = createDraftVersion(template!);
    router.replace(`/audit-templates/${template!.id}/edit?version=${draft.id}`);
  }
  return (
    <div className="template-builder-shell">
      <header className="builder-top">
        <Link href="/audit-templates">
          <ChevronLeft size={14} />
          Templates
        </Link>
        <i />
        <div>
          <b>{template.name}</b>
          <small>{template.standard}</small>
        </div>
        <span>
          {version.status} v{version.version}
        </span>
        <em className={saved.startsWith("Unable") ? "save-error" : ""}>
          {saved === "Saved ✓" ? <Check size={12} /> : null}
          {saved}
        </em>
        <div>
          <button
            onClick={() => setStructureCollapsed((value) => !value)}
            aria-pressed={structureCollapsed}
            title={structureCollapsed ? "Show structure" : "Collapse structure"}
          >
            <PanelLeft size={14} />
            Structure
          </button>
          <button
            onClick={() => setConfigCollapsed((value) => !value)}
            aria-pressed={configCollapsed}
            title={
              configCollapsed ? "Show configuration" : "Collapse configuration"
            }
          >
            <PanelRight size={14} />
            Configuration
          </button>
          <button onClick={() => setValidation(true)}>Validate</button>
          <button onClick={() => setPreview(true)}>Preview</button>
          {immutable ? (
            <button className="builder-publish" onClick={createDraft}>
              Create New Version
            </button>
          ) : (
            <button
              className="builder-publish"
              onClick={() =>
                issues.some((i) => i.type === "error")
                  ? setValidation(true)
                  : setPublish(true)
              }
            >
              Publish
            </button>
          )}
        </div>
      </header>
      {immutable && (
        <div className="immutable-banner">
          Published versions are read-only. Create a new draft version to make
          changes.
        </div>
      )}
      <div
        className={`builder-layout ${immutable ? "is-immutable" : ""} ${structureCollapsed ? "structure-collapsed" : ""} ${configCollapsed ? "config-collapsed" : ""}`}
      >
        <div
          className={`builder-structure-pane ${structureOpen ? "builder-pane-open" : ""}`}
        >
          <StructureNavigator
            version={version}
            selected={selected}
            onSelect={setSelected}
            onChange={change}
            onLibrary={setLibrarySection}
            onClose={() => setStructureOpen(false)}
          />
        </div>
        <QuestionEditor
          question={question}
          section={section}
          onChange={changeQuestion}
        />
        <div
          className={`builder-config-pane ${configOpen ? "builder-pane-open" : ""}`}
        >
          <QuestionConfiguration
            question={question}
            sourceQuestions={version.questions}
            mode={configMode}
            setMode={setConfigMode}
            onChange={changeQuestion}
            onClose={() => setConfigOpen(false)}
          />
        </div>
        <div className="builder-mobile-tools">
          <button onClick={() => setStructureOpen(true)}>
            <PanelLeft size={14} />
            Structure
          </button>
          <button onClick={() => setConfigOpen(true)}>
            <PanelRight size={14} />
            Settings
          </button>
          <button onClick={() => setPreview(true)}>Preview</button>
        </div>
      </div>
      {validation && (
        <ValidationPanel
          version={version}
          issues={issues}
          onClose={() => setValidation(false)}
          onIssue={(issue) => {
            setValidation(false);
            if (issue.questionId) setSelected(issue.questionId);
            setTimeout(
              () => document.getElementById("builder-audit-question")?.focus(),
              80,
            );
          }}
        />
      )}
      {preview && (
        <ChecklistPreview
          template={template}
          version={version}
          onClose={() => setPreview(false)}
        />
      )}{" "}
      {publish && (
        <PublishDialog
          template={template}
          version={version}
          onClose={() => setPublish(false)}
          onPublish={publishNow}
        />
      )}{" "}
      {librarySection && (
        <QuestionLibrary
          version={version}
          sectionId={librarySection}
          onClose={() => setLibrarySection("")}
          onAdd={(items) => {
            const clones = items.map((q, i) => ({
              ...structuredClone(q),
              id: `TQ-${Date.now()}-${i}`,
              sectionId: librarySection,
              order: version.questions.length + i,
            }));
            change({
              ...version,
              questions: [...version.questions, ...clones],
              sections: version.sections.map((s) =>
                s.id === librarySection
                  ? {
                      ...s,
                      questionIds: [
                        ...s.questionIds,
                        ...clones.map((q) => q.id),
                      ],
                    }
                  : s,
              ),
            });
            setLibrarySection("");
          }}
        />
      )}
    </div>
  );
}
function validate(v: TemplateVersion): Issue[] {
  const issues: Issue[] = [];
  if (!v.sections.length)
    issues.push({
      type: "error",
      message: "Add at least one section before publishing.",
    });
  if (!v.questions.length)
    issues.push({
      type: "error",
      message: "Add at least one question before publishing.",
    });
  v.sections.forEach((section) => {
    if (!section.title.trim())
      issues.push({
        type: "error",
        message: `Section ${section.number} has no title.`,
      });
    if (!section.questionIds.length)
      issues.push({
        type: "warning",
        message: `Section ${section.number} has no questions.`,
      });
  });
  v.questions.forEach((q) => {
    if (!q.shortTitle.trim())
      issues.push({
        type: "error",
        message: `Question ${q.number} has no short title.`,
        questionId: q.id,
      });
    if (!q.question.trim())
      issues.push({
        type: "error",
        message: `Question ${q.number} has no audit question.`,
        questionId: q.id,
      });
    if (!q.guidance.trim())
      issues.push({
        type: "warning",
        message: `Question ${q.number} has no auditor guidance.`,
        questionId: q.id,
      });
    if (!q.code.trim())
      issues.push({
        type: "error",
        message: `Question ${q.number} has no question code.`,
        questionId: q.id,
      });
    if (!q.clause.trim())
      issues.push({
        type: "warning",
        message: `Question ${q.number} has no reference.`,
        questionId: q.id,
      });
    if (!q.allowedResponses.length)
      issues.push({
        type: "error",
        message: `Question ${q.number} has no allowed responses.`,
        questionId: q.id,
      });
    if (
      q.displayRule.mode === "conditional" &&
      !q.displayRule.conditions.length
    )
      issues.push({
        type: "error",
        message: `Question ${q.number} needs at least one display condition.`,
        questionId: q.id,
      });
    if (
      q.displayRule.mode === "conditional" &&
      q.displayRule.conditions.some(
        (condition) => !condition.questionId || !condition.values.length,
      )
    )
      issues.push({
        type: "error",
        message: `Question ${q.number} has an incomplete display condition.`,
        questionId: q.id,
      });
  });
  const duplicateCodes = v.questions
    .map((question) => question.code.trim().toLowerCase())
    .filter(
      (code, index, codes) =>
        code && codes.indexOf(code) !== index,
    );
  if (duplicateCodes.length)
    issues.push({
      type: "error",
      message: "Question codes must be unique within this template version.",
    });
  if (v.scoringConfig.sectionWeighting) {
    const total = v.sections.reduce((n, s) => n + s.weight, 0);
    if (total !== 100)
      issues.push({
        type: "error",
        message: `Section weights total ${total}%; expected 100%.`,
      });
  }
  return issues;
}
function ValidationPanel({
  version,
  issues,
  onClose,
  onIssue,
}: {
  version: TemplateVersion;
  issues: Issue[];
  onClose: () => void;
  onIssue: (i: Issue) => void;
}) {
  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");
  const passed = Math.max(0, version.questions.length - issues.length);
  return (
    <div className="builder-modal">
      <section className="validation-panel">
        <header>
          <div>
            <h2>Template Validation</h2>
            <p>
              {passed} checks passed · {warnings.length} warnings ·{" "}
              {errors.length} errors
            </p>
          </div>
          <button onClick={onClose} aria-label="Close validation results">
            <X size={16} />
          </button>
        </header>
        {!issues.length && (
          <div className="validation-success">
            <Check size={19} />
            <b>Template is ready to publish</b>
            <span>All configured checks passed.</span>
          </div>
        )}
        {errors.length > 0 && (
          <div>
            <h3>Errors</h3>
            {errors.map((i, n) => (
              <button key={n} onClick={() => onIssue(i)}>
                <i /> <span>{i.message}</span>
                <b>Open →</b>
              </button>
            ))}
          </div>
        )}
        {warnings.length > 0 && (
          <div>
            <h3>Warnings</h3>
            {warnings.map((i, n) => (
              <button key={n} onClick={() => onIssue(i)}>
                <i className="warning" />
                <span>{i.message}</span>
                <b>Open →</b>
              </button>
            ))}
          </div>
        )}
        <footer>
          <button onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  );
}
function PublishDialog({
  template,
  version,
  onClose,
  onPublish,
}: {
  template: AuditTemplate;
  version: TemplateVersion;
  onClose: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="builder-modal">
      <section className="publish-dialog">
        <h2>Publish Template?</h2>
        <b>{template.name}</b>
        <dl>
          <Meta label="Version" value={version.version} />
          <Meta label="Sections" value={String(version.sections.length)} />
          <Meta label="Questions" value={String(version.questions.length)} />
          <Meta
            label="Total Score"
            value={String(version.questions.reduce((n, q) => n + q.weight, 0))}
          />
        </dl>
        <p>
          Publishing makes this version available for new audits. Existing
          audits continue using their assigned version.
        </p>
        <footer>
          <button onClick={onClose}>Cancel</button>
          <button className="builder-publish" onClick={onPublish}>
            Publish v{version.version}
          </button>
        </footer>
      </section>
    </div>
  );
}
function ChecklistPreview({
  template,
  version,
  onClose,
}: {
  template: AuditTemplate;
  version: TemplateVersion;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  return (
    <div className="builder-preview-overlay">
      <header>
        <div>
          <b>Checklist Preview</b>
          <span>
            {template.name} · v{version.version}
          </span>
        </div>
        <nav>
          {(["desktop", "tablet", "mobile"] as const).map((x) => (
            <button
              className={device === x ? "active" : ""}
              onClick={() => setDevice(x)}
              key={x}
            >
              {x}
            </button>
          ))}
        </nav>
        <button onClick={onClose} aria-label="Close checklist preview">
          <X size={17} />
        </button>
      </header>
      <div className={`full-checklist-preview preview-${device}`}>
        {version.sections.map((s) => (
          <section key={s.id}>
            <h2>
              {s.number}. {s.title}
              <span>{s.questionIds.length} questions</span>
            </h2>
            {s.questionIds.map((id) => {
              const q = version.questions.find((x) => x.id === id)!;
              return (
                <article key={id}>
                  <code title={`Clause ${q.clause}`}>{q.code}</code>
                  <div>
                    <b>{q.shortTitle}</b>
                    <p>{q.question || "Question content missing"}</p>
                    <small>
                      {q.allowedResponses
                        .map((v) => v.replace("_", " "))
                        .join(" · ")}
                    </small>
                  </div>
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
function QuestionLibrary({
  version,
  sectionId,
  onClose,
  onAdd,
}: {
  version: TemplateVersion;
  sectionId: string;
  onClose: () => void;
  onAdd: (q: TemplateQuestion[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const options = version.questions
    .filter((q) =>
      `${q.number} ${q.shortTitle} ${q.standard}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 12);
  return (
    <>
      <button className="drawer-scrim" onClick={onClose} />
      <aside className="qms-drawer question-library">
        <header>
          <div>
            <h2>Question Library</h2>
            <p>Add independent question copies to section {sectionId}.</p>
          </div>
          <button onClick={onClose} aria-label="Close question library">
            <X size={17} />
          </button>
        </header>
        <div className="drawer-body">
          <input
            className="library-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions..."
          />
          <div className="library-filters">
            <select>
              <option>All standards</option>
            </select>
            <select>
              <option>All clauses</option>
            </select>
            <select>
              <option>All audit types</option>
            </select>
            <select>
              <option>All categories</option>
            </select>
          </div>
          {options.map((q) => (
            <label className="library-question" key={q.id}>
              <input
                type="checkbox"
                checked={selected.includes(q.id)}
                onChange={() =>
                  setSelected((v) =>
                    v.includes(q.id)
                      ? v.filter((x) => x !== q.id)
                      : [...v, q.id],
                  )
                }
              />
              <span>
                <code>{q.clause}</code>
                <b>{q.shortTitle}</b>
                <small>{q.standard} · Used in 4 templates</small>
              </span>
            </label>
          ))}
          {!options.length && (
            <div className="library-empty">
              No matching questions. Adjust your search or create a new
              question.
            </div>
          )}
        </div>
        <footer>
          <button onClick={onClose}>Cancel</button>
          <button
            className="button-primary"
            disabled={!selected.length}
            onClick={() =>
              onAdd(options.filter((q) => selected.includes(q.id)))
            }
          >
            Add to Section
          </button>
        </footer>
      </aside>
    </>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
