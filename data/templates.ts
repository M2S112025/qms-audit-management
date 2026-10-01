import {
  isoChecklist,
  type QuestionDisplayRule,
  type ResponseValue,
} from "./execution";
export type TemplateStatus =
  | "Draft"
  | "In Review"
  | "Published"
  | "Superseded"
  | "Archived";
export type EvidenceRule = {
  mode: "optional" | "required" | "conditional";
  responses: ResponseValue[];
};
export type TemplateQuestion = {
  id: string;
  sectionId: string;
  code: string;
  number: string;
  shortTitle: string;
  question: string;
  guidance: string;
  expectedEvidence: string;
  standard: string;
  clause: string;
  referenceIds: { id: string; name: string }[];
  required: boolean;
  requireNote: boolean;
  allowedResponses: ResponseValue[];
  naRequireJustification: boolean;
  naRequireApproval: boolean;
  evidenceRule: EvidenceRule;
  findingRules: {
    minor: boolean;
    major: boolean;
    observation: boolean;
    ofi: "required" | "optional" | "none";
  };
  displayRule: QuestionDisplayRule;
  weight: number;
  responseScores: Record<ResponseValue, number>;
  order: number;
};
export type TemplateSection = {
  id: string;
  versionId: string;
  number: string;
  title: string;
  description?: string;
  order: number;
  weight: number;
  questionIds: string[];
};
export type ScoringConfig = {
  method: "weighted" | "equal" | "none";
  sectionWeighting: boolean;
  responseScores: Record<ResponseValue, number>;
  excludeNA: boolean;
};
export type TemplateVersion = {
  id: string;
  templateId: string;
  version: string;
  status: TemplateStatus;
  sections: TemplateSection[];
  questions: TemplateQuestion[];
  scoringConfig: ScoringConfig;
  completionRules: {
    allRequired: boolean;
    naJustification: boolean;
    ncFindings: boolean;
    mandatoryEvidence: boolean;
  };
  createdBy: string;
  createdAt: string;
  publishedBy?: string;
  publishedAt?: string;
  basedOnVersionId?: string;
  usageCount: number;
};
export type AuditTemplate = {
  id: string;
  code: string;
  name: string;
  description: string;
  auditType: string;
  standard: string;
  owner: string;
  reviewers: string[];
  approvedBy?: string;
  currentVersionId?: string;
  status: TemplateStatus;
  versions: TemplateVersion[];
  createdAt: string;
  archivedAt?: string;
  updatedAt: string;
};
export const standards = [
  "ISO 9001:2015",
  "ISO 14001:2015",
  "ISO 45001:2018",
  "IATF 16949",
  "Internal Standard",
  "Supplier Requirement",
  "Customer Requirement",
];
const scores: Record<ResponseValue, number> = {
  conform: 100,
  minor_nc: 50,
  major_nc: 0,
  observation: 100,
  ofi: 100,
  na: 0,
};
function isoVersion(): TemplateVersion {
  const id = "TV-TMP-001-3.2";
  const questions: TemplateQuestion[] = isoChecklist.questions.map((q, i) => ({
    id: `TQ-${String(i + 1).padStart(3, "0")}`,
    sectionId: `TS-${q.sectionId.replace("SEC-", "")}`,
    code: q.code,
    number: q.clause,
    shortTitle: q.title,
    question: q.question,
    guidance: q.guidance,
    expectedEvidence: q.expectedEvidence,
    standard: isoChecklist.standard,
    clause: q.clause,
    referenceIds:
      q.clause === "6.3"
        ? [
            { id: "QP-014", name: "QMS Change Control Procedure" },
            { id: "QM-001", name: "Quality Manual" },
          ]
        : [],
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
    evidenceRule: { mode: "conditional", responses: ["minor_nc", "major_nc"] },
    findingRules: {
      minor: true,
      major: true,
      observation: false,
      ofi: "optional",
    },
    displayRule: {
      ...q.displayRule,
      conditions: q.displayRule.conditions.map((condition) => ({
        ...condition,
        questionId: `TQ-${condition.questionId.replace("Q-", "").padStart(3, "0")}`,
      })),
    },
    weight: i < 2 ? 3 : 2,
    responseScores: { ...scores },
    order: i,
  }));
  const sections: TemplateSection[] = isoChecklist.sections.map((s, i) => ({
    id: `TS-${s.number}`,
    versionId: id,
    number: s.number,
    title: s.title,
    order: i,
    weight: [10, 15, 15, 15, 25, 10, 10][i],
    questionIds: questions
      .filter((q) => q.sectionId === `TS-${s.number}`)
      .map((q) => q.id),
    description: `Audit prompts covering ${s.title.toLowerCase()}.`,
  }));
  const assigned = questions.reduce((n, q) => n + q.weight, 0);
  questions[questions.length - 1].weight += 100 - assigned;
  return {
    id,
    templateId: "TMP-001",
    version: "3.2",
    status: "Published",
    sections,
    questions,
    scoringConfig: {
      method: "weighted",
      sectionWeighting: true,
      responseScores: { ...scores },
      excludeNA: true,
    },
    completionRules: {
      allRequired: true,
      naJustification: true,
      ncFindings: true,
      mandatoryEvidence: true,
    },
    createdBy: "Rumesh Ravi",
    createdAt: "2026-08-20",
    publishedBy: "Rumesh Ravi",
    publishedAt: "2026-08-21",
    usageCount: 14,
  };
}
const main = isoVersion();
const library: [
  string,
  string,
  string,
  string,
  number,
  number,
  string,
  TemplateStatus,
  number,
  string,
][] = [
  [
    "TMP-001",
    "ISO 9001:2015 Internal Audit",
    "ISO 9001:2015",
    "Internal Audit",
    7,
    42,
    "3.2",
    "Published",
    14,
    "2026-08-21",
  ],
  [
    "TMP-002",
    "Manufacturing Process Audit",
    "Internal Standard",
    "Process Audit",
    6,
    36,
    "2.1",
    "Published",
    9,
    "2026-08-18",
  ],
  [
    "TMP-003",
    "Supplier Quality Audit",
    "Supplier Requirement",
    "Supplier Audit",
    8,
    48,
    "1.4",
    "Published",
    7,
    "2026-08-16",
  ],
  [
    "TMP-004",
    "Compliance Audit",
    "Regulatory",
    "Compliance Audit",
    5,
    31,
    "1.0",
    "Draft",
    0,
    "2026-09-02",
  ],
  [
    "TMP-005",
    "Customer Specific Audit",
    "Customer Requirement",
    "Customer Audit",
    6,
    28,
    "2.0",
    "Published",
    4,
    "2026-08-12",
  ],
  [
    "TMP-006",
    "Environmental System Audit",
    "ISO 14001:2015",
    "System Audit",
    7,
    39,
    "1.2",
    "Published",
    6,
    "2026-08-08",
  ],
  [
    "TMP-007",
    "Safety Management Audit",
    "ISO 45001:2018",
    "Compliance Audit",
    8,
    44,
    "1.1",
    "Draft",
    0,
    "2026-09-05",
  ],
  [
    "TMP-008",
    "Automotive Process Audit",
    "IATF 16949",
    "Process Audit",
    9,
    52,
    "2.4",
    "Published",
    5,
    "2026-07-29",
  ],
  [
    "TMP-009",
    "Warehouse Controls Checklist",
    "Internal Standard",
    "Process Audit",
    5,
    25,
    "1.0",
    "Archived",
    3,
    "2026-06-10",
  ],
  [
    "TMP-010",
    "Training Competence Review",
    "Internal Standard",
    "Internal Audit",
    4,
    22,
    "1.1",
    "Draft",
    0,
    "2026-09-06",
  ],
  [
    "TMP-011",
    "Maintenance Control Audit",
    "Internal Standard",
    "Process Audit",
    6,
    34,
    "1.3",
    "Published",
    8,
    "2026-08-03",
  ],
  [
    "TMP-012",
    "Legacy Supplier Checklist",
    "Supplier Requirement",
    "Supplier Audit",
    7,
    41,
    "2.0",
    "Archived",
    11,
    "2026-05-18",
  ],
];
export const templateSeed: AuditTemplate[] = library.map(
  ([
    id,
    name,
    standard,
    auditType,
    sectionCount,
    questionCount,
    version,
    status,
    usage,
    updated,
  ]) => {
    if (id === "TMP-001")
      return {
        id,
        code: id,
        name,
        description:
          "Standardized internal audit checklist for evaluating the Quality Management System.",
        auditType,
        standard,
        owner: "Rumesh Ravi",
        reviewers: ["Lakshman"],
        approvedBy: "Lakshman",
        currentVersionId: main.id,
        status,
        versions: [
          main,
          {
            ...main,
            id: "TV-TMP-001-3.1",
            version: "3.1",
            status: "Superseded",
            usageCount: 8,
            publishedAt: "2026-06-14",
          },
          {
            ...main,
            id: "TV-TMP-001-3.0",
            version: "3.0",
            status: "Superseded",
            usageCount: 5,
            publishedAt: "2026-03-10",
          },
        ],
        createdAt: "2026-01-12",
        updatedAt: updated,
      };
    const baseQuestions = main.questions
      .slice(0, questionCount)
      .map((q, i) => ({
        ...q,
        id: `TQ-${id}-${i + 1}`,
        sectionId: `TS-${id}-${i % sectionCount}`,
        order: i,
      }));
    const sections = Array.from({ length: sectionCount }, (_, i) => ({
      id: `TS-${id}-${i}`,
      versionId: `TV-${id}-${version}`,
      number: String(i + 1),
      title: `${name} Section ${i + 1}`,
      order: i,
      weight: Math.round(100 / sectionCount),
      questionIds: baseQuestions
        .filter((q) => q.sectionId === `TS-${id}-${i}`)
        .map((q) => q.id),
    }));
    const v: TemplateVersion = {
      ...main,
      id: `TV-${id}-${version}`,
      templateId: id,
      version,
      status,
      sections,
      questions: baseQuestions,
      usageCount: usage,
      publishedAt: status === "Published" ? updated : undefined,
    };
    return {
      id,
      code: id,
      name,
      description: `Reusable ${auditType.toLowerCase()} checklist.`,
      auditType,
      standard,
      owner: id === "TMP-007" ? "Lakshman" : "Rumesh Ravi",
      reviewers: ["Lakshman"],
      currentVersionId: status === "Published" ? v.id : undefined,
      status,
      versions: [v],
      createdAt: "2026-02-01",
      updatedAt: updated,
      archivedAt: status === "Archived" ? updated : undefined,
    };
  },
);
export function currentVersion(template: AuditTemplate) {
  return (
    template.versions.find((v) => v.id === template.currentVersionId) ??
    template.versions.find((v) => v.status === "Draft") ??
    template.versions[0]
  );
}
