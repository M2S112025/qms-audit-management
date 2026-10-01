"use client";
import { useEffect, useState } from "react";
import {
  templateSeed,
  type AuditTemplate,
  type TemplateQuestion,
  type TemplateVersion,
} from "@/data/templates";
const KEY = "qms-templates-v1";
const EVENT = "qms-templates-change";
export function loadTemplates(): AuditTemplate[] {
  if (typeof window === "undefined") return templateSeed;
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return (stored ?? templateSeed).map(normalizeTemplate);
  } catch {
    return templateSeed;
  }
}

function normalizeTemplate(template: AuditTemplate): AuditTemplate {
  return {
    ...template,
    versions: template.versions.map((version) => {
      const supplierSource = version.questions.find(
        (question) => question.clause === "8.4",
      );
      return {
        ...version,
        scoringConfig: {
          ...version.scoringConfig,
          responseScores: {
                        ...version.scoringConfig.responseScores,
            ofi: version.scoringConfig.responseScores.ofi ?? 100,
          },
        },
        questions: version.questions.map((question, index) =>
          normalizeQuestion(question, index, template.id, supplierSource?.id),
        ),
      };
    }),
  };
}

function normalizeQuestion(
  question: TemplateQuestion,
  index: number,
  templateId: string,
  supplierSourceId?: string,
): TemplateQuestion {
  const evidence =
    question.clause === "7.1.5"
      ? "Calibration certificates\nEquipment calibration register\nCalibration labels\nTraceability records"
      : question.clause === "7.2"
        ? "Training records\nCompetency matrix\nEvaluation records"
        : question.clause === "7.5"
          ? "Approved procedure\nRevision history\nDistribution record"
          : "";
  const conditionalDemo =
    templateId === "TMP-001" &&
    question.clause === "8.5" &&
    supplierSourceId;
  return {
    ...question,
    code:
      question.code ??
      `${templateId.replace("-", "")}-Q${String(index + 1).padStart(3, "0")}`,
    expectedEvidence: question.expectedEvidence ?? evidence,
    allowedResponses: question.allowedResponses.includes("ofi")
      ? question.allowedResponses
      : [
          ...question.allowedResponses.slice(0, -1),
          "ofi",
          ...question.allowedResponses.slice(-1),
        ],
    findingRules: {
      minor: question.findingRules?.minor ?? true,
      major: question.findingRules?.major ?? true,
      observation: question.findingRules?.observation ?? false,
      ofi: question.findingRules?.ofi ?? "optional",
    },
    displayRule:
      question.displayRule ??
      (conditionalDemo
        ? {
            mode: "conditional",
            match: "any",
            conditions: [
              {
                questionId: supplierSourceId,
                operator: "is_one_of",
                values: ["minor_nc", "major_nc", "ofi"],
              },
            ],
          }
        : { mode: "always", match: "all", conditions: [] }),
    responseScores: {
      ...question.responseScores,
      ofi: question.responseScores.ofi ?? 100,
    },
  };
}
function write(items: AuditTemplate[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}
export function useTemplates() {
  const [items, setItems] = useState(templateSeed);
  useEffect(() => {
    const sync = () => setItems(loadTemplates());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return items;
}
export function saveTemplate(item: AuditTemplate) {
  write([item, ...loadTemplates().filter((t) => t.id !== item.id)]);
}
export function updateTemplate(
  id: string,
  change: (item: AuditTemplate) => AuditTemplate,
) {
  write(loadTemplates().map((t) => (t.id === id ? change(t) : t)));
}
export function createDraftVersion(template: AuditTemplate) {
  const source =
    template.versions.find((v) => v.id === template.currentVersionId) ??
    template.versions[0];
  const next = incrementVersion(source.version);
  const id = `TV-${template.id}-${next}`;
  const draft: TemplateVersion = {
    ...structuredClone(source),
    id,
    version: next,
    status: "Draft",
    sections: source.sections.map((s) => ({
      ...structuredClone(s),
      versionId: id,
    })),
    questions: structuredClone(source.questions),
    createdBy: "Rumesh Ravi",
    createdAt: "2026-09-08",
    publishedAt: undefined,
    publishedBy: undefined,
    basedOnVersionId: source.id,
    usageCount: 0,
  };
  updateTemplate(template.id, (t) => ({
    ...t,
    status: "Draft",
    versions: [draft, ...t.versions],
    updatedAt: "2026-09-08",
  }));
  return draft;
}
export function updateDraft(
  templateId: string,
  versionId: string,
  change: (v: TemplateVersion) => TemplateVersion,
) {
  updateTemplate(templateId, (t) => ({
    ...t,
    versions: t.versions.map((v) =>
      v.id === versionId &&
      v.status !== "Published" &&
      v.status !== "Superseded"
        ? change(v)
        : v,
    ),
    updatedAt: "2026-09-08",
  }));
}
export function publishVersion(templateId: string, versionId: string) {
  updateTemplate(templateId, (t) => ({
    ...t,
    status: "Published",
    currentVersionId: versionId,
    versions: t.versions.map((v) =>
      v.id === versionId
        ? {
            ...v,
            status: "Published",
            publishedBy: "Rumesh Ravi",
            publishedAt: "2026-09-08",
          }
        : v.status === "Published"
          ? { ...v, status: "Superseded" }
          : v,
    ),
    updatedAt: "2026-09-08",
  }));
}
export function nextTemplateId(items: AuditTemplate[]) {
  const n =
    Math.max(
      ...items
        .map((t) => Number(t.id.split("-").pop()))
        .filter(Number.isFinite),
      0,
    ) + 1;
  return `TMP-${String(n).padStart(3, "0")}`;
}
function incrementVersion(v: string) {
  const [major, minor] = v.split(".").map(Number);
  return `${major}.${minor + 1}`;
}
