"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useFindings } from "@/lib/finding-store";
import { FindingListPane } from "./finding-list";
import { FindingContextPane, FindingDetailPane } from "./finding-detail";
import { NewFindingDrawer } from "./finding-panels";

export function FindingsWorkspace({ initialId }: { initialId?: string }) {
  const items = useFindings();
  const router = useRouter();
  const search = useSearchParams();
  const [selected, setSelected] = useState(
    initialId ?? search.get("record") ?? undefined,
  );
  const [user, setUser] = useState("Rumesh Ravi");
  const [newFinding, setNewFinding] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(
    !!(initialId ?? search.get("record")),
  );
  const [context, setContext] = useState(false);
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
        setContext(false);
        router.replace("/findings", { scroll: false });
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileDetail, router]);
  const finding = selected ? items.find((f) => f.id === selected) : undefined;
  function closeDetail() {
    setMobileDetail(false);
    setSelected(undefined);
    setContext(false);
    router.replace("/findings", { scroll: false });
  }
  function select(id: string) {
    setSelected(id);
    setMobileDetail(true);
    router.replace(`/findings/${id}`, { scroll: false });
  }
  return (
    <AppShell>
      <div className="page findings-page">
        <div className="page-heading findings-heading">
          <div>
            <p className="eyebrow">AUDIT FINDINGS</p>
            <h1>Findings</h1>
            <p>
              Review, respond to and close audit findings across the
              organization.
            </p>
          </div>
          <div className="findings-heading-actions">
            <label>
              <span>Acting as</span>
              <select value={user} onChange={(e) => setUser(e.target.value)}>
                {[
                  ["Rumesh Ravi", "Audit Manager"],
                  ["Lakshman", "Lead Auditor"],
                  ["Siva Kumar", "Responsible Person"],
                  ["Manoj", "Auditor / Action Owner"],
                  ["Anand", "Auditor"],
                ].map(([name, role]) => (
                  <option key={name} value={name}>
                    {name} · {role}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              onClick={() => setNewFinding(true)}
            >
              <Plus size={15} />
              New Finding
            </button>
          </div>
        </div>
        <div
          className={`findings-workspace ${mobileDetail ? "show-mobile-detail" : ""}`}
        >
          <FindingListPane
            items={items}
            selected={mobileDetail ? finding?.id : undefined}
            onSelect={select}
            currentUser={user}
          />
          {mobileDetail && finding && (
            <button
              className="finding-detail-scrim"
              aria-label="Close finding details"
              onClick={closeDetail}
            />
          )}
          {mobileDetail && finding ? (
            <FindingDetailPane
              finding={finding}
              currentUser={user}
              onBack={closeDetail}
              onContext={() => setContext(true)}
            />
          ) : null}
          {mobileDetail && finding && (
            <div className={context ? "finding-context-open" : ""}>
              <FindingContextPane
                finding={finding}
                onClose={() => setContext(false)}
              />
            </div>
          )}
        </div>
        {newFinding && (
          <NewFindingDrawer
            items={items}
            onClose={() => setNewFinding(false)}
            onCreated={(id) => {
              setNewFinding(false);
              select(id);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
