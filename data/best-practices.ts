export type BestPracticeRecommendation =
  | "Local Practice"
  | "Share Across Location"
  | "Share Across Organization";

export type BestPracticeEvidence = {
  id: string;
  name: string;
  type: "Photo" | "Document" | "Link";
  recordReference?: string;
};

export type BestPractice = {
  id: string;
  auditId: string;
  questionId?: string;
  title: string;
  description: string;
  clause?: string;
  location: string;
  businessLineId?: string;
  department?: string;
  recordReference?: string;
  evidence: BestPracticeEvidence[];
  recommendedFor?: BestPracticeRecommendation;
  createdBy: string;
  createdAt: string;
};

export const bestPracticeSeed: BestPractice[] = [
  {
    id: "BP-2026-001",
    auditId: "AUD-2026-026",
    questionId: "TQ-023",
    title: "Strong calibration-status visual management",
    description:
      "Calibration status and due-date identification was clearly visible at point of use and consistently understood by operators.",
    clause: "7.1.5",
    location: "Chennai Plant",
    businessLineId: "BL-AUTOMOTIVE",
    department: "Quality",
    recordReference: "CAL-2026-0291",
    evidence: [
      {
        id: "BPE-2026-001",
        name: "Calibration_Status_Board.jpg",
        type: "Photo",
        recordReference: "CAL-2026-0291",
      },
    ],
    recommendedFor: "Share Across Organization",
    createdBy: "Lakshman",
    createdAt: "2026-09-08T15:24:00",
  },
  {
    id: "BP-2026-002",
    auditId: "AUD-2026-026",
    questionId: "TQ-019",
    title: "Operator-led competency verification",
    description:
      "Team leaders used a concise competency matrix at the work area and could clearly explain qualification gaps and planned evaluations.",
    clause: "7.2",
    location: "Chennai Plant",
    businessLineId: "BL-AUTOMOTIVE",
    department: "Quality",
    recordReference: "TRN-2026-118",
    evidence: [],
    recommendedFor: "Share Across Location",
    createdBy: "Lakshman",
    createdAt: "2026-09-08T15:42:00",
  },
];
