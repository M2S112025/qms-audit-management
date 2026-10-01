import {
  LayoutDashboard,
  CalendarRange,
  ClipboardCheck,
  TriangleAlert,
  ListChecks,
  Files,
  ChartNoAxesCombined,
  Settings,
  CircleHelp,
} from "lucide-react";
export const nav = [
  { group: "OVERVIEW", items: [["Dashboard", "/", LayoutDashboard]] },
  {
    group: "AUDIT MANAGEMENT",
    items: [
      ["Audit Program", "/audit-program", CalendarRange],
      ["Audits", "/audits", ClipboardCheck],
      ["Findings", "/findings", TriangleAlert],
      ["Corrective Actions", "/actions", ListChecks],
      ["Audit Templates", "/audit-templates", Files],
    ],
  },
  { group: "ANALYTICS", items: [["Reports", "/reports", ChartNoAxesCombined]] },
  { group: "SYSTEM", items: [["Administration", "/administration", Settings]] },
] as const;
export { CircleHelp };
