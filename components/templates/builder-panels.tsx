"use client";
import { useState } from "react";
import {
  ChevronDown,
  GripVertical,
  MoreHorizontal,
  Plus,
  X,
} from "lucide-react";
import { responseLabels, type ResponseValue } from "@/data/execution";
import type {
  TemplateQuestion,
  TemplateSection,
  TemplateVersion,
} from "@/data/templates";
export function StructureNavigator({
  version,
  selected,
  onSelect,
  onChange,
  onLibrary,
  onClose,
}: {
  version: TemplateVersion;
  selected: string;
  onSelect: (id: string) => void;
  onChange: (v: TemplateVersion) => void;
  onLibrary: (section: string) => void;
  onClose: () => void;
}) {
  const [renaming,setRenaming]=useState<string>();
  const [renameDraft,setRenameDraft]=useState("");
  const [pendingDelete,setPendingDelete]=useState<{kind:"section"|"question";id:string;label:string}>();
  function addSection() {
    const n = version.sections.length + 1;
    const id = `TS-${Date.now()}`;
    onChange({
      ...version,
      sections: [
        ...version.sections,
        {
          id,
          versionId: version.id,
          number: String(n),
          title: "New Section",
          order: n - 1,
          weight: 0,
          questionIds: [],
        },
      ],
    });
  }
  function addQuestion(section: TemplateSection) {
    const id = `TQ-${Date.now()}`;
    const q: TemplateQuestion = {
      id,
      sectionId: section.id,
      code: `TMP-Q${String(version.questions.length + 1).padStart(3, "0")}`,
      number: `${section.number}.${section.questionIds.length + 1}`,
      shortTitle: "New Question",
      question: "",
      guidance: "",
      expectedEvidence: "",
      standard: "",
      clause: `${section.number}.${section.questionIds.length + 1}`,
      referenceIds: [],
      required: true,
      requireNote: false,
      allowedResponses: [
        "conform",
        "minor_nc",
        "major_nc",
        "observation",
        "ofi",
        "na",
      ],
      naRequireJustification: true,
      naRequireApproval: false,
      evidenceRule: { mode: "optional", responses: [] },
      findingRules: {
        minor: true,
        major: true,
        observation: false,
        ofi: "optional",
      },
      displayRule: { mode: "always", match: "all", conditions: [] },
      weight: 2,
      responseScores: {
        conform: 100,
        minor_nc: 50,
        major_nc: 0,
        observation: 100,
        ofi: 100,
        na: 0,
      },
      order: version.questions.length,
    };
    onChange({
      ...version,
      questions: [...version.questions, q],
      sections: version.sections.map((s) =>
        s.id === section.id ? { ...s, questionIds: [...s.questionIds, id] } : s,
      ),
    });
    onSelect(id);
  }
  function move(qid: string, delta: number) {
    const section = version.sections.find((s) => s.questionIds.includes(qid));
    if (!section) return;
    const index = section.questionIds.indexOf(qid);
    const target = index + delta;
    if (target < 0 || target >= section.questionIds.length) return;
    const ids = [...section.questionIds];
    [ids[index], ids[target]] = [ids[target], ids[index]];
    onChange({
      ...version,
      sections: version.sections.map((s) =>
        s.id === section.id ? { ...s, questionIds: ids } : s,
      ),
    });
  }
  function moveSection(id: string, delta: number) {
    const index = version.sections.findIndex((section) => section.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= version.sections.length) return;
    const sections = [...version.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    onChange({
      ...version,
      sections: sections.map((section, order) => ({ ...section, order })),
    });
  }
  function renameSection(section: TemplateSection) {
    const title = renameDraft.trim();
    setRenaming(undefined);
    if (!title || title === section.title) return;
    onChange({
      ...version,
      sections: version.sections.map((item) =>
        item.id === section.id ? { ...item, title } : item,
      ),
    });
  }
  function duplicateSection(section: TemplateSection) {
    const sectionId = `TS-${Date.now()}`;
    const copies = section.questionIds.flatMap((id, index) => {
      const source = version.questions.find((question) => question.id === id);
      return source
        ? [
            {
              ...structuredClone(source),
              id: `${sectionId}-Q-${index + 1}`,
              sectionId,
              order: version.questions.length + index,
            },
          ]
        : [];
    });
    onChange({
      ...version,
      sections: [
        ...version.sections,
        {
          ...structuredClone(section),
          id: sectionId,
          versionId: version.id,
          title: `Copy of ${section.title}`,
          order: version.sections.length,
          questionIds: copies.map((question) => question.id),
        },
      ],
      questions: [...version.questions, ...copies],
    });
    if (copies[0]) onSelect(copies[0].id);
  }
  function deleteSection(section: TemplateSection) {
    onChange({
      ...version,
      sections: version.sections.filter((item) => item.id !== section.id),
      questions: version.questions.filter(
        (question) => question.sectionId !== section.id,
      ),
    });
    if (section.questionIds.includes(selected)) onSelect("");
  }
  function duplicateQuestion(id: string) {
    const source = version.questions.find((question) => question.id === id);
    const section = version.sections.find((item) =>
      item.questionIds.includes(id),
    );
    if (!source || !section) return;
    const copyId = `TQ-${Date.now()}`;
    const copy = {
      ...structuredClone(source),
      id: copyId,
      shortTitle: `Copy of ${source.shortTitle}`,
      order: version.questions.length,
    };
    onChange({
      ...version,
      questions: [...version.questions, copy],
      sections: version.sections.map((item) =>
        item.id === section.id
          ? { ...item, questionIds: [...item.questionIds, copyId] }
          : item,
      ),
    });
    onSelect(copyId);
  }
  function deleteQuestion(id: string) {
    onChange({
      ...version,
      questions: version.questions.filter((question) => question.id !== id),
      sections: version.sections.map((section) => ({
        ...section,
        questionIds: section.questionIds.filter(
          (questionId) => questionId !== id,
        ),
      })),
    });
    if (selected === id) onSelect("");
  }
  return (
    <aside className="builder-structure">
      <header>
        <div>
          <span>Checklist Structure</span>
          <b>{version.questions.length} Questions</b>
        </div>
        <button onClick={onClose} aria-label="Close checklist structure">
          <X size={16} />
        </button>
      </header>
      <div className="structure-scroll">
        {version.sections.map((section) => (
          <section key={section.id}>
            <div className="builder-section-row">
              <GripVertical size={13} />
              <span>{renaming===section.id?<input autoFocus value={renameDraft} onChange={e=>setRenameDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")renameSection(section);if(e.key==="Escape")setRenaming(undefined)}} onBlur={()=>renameSection(section)} aria-label="Section title"/>:<><b>{section.number}. {section.title}</b><small>{section.questionIds.length}</small></>}</span>
              <div className="builder-row-tools">
                <button
                  aria-label="Move section up"
                  onClick={() => moveSection(section.id, -1)}
                >
                  ↑
                </button>
                <button
                  aria-label="Move section down"
                  onClick={() => moveSection(section.id, 1)}
                >
                  ↓
                </button>
                <button
                  aria-label="Rename section"
                  onClick={() => {setRenaming(section.id);setRenameDraft(section.title)}}
                >
                  <MoreHorizontal size={14} />
                </button>
                <button
                  aria-label="Duplicate section"
                  onClick={() => duplicateSection(section)}
                >
                  ⧉
                </button>
                <button
                  aria-label="Delete section"
                  onClick={() => setPendingDelete({kind:"section",id:section.id,label:`${section.title} and its ${section.questionIds.length} questions`})}
                >
                  ×
                </button>
              </div>
            </div>
            {section.questionIds.map((id) => {
              const q = version.questions.find((x) => x.id === id);
              if (!q) return null;
              return (
                <button
                  className={`builder-question-row ${selected === id ? "selected" : ""} ${!q.question ? "invalid" : ""}`}
                  key={id}
                  onClick={() => onSelect(id)}
                >
                  <GripVertical size={11} />
                  <span>
                    <b>{q.number}</b>
                    {q.shortTitle}
                  </span>
                  <i />
                  <em
                    onClick={(e) => {
                      e.stopPropagation();
                      move(id, -1);
                    }}
                  >
                    ↑
                  </em>
                  <em
                    onClick={(e) => {
                      e.stopPropagation();
                      move(id, 1);
                    }}
                  >
                    ↓
                  </em>
                  <em
                    aria-label="Duplicate question"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateQuestion(id);
                    }}
                  >
                    ⧉
                  </em>
                  <em
                    aria-label="Delete question"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete({kind:"question",id,label:q.shortTitle});
                    }}
                  >
                    ×
                  </em>
                </button>
              );
            })}
            <div className="add-question-buttons">
              <button onClick={() => addQuestion(section)}>
                <Plus size={11} />
                New Question
              </button>
              <button onClick={() => onLibrary(section.id)}>
                From Library
              </button>
            </div>
          </section>
        ))}
        <button className="add-section" onClick={addSection}>
          <Plus size={13} />
          Add Section
        </button>
      </div>
      {pendingDelete&&<div className="execution-confirm-overlay"><section className="completion-confirm"><h2>Delete {pendingDelete.kind}?</h2><p>This will remove {pendingDelete.label} from the draft version.</p><footer><button className="button-secondary" onClick={()=>setPendingDelete(undefined)}>Cancel</button><button className="button-primary" onClick={()=>{if(pendingDelete.kind==="section")deleteSection(version.sections.find(s=>s.id===pendingDelete.id)!);else deleteQuestion(pendingDelete.id);setPendingDelete(undefined)}}>Delete</button></footer></section></div>}
    </aside>
  );
}
export function QuestionEditor({
  question,
  section,
  onChange,
}: {
  question?: TemplateQuestion;
  section?: TemplateSection;
  onChange: (q: TemplateQuestion) => void;
}) {
  if (!question)
    return (
      <main className="question-editor builder-empty">
        <h2>No question selected</h2>
        <p>Add or select a question from the checklist structure.</p>
      </main>
    );
  function set<K extends keyof TemplateQuestion>(
    key: K,
    value: TemplateQuestion[K],
  ) {
    onChange({ ...question!, [key]: value });
  }
  return (
    <main className="question-editor">
      <header>
        <span>Question {question.order + 1}</span>
        <b>
          Section {section?.number} — {section?.title}
        </b>
      </header>
      <div className="editor-scroll">
        <div className="form-pair">
          <Field label="Question Code">
            <div className="question-code-input">
              <input
                value={question.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="QMS-6.3-001"
              />
              <button
                type="button"
                onClick={() =>
                  set(
                    "code",
                    `QMS-${question.clause || question.number}-${String(question.order + 1).padStart(3, "0")}`,
                  )
                }
              >
                Auto
              </button>
            </div>
          </Field>
          <Field label="Clause / Display Number">
            <input
              value={question.number}
              onChange={(e) => set("number", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Short Title *">
          <input
            value={question.shortTitle}
            onChange={(e) => set("shortTitle", e.target.value)}
          />
        </Field>
        <Field label="Audit Question *">
          <textarea
            id="builder-audit-question"
            rows={6}
            value={question.question}
            onChange={(e) => set("question", e.target.value)}
            placeholder="Enter an original, evidence-oriented audit question..."
          />
        </Field>
        <Field label="Auditor Guidance">
          <textarea
            rows={5}
            value={question.guidance}
            onChange={(e) => set("guidance", e.target.value)}
            placeholder="Describe evidence, records and interviews the auditor should consider."
          />
        </Field>
        <Field label="Expected Evidence">
          <textarea
            className="expected-evidence-input"
            rows={5}
            value={question.expectedEvidence}
            onChange={(e) => set("expectedEvidence", e.target.value)}
            placeholder="List documents, records, interviews or physical evidence that may demonstrate conformity."
          />
        </Field>
        <h3>Reference Information</h3>
        <div className="form-pair">
          <Field label="Standard / Framework">
            <input
              value={question.standard}
              onChange={(e) => set("standard", e.target.value)}
            />
          </Field>
          <Field label="Clause">
            <input
              value={question.clause}
              onChange={(e) => set("clause", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Reference Documents">
          <div className="reference-editor">
            {question.referenceIds.map((r, i) => (
              <div key={r.id}>
                <input
                  value={r.name}
                  onChange={(e) =>
                    set(
                      "referenceIds",
                      question.referenceIds.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                />
                <input
                  value={r.id}
                  onChange={(e) =>
                    set(
                      "referenceIds",
                      question.referenceIds.map((x, j) =>
                        j === i ? { ...x, id: e.target.value } : x,
                      ),
                    )
                  }
                />
                <button
                  onClick={() =>
                    set(
                      "referenceIds",
                      question.referenceIds.filter((_, j) => j !== i),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                set("referenceIds", [
                  ...question.referenceIds,
                  { id: "", name: "" },
                ])
              }
            >
              <Plus size={12} />
              Add Reference
            </button>
          </div>
        </Field>
        <h3>Question Score</h3>
        <Field label="Weight (points)">
          <input
            type="number"
            min="0"
            value={question.weight}
            onChange={(e) => set("weight", Number(e.target.value))}
          />
        </Field>
        <div className="response-score-grid">
          {question.allowedResponses.map((v) => (
            <label key={v}>
              <span>{responseLabels[v]}</span>
              <input
                type="number"
                min="0"
                max="100"
                value={question.responseScores[v]}
                onChange={(e) =>
                  set("responseScores", {
                    ...question.responseScores,
                    [v]: Number(e.target.value),
                  })
                }
              />
              <small>%</small>
            </label>
          ))}
        </div>
      </div>
    </main>
  );
}
export function QuestionConfiguration({
  question,
  sourceQuestions,
  mode,
  setMode,
  onChange,
  onClose,
}: {
  question?: TemplateQuestion;
  sourceQuestions: TemplateQuestion[];
  mode: "configure" | "preview";
  setMode: (v: "configure" | "preview") => void;
  onChange: (q: TemplateQuestion) => void;
  onClose: () => void;
}) {
  if (!question) return <aside className="question-config" />;
  function set<K extends keyof TemplateQuestion>(
    key: K,
    value: TemplateQuestion[K],
  ) {
    onChange({ ...question!, [key]: value });
  }
  function toggleResponse(v: ResponseValue) {
    set(
      "allowedResponses",
      question!.allowedResponses.includes(v)
        ? question!.allowedResponses.filter((x) => x !== v)
        : [...question!.allowedResponses, v],
    );
  }
  return (
    <aside className="question-config">
      <header>
        <div>
          <button
            className={mode === "configure" ? "active" : ""}
            onClick={() => setMode("configure")}
          >
            Configure
          </button>
          <button
            className={mode === "preview" ? "active" : ""}
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>
        <button onClick={onClose} aria-label="Close question configuration">
          <X size={15} />
        </button>
      </header>
      {mode === "preview" ? (
        <div className="question-live-preview">
          <span>Section Preview</span>
          <code>{question.code} · Clause {question.clause}</code>
          <h3>{question.shortTitle}</h3>
          <p>{question.question || "Audit question has not been entered."}</p>
          <h4>Response</h4>
          {question.allowedResponses.map((v) => (
            <div key={v}>
              <i />
              {responseLabels[v]}
            </div>
          ))}
          <h4>Auditor Notes</h4>
          <div className="preview-input" />
          <h4>Evidence</h4>
          {question.expectedEvidence && (
            <p className="preview-expected-evidence">
              Expected: {question.expectedEvidence.split("\n").join(" · ")}
            </p>
          )}
          <button disabled>Add Evidence</button>
        </div>
      ) : (
        <div className="config-scroll">
          <Config title="Response options" defaultOpen>
            {(Object.keys(responseLabels) as ResponseValue[]).map((v) => (
              <Toggle
                key={v}
                label={responseLabels[v]}
                checked={question.allowedResponses.includes(v)}
                onChange={() => toggleResponse(v)}
              />
            ))}
          </Config>
          {question.allowedResponses.includes("na") && (
            <Config title="N/A settings">
              <Toggle
                label="Require justification"
                checked={question.naRequireJustification}
                onChange={() =>
                  set(
                    "naRequireJustification",
                    !question.naRequireJustification,
                  )
                }
              />
              <Toggle
                label="Require approval"
                checked={question.naRequireApproval}
                onChange={() =>
                  set("naRequireApproval", !question.naRequireApproval)
                }
              />
            </Config>
          )}
          <Config title="Question requirements" defaultOpen>
            <Toggle
              label="Required Question"
              checked={question.required}
              onChange={() => set("required", !question.required)}
            />
            <Toggle
              label="Require Auditor Note"
              checked={question.requireNote}
              onChange={() => set("requireNote", !question.requireNote)}
            />
          </Config>
          <Config title="Evidence">
            <label className="config-select">
              <span>Evidence Requirement</span>
              <select
                value={question.evidenceRule.mode}
                onChange={(e) =>
                  set("evidenceRule", {
                    ...question.evidenceRule,
                    mode: e.target.value as typeof question.evidenceRule.mode,
                  })
                }
              >
                <option value="optional">Optional</option>
                <option value="required">Required</option>
                <option value="conditional">Conditional</option>
              </select>
            </label>
            {question.evidenceRule.mode === "conditional" &&
              (["minor_nc", "major_nc", "observation", "ofi"] as ResponseValue[]).map(
                (v) => (
                  <Toggle
                    key={v}
                    label={`Require for ${responseLabels[v]}`}
                    checked={question.evidenceRule.responses.includes(v)}
                    onChange={() =>
                      set("evidenceRule", {
                        ...question.evidenceRule,
                        responses: question.evidenceRule.responses.includes(v)
                          ? question.evidenceRule.responses.filter(
                              (x) => x !== v,
                            )
                          : [...question.evidenceRule.responses, v],
                      })
                    }
                  />
                ),
              )}
          </Config>
          <Config title="Finding rules">
            <Toggle
              label="Minor NC · Finding required"
              checked={question.findingRules.minor}
              onChange={() =>
                set("findingRules", {
                  ...question.findingRules,
                  minor: !question.findingRules.minor,
                })
              }
            />
            <Toggle
              label="Major NC · Finding required"
              checked={question.findingRules.major}
              onChange={() =>
                set("findingRules", {
                  ...question.findingRules,
                  major: !question.findingRules.major,
                })
              }
            />
            <Toggle
              label="Observation · Finding optional"
              checked={question.findingRules.observation}
              onChange={() =>
                set("findingRules", {
                  ...question.findingRules,
                  observation: !question.findingRules.observation,
                })
              }
            />
            {question.allowedResponses.includes("ofi") && (
              <label className="config-select">
                <span>OFI finding behavior</span>
                <select
                  value={question.findingRules.ofi}
                  onChange={(event) =>
                    set("findingRules", {
                      ...question.findingRules,
                      ofi: event.target.value as typeof question.findingRules.ofi,
                    })
                  }
                >
                  <option value="optional">Finding optional</option>
                  <option value="required">Finding required</option>
                  <option value="none">No finding</option>
                </select>
              </label>
            )}
          </Config>
          <Config title="Conditional display">
            <label className="config-select">
              <span>Display</span>
              <select
                value={question.displayRule.mode}
                onChange={(event) =>
                  set("displayRule", {
                    ...question.displayRule,
                    mode: event.target.value as "always" | "conditional",
                  })
                }
              >
                <option value="always">Always show</option>
                <option value="conditional">Show when conditions are met</option>
              </select>
            </label>
            {question.displayRule.mode === "conditional" && (
              <div className="conditional-rule-builder">
                <label className="config-select">
                  <span>Match</span>
                  <select
                    value={question.displayRule.match}
                    onChange={(event) =>
                      set("displayRule", {
                        ...question.displayRule,
                        match: event.target.value as "all" | "any",
                      })
                    }
                  >
                    <option value="all">All conditions</option>
                    <option value="any">Any condition</option>
                  </select>
                </label>
                {question.displayRule.conditions.map((condition, index) => (
                  <div className="condition-row" key={`${condition.questionId}-${index}`}>
                    <select
                      aria-label="Source question"
                      value={condition.questionId}
                      onChange={(event) =>
                        updateCondition(question, set, index, {
                          questionId: event.target.value,
                        })
                      }
                    >
                      <option value="">Source question</option>
                      {sourceQuestions
                        .filter((source) => source.id !== question.id)
                        .map((source) => (
                          <option key={source.id} value={source.id}>
                            {source.number} · {source.shortTitle}
                          </option>
                        ))}
                    </select>
                    <select
                      aria-label="Operator"
                      value={condition.operator}
                      onChange={(event) =>
                        updateCondition(question, set, index, {
                          operator: event.target.value as typeof condition.operator,
                        })
                      }
                    >
                      <option value="equals">equals</option>
                      <option value="does_not_equal">does not equal</option>
                      <option value="is_one_of">is one of</option>
                    </select>
                    <div className="condition-values">
                      {(Object.keys(responseLabels) as ResponseValue[]).map((value) => (
                        <label key={value}>
                          <input
                            type={
                              condition.operator === "is_one_of"
                                ? "checkbox"
                                : "radio"
                            }
                            name={`condition-${question.id}-${index}`}
                            checked={condition.values.includes(value)}
                            onChange={() =>
                              updateCondition(question, set, index, {
                                values:
                                  condition.operator === "is_one_of"
                                    ? condition.values.includes(value)
                                      ? condition.values.filter(
                                          (item) => item !== value,
                                        )
                                      : [...condition.values, value]
                                    : [value],
                              })
                            }
                          />
                          {responseLabels[value]}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="condition-remove"
                      onClick={() =>
                        set("displayRule", {
                          ...question.displayRule,
                          conditions: question.displayRule.conditions.filter(
                            (_, conditionIndex) => conditionIndex !== index,
                          ),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-condition"
                  onClick={() =>
                    set("displayRule", {
                      ...question.displayRule,
                      conditions: [
                        ...question.displayRule.conditions,
                        {
                          questionId:
                            sourceQuestions.find((source) => source.id !== question.id)
                              ?.id ?? "",
                          operator: "equals",
                          values: ["conform"],
                        },
                      ],
                    })
                  }
                >
                  <Plus size={12} /> Add Condition
                </button>
              </div>
            )}
          </Config>
        </div>
      )}
    </aside>
  );
}

function updateCondition(
  question: TemplateQuestion,
  set: <K extends keyof TemplateQuestion>(
    key: K,
    value: TemplateQuestion[K],
  ) => void,
  index: number,
  change: Partial<TemplateQuestion["displayRule"]["conditions"][number]>,
) {
  set("displayRule", {
    ...question.displayRule,
    conditions: question.displayRule.conditions.map((condition, conditionIndex) =>
      conditionIndex === index ? { ...condition, ...change } : condition,
    ),
  });
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Config({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={open ? "config-expanded" : ""}>
      <button
        type="button"
        className="config-section-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{title}</span>
        <ChevronDown size={16} />
      </button>
      {open && <div className="config-section-body">{children}</div>}
    </section>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="builder-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <i />
    </label>
  );
}
