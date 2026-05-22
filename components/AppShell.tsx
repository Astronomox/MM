"use client";
// components/AppShell.tsx — sidebar + topbar layout for all dashboard pages

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark, Avatar, Progress, Eyebrow } from "./ui";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { id: "dashboard", label: "Overview",      href: "/dashboard" },
  { id: "meetings",  label: "Meetings",       href: "/dashboard/meetings" },
  { id: "upload",    label: "New recording",  href: "/dashboard/upload", isAction: true },
  { id: "team",      label: "Team",           href: "/dashboard/team" },
  { id: "billing",   label: "Billing",        href: "/dashboard/billing" },
  { id: "settings",  label: "Settings",       href: "/dashboard/settings" },
];

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: string[];
  headRight?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
  contentMax?: number;
}

export default function AppShell({
  children, breadcrumbs, headRight, title, subtitle, contentMax = 1100,
}: AppShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--font-sans)", overflow: "hidden" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 232, flexShrink: 0, background: "var(--surface)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column" }}>

        {/* Logo */}
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--line-soft)" }}>
          <Wordmark size={15} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
          <Eyebrow style={{ padding: "8px 12px 6px" }}>Workspace</Eyebrow>
          {NAV.slice(0, 3).map(item => (
            <NavItem key={item.id} item={item} active={isActive(item.href)} />
          ))}
          <div style={{ height: 8 }} />
          <Eyebrow style={{ padding: "8px 12px 6px" }}>Account</Eyebrow>
          {NAV.slice(3).map(item => (
            <NavItem key={item.id} item={item} active={isActive(item.href)} />
          ))}
        </nav>

        {/* Bottom: usage + user */}
        <div style={{ padding: 10, borderTop: "1px solid var(--line-soft)" }}>
          <div style={{
            background: "var(--surface2)", border: "1px solid var(--line-soft)",
            borderRadius: "var(--r-md)", padding: 12, marginBottom: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink2)" }}>This month</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink3)" }}>3 / 5</span>
            </div>
            <Progress value={60} height={4} />
            <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--ink3)", lineHeight: 1.4 }}>
              2 meetings left on Free
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px" }}>
            <Avatar name={user?.name || user?.email || "U"} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.name || user?.email}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--ink3)", textTransform: "capitalize" }}>
                {user?.plan?.toLowerCase() || "free"} plan
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", color: "var(--ink3)", fontSize: 11 }}
            >
              →
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <header style={{
          height: 56, flexShrink: 0,
          borderBottom: "1px solid var(--line)",
          background: "var(--bg)",
          display: "flex", alignItems: "center",
          padding: "0 24px", gap: 16,
        }}>
          {breadcrumbs ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink3)" }}>
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span style={{ color: "var(--ink-mute)" }}>›</span>}
                  <span style={{ color: i === breadcrumbs.length - 1 ? "var(--ink)" : "var(--ink3)", fontWeight: i === breadcrumbs.length - 1 ? 500 : 400 }}>{b}</span>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, maxWidth: 460 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--surface)", border: "1px solid var(--line2)",
                borderRadius: "var(--r-md)", padding: "0 12px", height: 34,
                color: "var(--ink3)", fontSize: 13, cursor: "pointer",
              }}>
                <span>🔍</span>
                <span style={{ flex: 1 }}>Search meetings, transcripts, action items…</span>
                <kbd style={{
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  background: "var(--surface2)", border: "1px solid var(--line)",
                  borderRadius: "var(--r-sm)", padding: "1px 5px", color: "var(--ink3)",
                }}>⌘K</kbd>
              </div>
            </div>
          )}
          <div style={{ flex: 1 }} />
          {headRight}
        </header>

        {/* Page header */}
        {(title || subtitle) && (
          <div style={{ padding: "28px 32px 12px", maxWidth: contentMax + 64, margin: "0 auto", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
              <div>
                {title && (
                  <h1 style={{
                    margin: 0,
                    fontFamily: "var(--font-serif)", fontWeight: 500,
                    fontSize: 34, letterSpacing: "-0.018em", color: "var(--ink)", lineHeight: 1.1,
                  }}>{title}</h1>
                )}
                {subtitle && (
                  <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--ink3)" }}>{subtitle}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: `${title ? 16 : 28}px 32px 32px` }}>
          <div style={{ maxWidth: contentMax, margin: "0 auto" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ item, active }: { item: typeof NAV[0]; active: boolean }) {
  return (
    <Link href={item.href} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "7px 12px",
      borderRadius: "var(--r-sm)",
      background: active ? "var(--accent-bg)" : "transparent",
      color: active ? "var(--accent-hi)" : "var(--ink2)",
      fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: active ? 500 : 400,
      textDecoration: "none", letterSpacing: "-0.003em",
      transition: "background 100ms",
      borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
      marginLeft: -2,
    }}>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.isAction && !active && (
        <kbd style={{
          fontFamily: "var(--font-mono)", fontSize: 9.5,
          background: "var(--surface2)", border: "1px solid var(--line)",
          borderRadius: "var(--r-sm)", padding: "1px 5px", color: "var(--ink3)",
        }}>N</kbd>
      )}
    </Link>
  );
}
