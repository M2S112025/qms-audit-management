"use client";
import { Bookmark, Check, ChevronDown, ChevronRight, X } from "lucide-react";
import {
  applicableQuestions,
  type AuditExecutionState,
  type AuditQuestion,
} from "@/data/execution";

export type ChecklistFilter =
  | "All"
  | "Unanswered"
  | "Findings"
  | "Flagged"
  | "N/A";
export function ChecklistNavigator({
  state,
  current,
  filter,
  setFilter,
  onSelect,
  onClose,
}: {
  state: AuditExecutionState;
  current: string;
  filter: ChecklistFilter;
  setFilter: (v: ChecklistFilter) => void;
  onSelect: (id: string) => void;
  onClose?: () => void;
}) {
  const checklist = state.checklist;
  const visible = applicableQuestions(state);
  const visibleIds = new Set(visible.map((question) => question.id));
  const answered = visible.filter(
    (question) => state.responses[question.id]?.response,
  ).length;
  return (
    <aside className="execution-nav">
      <header>
        <div>
          <span>Checklist</span>
          <b>{checklist.standard}</b>
          <small>
            {answered} / {visible.length} answered
          </small>
        </div>
        {onClose && (
          <button onClick={onClose}>
            <X size={17} />
          </button>
        )}
      </header>
      <div className="check-filter">
        <select
          aria-label="Filter checklist questions"
          value={filter}
          onChange={(e) => setFilter(e.target.value as ChecklistFilter)}
        >
          {(["All", "Unanswered", "Findings", "Flagged", "N/A"] as const).map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </div>
      <nav>
        {checklist.sections.map((section) => {
          const items = section.questionIds
            .filter((id) => visibleIds.has(id))
            .map((id) => checklist.questions.find((q) => q.id === id)!)
            .filter((q) => matches(q, state, filter));
          if (!items.length) return null;
          const visibleSectionIds = section.questionIds.filter((id) =>
            visibleIds.has(id),
          );
          const complete = visibleSectionIds.filter(
            (id) => state.responses[id]?.response,
          ).length;
          const active = visibleSectionIds.includes(current);
          const hasFinding = visibleSectionIds.some(
            (id) => state.responses[id]?.findingIds.length,
          );
          return (
            <section key={section.id} className={active ? "current" : ""}>
              <button
                className="section-button"
                onClick={() => onSelect(items[0]?.id ?? section.questionIds[0])}
              >
                <span>
                  {active ? (
                    <ChevronDown size={13} />
                  ) : (
                    <ChevronRight size={13} />
                  )}
                </span>
                <b>
                  {section.number}. {section.title}
                </b>
                <small>
                  {complete}/{visibleSectionIds.length}
                </small>
                {complete === visibleSectionIds.length && visibleSectionIds.length ? (
                  <Check className="section-check" size={13} />
                ) : hasFinding ? (
                  <em className="section-finding">!</em>
                ) : null}
              </button>
              {active && (
                <div className="question-nav">
                  {items.map((q) => {
                    const r = state.responses[q.id];
                    return (
                      <button
                        key={q.id}
                        className={current === q.id ? "active" : ""}
                        onClick={() => onSelect(q.id)}
                      >
                        <i>{r?.response ? <Check size={10} /> : null}</i>
                        <span>
                          {q.clause} {q.title}
                        </span>
                        {r?.findingIds.length ? (
                          <em>!</em>
                        ) : r?.flagged ? (
                          <Bookmark size={10} />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
function matches(
  q: AuditQuestion,
  state: AuditExecutionState,
  filter: ChecklistFilter,
) {
  const r = state.responses[q.id];
  if (filter === "Unanswered") return !r?.response;
  if (filter === "Findings") return !!r?.findingIds.length;
  if (filter === "Flagged") return !!r?.flagged;
  if (filter === "N/A") return r?.response === "na";
  return true;
}
