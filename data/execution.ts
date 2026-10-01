export type ResponseValue =
  | "conform"
  | "minor_nc"
  | "major_nc"
  | "observation"
  | "ofi"
  | "na";

export type QuestionDisplayCondition = {
  questionId: string;
  operator: "equals" | "does_not_equal" | "is_one_of";
  values: ResponseValue[];
};

export type QuestionDisplayRule = {
  mode: "always" | "conditional";
  match: "all" | "any";
  conditions: QuestionDisplayCondition[];
};

export type AuditQuestion = {
  id: string;
  sectionId: string;
  code: string;
  number: number;
  clause: string;
  title: string;
  question: string;
  guidance: string;
  expectedEvidence: string;
  required: boolean;
  requireNote?: boolean;
  allowedResponses?: ResponseValue[];
  naRequireJustification?: boolean;
  evidenceRule?: {
    mode: "optional" | "required" | "conditional";
    responses: ResponseValue[];
  };
  findingRules?: {
    minor: boolean;
    major: boolean;
    observation: boolean;
    ofi: "required" | "optional" | "none";
  };
  displayRule: QuestionDisplayRule;
  weight?: number;
  responseScores?: Record<ResponseValue, number>;
};
export type ChecklistSection = {
  id: string;
  number: string;
  title: string;
  questionIds: string[];
};
export type AuditChecklist = {
  id: string;
  name: string;
  standard: string;
  versionId?: string;
  version?: string;
  sections: ChecklistSection[];
  questions: AuditQuestion[];
};
export type QuestionEvidence = {
  id: string;
  questionId: string;
  name: string;
  kind: "Photo" | "Document" | "Link";
  size?: string;
  recordReference?: string;
  uploadedBy: string;
  date: string;
};
export type ExecutionFinding = {
  id: string;
  auditId: string;
  questionId: string;
  clause: string;
  type:
    | "Major Nonconformity"
    | "Minor Nonconformity"
    | "Observation"
    | "Opportunity for Improvement";
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: string;
};
export type AuditResponse = {
  auditId: string;
  questionId: string;
  response?: ResponseValue;
  notes: string;
  evidenceIds: string[];
  findingIds: string[];
  flagged: boolean;
  naReason: string;
  answeredBy?: string;
  answeredAt?: string;
};
export type ExecutionActivity = {
  id: string;
  date: string;
  actor: string;
  action: string;
};
export type AuditExecutionState = {
  auditId: string;
  checklist: AuditChecklist;
  currentQuestionId: string;
  responses: Record<string, AuditResponse>;
  evidence: QuestionEvidence[];
  findings: ExecutionFinding[];
  activity: ExecutionActivity[];
  completed: boolean;
};

