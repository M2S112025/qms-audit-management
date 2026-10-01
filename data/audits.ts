import type { RecurrenceFrequency } from "./recurrences";

export type AuditStatus =
  | "Draft"
  | "Planned"
  | "Ready"
  | "In Progress"
  | "Review & Report"
  | "Awaiting Closure"
  | "Completed"
  | "Overdue"
  | "Cancelled";
export type Audit = {
  id: string;
  title: string;
  type: string;
  location: string;
  businessLineId?: string;
  department: string;
  process?: string;
  lead: string;
  plannedDate: string;
  dateRange: string;
  status: AuditStatus;
  score?: number;
  year: number;
  programId?: string;
  framework?: string;
  description?: string;
  objective?: string;
  scope?: string;
  criteria?: string;
  reference?: string;
  auditee?: string;
  supplier?: string;
  startTime?: string;
  endTime?: string;
  team?: string[];
  template?: string;
  templateId?: string;
  templateVersionId?: string;
  recurrenceSeriesId?: string;
  recurrenceIndex?: number;
  recurrenceFrequency?: RecurrenceFrequency;
  review?: AuditReview;
  completedBy?: string;
  completedAt?: string;
};

export type AuditReviewOutcome = "Satisfactory" | "Satisfactory with Follow-up" | "Needs Improvement" | "Unsatisfactory";
export type AuditReview = {
  outcome: AuditReviewOutcome;
  conclusion: string;
  recommendations?: string;
  reviewedBy: string;
  reviewedAt: string;
  reviewAcknowledged: boolean;
  openItemsAcknowledged?: boolean;
};

