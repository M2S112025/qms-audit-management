"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { activeActionStatuses } from "@/data/actions";
import { useActions } from "@/lib/action-store";
import { useFindings } from "@/lib/finding-store";
import { ActionQueue } from "./action-queue";
import { ActionDetail } from "./action-detail";
import { NewActionDrawer } from "./action-drawers";
import { isOverdue } from "@/lib/date";
export function CorrectiveActionsWorkspace({
  initialId,
}: {
  initialId?: string;
}) {
  const actions = useActions();
  const findings = useFindings();
  const router = useRouter();
  const search = useSearchParams();
  const [selected, setSelected] = useState(
    initialId ?? search.get("record") ?? undefined,
  );
  const [user, setUser] = useState("Rumesh Ravi");
  const [creating, setCreating] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(
    !!(initialId ?? search.get("record")),
  );
  useEffect(() => {
    if (initialId) {
      setSelected(initialId);
      setMobileDetail(true);
    }
  }, [initialId]);
  useEffect(() => {
    if (!mobileDetail) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileDetail(false);
        setSelected(undefined);
        router.replace("/actions", { scroll: false });
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileDetail, router]);
  const action = selected ? actions.find((a) => a.id === selected) : undefined;
  function closeDetail() {
    setMobileDetail(false);
    setSelected(undefined);
    router.replace("/actions", { scroll: false });
  }
  function select(id: string) {
    setSelected(id);
    setMobileDetail(true);
    router.replace(`/actions/${id}`, { scroll: false });
  }
  const open = actions.filter((a) =>
    activeActionStatuses.includes(a.status),
  ).length;
  const mine = actions.filter(
    (a) => a.owner === user && activeActionStatuses.includes(a.status),
  ).length;
  const overdue = actions.filter(
    (a) => isOverdue(a.dueDate) && activeActionStatuses.includes(a.status),
  ).length;
  const awaiting = actions.filter(
    (a) => a.status === "Awaiting Verification",
  ).length;
  const completed = actions.filter(
    (a) => a.status === "Completed" && a.completedAt?.startsWith("2026-09"),
  ).length;
  return (
    <AppShell>
      <div className="page actions-page">
        <div className="page-heading actions-heading">
          <div>
            <p className="eyebrow">ACTION MANAGEMENT</p>
            <h1>Corrective Actions</h1>
            <p>
              Manage, complete and verify corrective actions raised from audit
              findings.
            </p>
          </div>
          <div className="actions-heading-controls">
            <label>
              <span>Demo perspective</span>
              <select value={user} onChange={(e) => setUser(e.target.value)}>
                {[
                  ["Rumesh Ravi", "Audit Manager"],
                  ["Lakshman", "Lead Auditor"],
                  ["Siva Kumar", "Action Owner"],
                  ["Manoj", "Action Owner"],
                  ["Anand", "Auditor"],
                ].map(([name, role]) => (
                  <option value={name} key={name}>
                    {name} · {role}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              onClick={() => setCreating(true)}
            >
              <Plus size={15} />
              New Action
            </button>
          </div>
        </div>
        <div className="action-summary-strip">
          <Summary value={open} label="Open" />
          <Summary value={mine} label="My Actions" />
          <Summary value={overdue} label="Overdue" danger />
          <Summary value={awaiting} label="Awaiting Verification" />
          <Summary value={completed} label="Completed This Month" />
        </div>
        <div
          className={`actions-workspace ${mobileDetail ? "show-action-detail" : ""}`}
        >
          <ActionQueue
            actions={actions}
            selected={mobileDetail ? action?.id : undefined}
            user={user}
            onSelect={select}
          />
          {mobileDetail && action && (
            <button
              className="action-detail-scrim"
              aria-label="Close corrective action details"
              onClick={closeDetail}
            />
          )}
          {mobileDetail && action ? (
            <ActionDetail
              action={action}
              actions={actions}
              finding={findings.find((f) => f.id === action.findingId)}
              findings={findings}
              user={user}
              onBack={closeDetail}
            />
          ) : null}
        </div>
        {creating && (
          <NewActionDrawer
            actions={actions}
            findings={findings}
            onClose={() => setCreating(false)}
            onCreated={(id) => {
              setCreating(false);
              select(id);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
function Summary({
  value,
  label,
  danger,
}: {
  value: number;
  label: string;
  danger?: boolean;
}) {
  return (
    <div className={danger ? "danger" : ""}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