const specs = [
  [
    "4",
    "Context of Organization",
    [
      "Business environment",
      "Interested parties",
      "QMS boundaries",
      "Process interactions",
      "Strategic alignment",
      "Context review",
    ],
  ],
  [
    "5",
    "Leadership",
    [
      "Leadership commitment",
      "Customer focus",
      "Quality policy",
      "Roles and responsibilities",
      "Management accountability",
    ],
  ],
  [
    "6",
    "Planning",
    [
      "Risks & Opportunities",
      "Quality Objectives",
      "Planning Changes",
      "Resource Planning",
      "Risk Review",
      "Planning Documentation",
    ],
  ],
  [
    "7",
    "Support",
    [
      "Resource availability",
      "People competence",
      "Awareness",
      "Communication",
      "Documented Information",
      "Monitoring resources",
      "Organizational knowledge",
      "Support review",
    ],
  ],
  [
    "8",
    "Operation",
    [
      "Operational planning",
      "Customer requirements",
      "Design controls",
      "External providers",
      "Production controls",
      "Release of outputs",
      "Nonconforming outputs",
      "Operational change",
    ],
  ],
  [
    "9",
    "Performance Evaluation",
    [
      "Monitoring and measurement",
      "Customer feedback",
      "Analysis and evaluation",
      "Internal audit",
      "Management review",
    ],
  ],
  [
    "10",
    "Improvement",
    [
      "Improvement opportunities",
      "Nonconformity response",
      "Continual improvement",
      "Effectiveness review",
    ],
  ],
] as const;
const allResponses: ResponseValue[] = [
  "conform",
  "minor_nc",
  "major_nc",
  "observation",
  "ofi",
  "na",
];
const defaultScores: Record<ResponseValue, number> = {
  conform: 100,
  minor_nc: 50,
  major_nc: 0,
  observation: 100,
  ofi: 100,
  na: 0,
};
let ordinal = 0;
const sections: ChecklistSection[] = [];
const questions: AuditQuestion[] = [];
for (const [number, title, items] of specs) {
  const sectionId = `SEC-${number}`;
  const ids: string[] = [];
  items.forEach((item, index) => {
    ordinal++;
    const id = `Q-${String(ordinal).padStart(2, "0")}`;
    ids.push(id);
    const clause =
      item === "Monitoring resources" ? "7.1.5" : `${number}.${index + 1}`;
    questions.push({
      id,
      sectionId,
      code: `QMS-${clause}-${String(index + 1).padStart(3, "0")}`,
      number: ordinal,
      clause,
      title: clause === "8.5" ? "Supplier control follow-up" : item,
      question:
        clause === "8.5"
          ? "What follow-up action was taken for the supplier-control opportunity or nonconformity identified above?"
          : `How does the organization ensure that ${item.toLowerCase()} is planned, consistently applied and supported by appropriate objective evidence?`,
      guidance:
        clause === "8.5"
          ? "Review the containment, supplier communication and planned follow-up for the applicable response."
          : `Review objective evidence showing how ${item.toLowerCase()} is defined, applied and periodically evaluated. Consider responsibilities, available resources and retained records.`,
      expectedEvidence:
        clause === "7.1.5"
          ? "Calibration certificates\nEquipment calibration register\nCalibration labels\nTraceability records"
          : clause === "7.2"
            ? "Training records\nCompetency matrix\nEvaluation records"
            : clause === "7.5"
              ? "Approved procedure\nRevision history\nDistribution record"
              : "Approved procedures\nCurrent records\nRelevant interviews",
      required: true,
      allowedResponses: [...allResponses],
      naRequireJustification: true,
      evidenceRule: {
        mode: "conditional",
        responses: ["minor_nc", "major_nc"],
      },
      findingRules: {
        minor: true,
        major: true,
        observation: false,
        ofi: "optional",
      },
      displayRule:
        clause === "8.5"
          ? {
              mode: "conditional",
              match: "any",
              conditions: [
                {
                  questionId: "Q-29",
                  operator: "is_one_of",
                  values: ["minor_nc", "major_nc", "ofi"],
                },
              ],
            }
          : { mode: "always", match: "all", conditions: [] },
      weight: 2,
      responseScores: { ...defaultScores },
    });
  });
  sections.push({ id: sectionId, number, title, questionIds: ids });
}

export const isoChecklist: AuditChecklist = {
  id: "TMP-001",
  name: "ISO 9001:2015 Internal Audit",
  standard: "ISO 9001:2015",
  versionId: "TV-TMP-001-3.2",
  version: "3.2",
  sections,
  questions,
};
export const responseLabels: Record<ResponseValue, string> = {
  conform: "Conform",
  minor_nc: "Minor NC",
  major_nc: "Major NC",
  observation: "Observation",
  ofi: "OFI",
  na: "N/A",
};
export const responseClass: Record<ResponseValue, string> = {
  conform: "conform",
  minor_nc: "minor",
  major_nc: "major",
  observation: "observation",
  ofi: "ofi",
  na: "na",
};