export const audits: Audit[] = [
  {
    id: "AUD-2026-026",
    title: "Internal QMS Audit",
    type: "Internal Audit",
    location: "Chennai Plant",
    businessLineId: "BL-AUTOMOTIVE",
    department: "Quality",
    process: "Incoming Inspection",
    lead: "Lakshman",
    plannedDate: "Sep 08, 2026",
    dateRange: "Sep 08 – Sep 10",
    status: "In Progress",
    score: 82,
    year: 2026,
    programId: "PRG-2026-001",
    framework: "ISO 9001:2015",
    description: "Internal assessment of the Quality Management System.",
    objective:
      "Verify conformity of the Quality Management System against ISO 9001:2015.",
    scope: "Quality department processes, records and supporting activities.",
    criteria: "ISO 9001:2015",
    reference: "Quality Manual QM-001 · Internal Procedure QP-014",
    auditee: "Siva Kumar",
    startTime: "09:00",
    endTime: "17:00",
    team: ["Rumesh Ravi", "Manoj"],
    template: "ISO 9001:2015 Internal Audit",
    templateId: "TMP-001",
    templateVersionId: "TV-TMP-001-3.2",
    recurrenceFrequency: "one_time",
  },
  {
    id: "AUD-2026-027",
    title: "Production Process Audit",
    type: "Process Audit",
    location: "Chennai Plant",
    department: "Production",
    lead: "Rumesh",
    plannedDate: "Sep 12, 2026",
    dateRange: "Sep 12",
    status: "Planned",
    year: 2026,
  },
  {
    id: "AUD-2026-028",
    title: "Supplier Quality Audit",
    type: "Supplier Audit",
    location: "Hosur Plant",
    department: "Supplier Quality",
    lead: "Manoj",
    plannedDate: "Sep 16, 2026",
    dateRange: "Sep 16",
    status: "Planned",
    year: 2026,
  },
  {
    id: "AUD-2026-029",
    title: "Maintenance Process Audit",
    type: "Process Audit",
    location: "Pune Plant",
    department: "Maintenance",
    lead: "Anand",
    plannedDate: "Sep 18, 2026",
    dateRange: "Sep 18",
    status: "Planned",
    year: 2026,
  },
  {
    id: "AUD-2026-030",
    title: "Compliance Audit",
    type: "Compliance Audit",
    location: "Hosur Plant",
    department: "Quality",
    lead: "Lakshman",
    plannedDate: "Sep 21, 2026",
    dateRange: "Sep 21",
    status: "Planned",
    year: 2026,
  },
  {
    id: "AUD-2026-025",
    title: "Warehouse Controls Audit",
    type: "System Audit",
    location: "Pune Plant",
    department: "Warehouse",
    lead: "Siva Kumar",
    plannedDate: "Aug 28, 2026",
    dateRange: "Aug 28",
    status: "Completed",
    score: 91,
    year: 2026,
  },
  {
    id: "AUD-2026-024",
    title: "Engineering Change Audit",
    type: "Process Audit",
    location: "Chennai Plant",
    department: "Engineering",
    lead: "Anand",
    plannedDate: "Aug 25, 2026",
    dateRange: "Aug 25 – Aug 27",
    status: "Overdue",
    score: 74,
    year: 2026,
  },
  {
    id: "AUD-2026-023",
    title: "Customer Requirements Audit",
    type: "Customer Audit",
    location: "Hosur Plant",
    department: "Quality",
    lead: "Rumesh",
    plannedDate: "Aug 18, 2026",
    dateRange: "Aug 18",
    status: "Completed",
    score: 88,
    year: 2026,
  },
  {
    id: "AUD-2026-022",
    title: "Training Records Audit",
    type: "Internal Audit",
    location: "Pune Plant",
    department: "HR",
    lead: "Manoj",
    plannedDate: "Aug 12, 2026",
    dateRange: "Aug 12",
    status: "Cancelled",
    year: 2026,
  },
  {
    id: "AUD-2026-021",
    title: "Warehouse Process Audit",
    type: "Process Audit",
    location: "Chennai Plant",
    department: "Warehouse",
    lead: "Siva Kumar",
    plannedDate: "Aug 04, 2026",
    dateRange: "Aug 04",
    status: "Overdue",
    score: 69,
    year: 2026,
  },
  {
    id: "AUD-2026-020",
    title: "Document Control Audit",
    type: "System Audit",
    location: "Hosur Plant",
    department: "Quality",
    lead: "Lakshman",
    plannedDate: "Jul 22, 2026",
    dateRange: "Jul 22 – Jul 23",
    status: "Completed",
    score: 87,
    year: 2026,
  },
  {
    id: "AUD-2026-019",
    title: "Preventive Maintenance Audit",
    type: "Process Audit",
    location: "Pune Plant",
    department: "Maintenance",
    lead: "Anand",
    plannedDate: "Jul 10, 2026",
    dateRange: "Jul 10",
    status: "Completed",
    score: 85,
    year: 2026,
  },
  {
    id: "AUD-2026-018",
    title: "Supplier Incoming Inspection",
    type: "Supplier Audit",
    location: "Hosur Plant",
    department: "Supplier Quality",
    lead: "Manoj",
    plannedDate: "Jun 19, 2026",
    dateRange: "Jun 19 – Jun 20",
    status: "Completed",
    score: 90,
    year: 2026,
  },
  {
    id: "AUD-2026-017",
    title: "Production Line Compliance",
    type: "Compliance Audit",
    location: "Chennai Plant",
    department: "Production",
    lead: "Rumesh",
    plannedDate: "May 14, 2026",
    dateRange: "May 14",
    status: "Completed",
    score: 86,
    year: 2026,
  },
  {
    id: "AUD-2026-016",
    title: "Engineering Design Controls",
    type: "Internal Audit",
    location: "Pune Plant",
    department: "Engineering",
    lead: "Siva Kumar",
    plannedDate: "Apr 17, 2026",
    dateRange: "Apr 17",
    status: "Planned",
    year: 2026,
  },
  {
    id: "AUD-2025-041",
    title: "Annual QMS Review",
    type: "System Audit",
    location: "Chennai Plant",
    department: "Quality",
    lead: "Lakshman",
    plannedDate: "Dec 12, 2025",
    dateRange: "Dec 12",
    status: "Completed",
    score: 84,
    year: 2025,
  },
  ...[
    ["AUD-2027-001", "Jan 15, 2027", "Jan 15"],
    ["AUD-2027-002", "Apr 15, 2027", "Apr 15"],
    ["AUD-2027-003", "Jul 15, 2027", "Jul 15"],
    ["AUD-2027-004", "Oct 15, 2027", "Oct 15"],
  ].map(([id, plannedDate, dateRange], recurrenceIndex) => ({
    id,
    title: "Quarterly Supplier Quality Review",
    type: "Supplier Audit",
    location: "Chennai Plant",
    businessLineId: "BL-INDUSTRIAL",
    department: "Supplier Quality",
    process: "Supplier Performance Review",
    lead: "Manoj",
    plannedDate,
    dateRange,
    status: "Planned" as const,
    year: 2027,
    programId: "PRG-2027-001",
    framework: "ISO 9001:2015",
    recurrenceSeriesId: "REC-2027-001",
    recurrenceIndex,
    recurrenceFrequency: "quarterly" as const,
    template: "Supplier Quality Audit",
    templateId: "TMP-003",
  })),
];
export const locations = ["Chennai Plant", "Hosur Plant", "Pune Plant"];
export const departments = [
  "Quality",
  "Production",
  "Maintenance",
  "Warehouse",
  "Engineering",
  "HR",
  "Supplier Quality",
];
export const auditTypes = [
  "Internal Audit",
  "Process Audit",
  "Supplier Audit",
  "System Audit",
  "Compliance Audit",
  "Customer Audit",
];
