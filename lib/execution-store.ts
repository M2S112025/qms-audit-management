"use client";
import { audits as auditSeed } from "@/data/audits";
import {
  createSeedExecution,
  isoChecklist,
  type AuditChecklist,
  type AuditExecutionState,
  type ResponseValue,
} from "@/data/execution";
import { templateSeed, type TemplateVersion } from "@/data/templates";
import { syncExecutionFinding } from "@/lib/finding-store";

const key = (id: string) => `qms-execution-v1-${id}`;

function versionChecklist(
  templateName: string,
  standard: string,
  version: TemplateVersion,
): AuditChecklist {
  const questions = version.questions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((q, index) => ({
      id: q.id,
      sectionId: q.sectionId,
      code: q.code,
      number: index + 1,
      clause: q.clause,
      title: q.shortTitle,
      question: q.question,
      guidance: q.guidance,
      expectedEvidence: q.expectedEvidence,
      required: q.required,
      requireNote: q.requireNote,
      allowedResponses: q.allowedResponses,
      naRequireJustification: q.naRequireJustification,
      evidenceRule: q.evidenceRule,
      findingRules: q.findingRules,
      displayRule: q.displayRule,
      weight: q.weight,
      responseScores: q.responseScores,
    }));
  return {
    id: version.templateId,
    name: templateName,
    standard,
    versionId: version.id,
    version: version.version,
    sections: version.sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        id: section.id,
        number: section.number,
        title: section.title,
        questionIds: section.questionIds.filter((id) =>
          questions.some((q) => q.id === id),
        ),
      })),
    questions,
  };
}

function assignedChecklist(auditId: string) {
  if (typeof window === "undefined") return isoChecklist;
  try {
    const audits =
      JSON.parse(localStorage.getItem("qms-audits-v1") ?? "null") ?? auditSeed;
    const audit = audits.find((item: { id: string }) => item.id === auditId);
    const templates =
      JSON.parse(localStorage.getItem("qms-templates-v1") ?? "null") ??
      templateSeed;
    const template = templates.find(
      (item: { id: string }) => item.id === audit?.templateId,
    );
    const version = template?.versions.find(
      (item: TemplateVersion) => item.id === audit?.templateVersionId,
    );
    return version
      ? versionChecklist(template.name, template.standard, version)
      : isoChecklist;
  } catch {
    return isoChecklist;
  }
}

export function loadExecution(id: string): AuditExecutionState {
  if (typeof window === "undefined") return createSeedExecution(id);
  try {
    const stored = JSON.parse(localStorage.getItem(key(id)) ?? "null");
    if (stored) return normalizeExecution(stored, id);
    return createSeedExecution(id, assignedChecklist(id));
  } catch {
    return createSeedExecution(id, assignedChecklist(id));
  }
}

function normalizeExecution(
  stored: AuditExecutionState,
  auditId: string,
): AuditExecutionState {
  const checklist = stored.checklist ?? assignedChecklist(auditId);
  const supplierSource = checklist.questions.find(
    (question) => question.clause === "8.4",
  );
  const normalizedQuestions = checklist.questions.map((question, index) => ({
    ...question,
    code:
      question.code ??
      `TMP${checklist.id.replace(/\D/g, "").padStart(3, "0")}-Q${String(index + 1).padStart(3, "0")}`,
    expectedEvidence:
      question.expectedEvidence ??
      (question.clause === "7.1.5"
        ? "Calibration certificates\nEquipment calibration register\nCalibration labels\nTraceability records"
        : question.clause === "7.2"
          ? "Training records\nCompetency matrix\nEvaluation records"
          : question.clause === "7.5"
            ? "Approved procedure\nRevision history\nDistribution record"
            : ""),
    allowedResponses: ((question.allowedResponses ?? [
      "conform",
      "minor_nc",
      "major_nc",
      "observation",
      "na",
    ]).includes("ofi")
      ? question.allowedResponses
      : [
          ...(question.allowedResponses ?? [
            "conform",
            "minor_nc",
            "major_nc",
            "observation",
          ]),
          "ofi",
          ...((question.allowedResponses ?? []).includes("na") ? [] : ["na"]),
        ]) as ResponseValue[],
    findingRules: {
      minor: question.findingRules?.minor ?? true,
      major: question.findingRules?.major ?? true,
      observation: question.findingRules?.observation ?? false,
      ofi: question.findingRules?.ofi ?? "optional",
    },
    displayRule:
      question.displayRule ??
      (auditId === "AUD-2026-026" &&
      question.clause === "8.5" &&
      supplierSource
        ? {
            mode: "conditional",
            match: "any",
            conditions: [
              {
                questionId: supplierSource.id,
                operator: "is_one_of",
                values: ["minor_nc", "major_nc", "ofi"],
              },
            ],
          }
        : { mode: "always", match: "all", conditions: [] }),
    responseScores: {
      conform: 100,
      minor_nc: 50,
      major_nc: 0,
      observation: 100,
      ofi: 100,
      na: 0,
      ...question.responseScores,
    },
  }));
  const responses = { ...stored.responses };
  normalizedQuestions.forEach((question) => {
    responses[question.id] ??= {
      auditId,
      questionId: question.id,
      notes: "",
      evidenceIds: [],
      findingIds: [],
      flagged: false,
      naReason: "",
    };
  });
  return {
    ...stored,
    checklist: { ...checklist, questions: normalizedQuestions },
    responses,
  };
}

export function persistExecution(state: AuditExecutionState) {
  localStorage.setItem(key(state.auditId), JSON.stringify(state));
  state.findings.forEach((finding) => syncExecutionFinding(finding));
}
