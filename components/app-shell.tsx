"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useOverlayFocus } from "@/lib/use-overlay-focus";
import { nav, CircleHelp } from "./icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  useOverlayFocus();
  const path = usePathname();
  const [mobile, setMobile] = useState(false);
  const [profile, setProfile] = useState(false);
  useEffect(() => setMobile(false), [path]);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "sidebar-open" : ""}`}>
        <div className="brand">
          <button
            className="product-context"
            type="button"
            aria-label="Current QMS application: Audit Management"
          >
            <span className="brand-mark">Q</span>
            <span className="product-copy">
              <b>QMS</b>
              <small>Audit Management</small>
            </span>
            <ChevronDown className="product-chevron" size={14} />
          </button>
          <button
            className="mobile-close"
            onClick={() => setMobile(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <nav>
          {nav.map((section) => (
            <div className="nav-group" key={section.group}>
              <p>{section.group}</p>
              {section.items.map(([label, href, Icon]) => (
                <Link
                  key={href}
                  href={href}
                  className={
                    (href === "/" ? path === href : path.startsWith(href))
                      ? "active"
                      : ""
                  }
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/help">
            <CircleHelp size={17} />
            <span>Help &amp; Support</span>
          </Link>
          <button className="profile" onClick={() => setProfile(!profile)}>
            <span className="avatar">RR</span>
            <span>
              <b>Rumesh Ravi</b>
              <small>Audit Manager</small>
            </span>
            <ChevronDown size={15} />
          </button>
          {profile && (
            <div className="profile-menu">
              <button>Profile settings</button>
              <button>Sign out</button>
            </div>
          )}
        </div>
      </aside>
      {mobile && (
        <button
          className="scrim"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setMobile(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <span>Audit Management</span>
            <b>/</b>
            <strong>
              {path === "/"
                ? "Dashboard"
                : path.split("/").filter(Boolean).pop()?.replaceAll("-", " ")}
            </strong>
          </div>
          <div className="header-actions">
            <label className="global-search">
              <Search size={16} />
              <input placeholder="Search QMS" aria-label="Global search" />
              <kbd>⌘K</kbd>
            </label>
            <button
              aria-label="Notifications"
              className="icon-button has-alert"
            >
              <Bell size={18} />
            </button>
            <Link href="/help" className="icon-button" aria-label="Help">
              <CircleHelp size={18} />
            </Link>
            <span className="avatar header-avatar">RR</span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
