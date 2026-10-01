import type { AuditStatus } from "@/data/audits";

export function auditStatusLabel(status: AuditStatus) {
  return status === "Awaiting Closure" ? "Review & Report" : status;
}

export function StatusIndicator({ status }: { status: AuditStatus }) {
  return (
    <span
      className={`status status-${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      <i />
      {auditStatusLabel(status)}
    </span>
  );
}

export function PriorityIndicator({
  priority,
}: {
  priority: "High" | "Medium" | "Low";
}) {
  return (
    <span className={`priority priority-${priority.toLowerCase()}`}>
      {priority}
    </span>
  );
}