export function createSeedExecution(
  auditId: string,
  checklist = isoChecklist,
): AuditExecutionState {
  const responses: Record<string, AuditResponse> = {};
  const historical = auditId === "AUD-2026-026";
  checklist.questions.forEach((q, index) => {
    let response: ResponseValue | undefined;
    if (historical) {
      if (index < 21) response = "conform";
      else if (index < 24) response = "minor_nc";
      else if (index === 24) response = "major_nc";
      else if (index < 29) response = "observation";
    }
    responses[q.id] = {
      auditId,
      questionId: q.id,
      response,
      notes: response ? `Evidence reviewed for ${q.title.toLowerCase()}.` : "",
      evidenceIds: [],
      findingIds:
        historical && index >= 21 && index <= 24
          ? [`FND-2026-${String(31 + index - 21).padStart(3, "0")}`]
          : [],
      flagged: historical && (index === 26 || index === 31),
      naReason: "",
      answeredBy: response ? "Lakshman" : undefined,
      answeredAt: response ? "2026-09-08T10:42:00" : undefined,
    };
  });
  const findings: ExecutionFinding[] = historical
    ? [21, 22, 23, 24]
        .filter((index) => checklist.questions[index])
        .map((index, i) => {
          const q = checklist.questions[index];
          return {
            id: `FND-2026-${String(31 + i).padStart(3, "0")}`,
            auditId,
            questionId: q.id,
            clause: q.clause,
            type:
              i === 3
                ? "Major Nonconformity"
                : i === 2
                  ? "Observation"
                  : "Minor Nonconformity",
            title: `${q.title} requires corrective review`,
            description: `Objective evidence for ${q.title.toLowerCase()} did not fully meet the audit criteria.`,
            owner: i % 2 ? "Manoj" : "Siva Kumar",
            dueDate: "2026-09-18",
            priority: i === 3 ? "High" : "Medium",
            status: "Open",
          };
        })
    : [];
  return {
    auditId,
    checklist,
    currentQuestionId:
      historical && checklist.questions[16]
        ? checklist.questions[16].id
        : (checklist.questions[0]?.id ?? ""),
    responses,
    evidence: [],
    findings,
    activity: [
      {
        id: "EA-1",
        date: "Sep 08 · 10:42 AM",
        actor: "Lakshman",
        action: "started the audit.",
      },
    ],
    completed: false,
  };
}

export function executionScore(state: AuditExecutionState) {
  let earned = 0;
  let possible = 0;
  for (const question of state.checklist.questions) {
    if (!isQuestionApplicable(question, state.responses)) continue;
    const response = state.responses[question.id]?.response;
    if (!response || response === "na") continue;
    const weight = question.weight ?? 1;
    possible += weight;
    earned +=
      weight *
      ((question.responseScores?.[response] ?? defaultScores[response]) / 100);
  }
  return possible ? Math.round((earned / possible) * 100) : undefined;
}

export function isQuestionApplicable(
  question: AuditQuestion,
  responses: AuditExecutionState["responses"],
) {
  const rule = question.displayRule ?? {
    mode: "always" as const,
    match: "all" as const,
    conditions: [],
  };
  if (rule.mode === "always" || !rule.conditions.length) return true;
  const results = rule.conditions.map((condition) => {
    const value = responses[condition.questionId]?.response;
    if (condition.operator === "does_not_equal")
      return !!value && !condition.values.includes(value);
    if (condition.operator === "is_one_of")
      return !!value && condition.values.includes(value);
    return !!value && value === condition.values[0];
  });
  return rule.match === "all" ? results.every(Boolean) : results.some(Boolean);
}

export function applicableQuestions(state: AuditExecutionState) {
  return state.checklist.questions.filter((question) =>
    isQuestionApplicable(question, state.responses),
  );
}

export type CompletionIssue={questionId:string;code:string;message:string};
export function executionCompletionIssues(state:AuditExecutionState):CompletionIssue[]{
  const issues:CompletionIssue[]=[];
  for(const question of applicableQuestions(state)){
    const response=state.responses[question.id];
    if(question.required&&!response?.response)issues.push({questionId:question.id,code:question.code,message:'Response required.'});
    if(response?.response==='na'&&question.naRequireJustification&&!response.naReason.trim())issues.push({questionId:question.id,code:question.code,message:'N/A justification is required.'});
    const evidenceRequired=question.evidenceRule?.mode==='required'||(question.evidenceRule?.mode==='conditional'&&!!response?.response&&question.evidenceRule.responses.includes(response.response));
    if(evidenceRequired&&!response?.evidenceIds.length)issues.push({questionId:question.id,code:question.code,message:'Evidence is required.'});
    const findingRequired=response?.response==='major_nc'?question.findingRules?.major:response?.response==='minor_nc'?question.findingRules?.minor:false;
    if(findingRequired&&!response?.findingIds.length)issues.push({questionId:question.id,code:question.code,message:`Finding is required for ${response?.response==='major_nc'?'Major NC':'Minor NC'}.`});
  }
  return issues;
}
