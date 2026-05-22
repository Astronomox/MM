"use client";
// app/dashboard/settings/page.tsx — profile + summary preferences + account
// Note: "save" toasts only commit when you wire the /api/auth/me PATCH route.

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { Card, Button, Input, Field, Avatar, Eyebrow, Sep } from "@/components/ui";

const TABS = [
  { id: "profile",       label: "Profile" },
  { id: "summary",       label: "Summary preferences" },
  { id: "account",       label: "Account & security" },
  { id: "notifications", label: "Notifications" },
  { id: "integrations",  label: "Integrations" },
  { id: "danger",        label: "Delete account", danger: true },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("profile");

  return (
    <AppShell title="Settings" subtitle="Your account, your preferences.">
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32 }}>
        {/* Side nav */}
        <nav style={{
          display: "flex", flexDirection: "column", gap: 1,
          position: "sticky", top: 0, alignSelf: "flex-start",
        }}>
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--r-sm)",
                  fontFamily: "var(--font-sans)", fontSize: 13,
                  color: active ? "var(--ink)" : t.danger ? "var(--danger)" : "var(--ink3)",
                  fontWeight: active ? 500 : 400,
                  background: active ? "var(--accent-bg)" : "transparent",
                  border: "none",
                  borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                  paddingLeft: 10,
                  textAlign: "left",
                  cursor: "pointer",
                  letterSpacing: "-0.003em",
                }}
              >{t.label}</button>
            );
          })}
        </nav>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {tab === "profile" && <ProfileSection user={user} />}
          {tab === "summary" && <SummarySection />}
          {tab === "account" && <AccountSection />}
          {tab === "notifications" && <NotificationsSection />}
          {tab === "integrations" && (
            <Card padding={24}>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink3)" }}>
                Slack, Notion, Linear — coming soon.
              </p>
            </Card>
          )}
          {tab === "danger" && <DangerSection />}
        </div>
      </div>
    </AppShell>
  );
}

function SectionCard({
  title, subtitle, children, onSave,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onSave?: () => void;
}) {
  return (
    <Card padding={0}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--line-soft)" }}>
        <h3 style={{
          margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500,
          fontSize: 17, letterSpacing: "-0.015em", color: "var(--ink)",
        }}>{title}</h3>
        <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink3)" }}>{subtitle}</p>
      </div>
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        {children}
      </div>
      <div style={{
        padding: "14px 24px",
        background: "var(--surface2)",
        borderTop: "1px solid var(--line-soft)",
        borderRadius: "0 0 var(--r-lg) var(--r-lg)",
        display: "flex", justifyContent: "flex-end", gap: 8,
      }}>
        <Button variant="ghost" size="sm">Discard</Button>
        <Button variant="primary" size="sm" onClick={onSave}>Save changes</Button>
      </div>
    </Card>
  );
}

function ProfileSection({ user }: { user: any }) {
  const [name, setName] = useState(user?.name ?? "");
  return (
    <SectionCard
      title="Profile"
      subtitle="This is what shows up in your meetings and exports."
    >
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <Avatar name={name || user?.email || "U"} size={64} />
        <div style={{ flex: 1 }}>
          <Button variant="outline" size="sm">Upload photo</Button>
          <span style={{ marginLeft: 8, fontSize: 12, color: "var(--ink3)" }}>
            JPG, PNG, or GIF · 2MB max
          </span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Display name" hint="What we call you in greetings">
          <Input defaultValue={user?.name?.split(" ")[0] ?? ""} />
        </Field>
      </div>
      <Field label="Email">
        <Input value={user?.email ?? ""} readOnly />
      </Field>
      <Field label="Timezone">
        <Input defaultValue="(GMT+01:00) West Africa — Lagos" />
      </Field>
    </SectionCard>
  );
}

function SummarySection() {
  const [tone, setTone] = useState("balanced");
  const SECTIONS = [
    { key: "tldr",      label: "TL;DR",                              on: true,  locked: true },
    { key: "decisions", label: "Key decisions",                      on: true },
    { key: "actions",   label: "Action items (with owners & dates)", on: true },
    { key: "topics",    label: "Topics discussed (with timestamps)", on: true },
    { key: "questions", label: "Open questions",                     on: false },
    { key: "sentiment", label: "Sentiment check",                    on: false },
    { key: "next",      label: "Next meeting agenda suggestions",    on: true },
  ];
  const [sections, setSections] = useState(SECTIONS);

  return (
    <SectionCard
      title="Summary preferences"
      subtitle="Tune how GPT writes your memos."
    >
      <Field label="Tone">
        <SegmentedControl
          value={tone}
          options={[
            { v: "concise", l: "Concise" },
            { v: "balanced", l: "Balanced" },
            { v: "detailed", l: "Detailed" },
          ]}
          onChange={setTone}
        />
      </Field>

      <Field
        label="Sections to include"
        hint="Drag to reorder. These appear in every meeting page and PDF."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          {sections.map((s, i) => (
            <div key={s.key} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px",
              border: "1px solid var(--line)",
              background: "var(--surface)",
              borderRadius: "var(--r-md)",
            }}>
              <span style={{ color: "var(--ink-mute)", cursor: "grab", userSelect: "none" }}>⋮⋮</span>
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--ink)", letterSpacing: "-0.003em" }}>
                {s.label}
                {s.locked && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: "var(--ink3)" }}>· always on</span>
                )}
              </span>
              <Switch
                on={s.on}
                disabled={s.locked}
                onToggle={() => setSections((prev) => prev.map((x, j) => j === i ? { ...x, on: !x.on } : x))}
              />
            </div>
          ))}
        </div>
      </Field>

      <Field label="Custom instructions" hint="Optional prompt added to every summary. Be specific.">
        <textarea
          defaultValue="Prefer plain language. Always include a 'Next steps' bullet list at the end."
          rows={3}
          style={{
            width: "100%", padding: "10px 12px",
            background: "var(--surface)",
            border: "1px solid var(--line2)",
            borderRadius: "var(--r-md)", outline: "none", resize: "vertical",
            fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink)",
            letterSpacing: "-0.003em", lineHeight: 1.5,
          }}
        />
      </Field>
    </SectionCard>
  );
}

function AccountSection() {
  return (
    <SectionCard
      title="Account & security"
      subtitle="Change your password."
    >
      <Field label="Current password"><Input type="password" /></Field>
      <Field label="New password" hint="At least 8 characters"><Input type="password" /></Field>
      <Field label="Confirm new password"><Input type="password" /></Field>
    </SectionCard>
  );
}

function NotificationsSection() {
  const items: Array<[string, boolean]> = [
    ["Email me when a meeting is ready", true],
    ["Email me when an action item is due", false],
    ["Weekly digest", true],
    ["Product updates (rare)", false],
  ];
  const [state, setState] = useState(items.map(([_, v]) => v));
  return (
    <SectionCard title="Notifications" subtitle="Get told when things happen.">
      {items.map(([label], i) => (
        <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
          <span style={{ fontSize: 13.5, color: "var(--ink)" }}>{label}</span>
          <Switch on={state[i]} onToggle={() => setState((prev) => prev.map((v, j) => j === i ? !v : v))} />
        </div>
      ))}
    </SectionCard>
  );
}

function DangerSection() {
  return (
    <Card padding={26} style={{ border: "1.5px solid var(--danger)" }}>
      <h3 style={{
        margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500,
        fontSize: 17, letterSpacing: "-0.015em", color: "var(--danger)",
      }}>Delete account</h3>
      <p style={{ margin: "8px 0 16px", fontSize: 13.5, color: "var(--ink2)", lineHeight: 1.55, maxWidth: 520 }}>
        Removes your account, all meetings, transcripts, and PDFs. This cannot be undone.
      </p>
      <Button variant="danger" size="sm">Delete my account</Button>
    </Card>
  );
}

/* ── Inline mini-components ─────────────────────────────────────────── */

function Switch({ on, onToggle, disabled }: { on: boolean; onToggle?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      style={{
        width: 32, height: 18,
        background: on ? "var(--accent)" : "var(--line2)",
        borderRadius: 999, padding: 2,
        display: "flex", alignItems: "center",
        justifyContent: on ? "flex-end" : "flex-start",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 150ms, justify-content 150ms",
        border: "none", flexShrink: 0,
      }}
      aria-pressed={on}
    >
      <div style={{ width: 14, height: 14, background: "#fff", borderRadius: 999, boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />
    </button>
  );
}

function SegmentedControl({
  value, options, onChange,
}: {
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{
      display: "inline-flex",
      background: "var(--surface2)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-md)",
      padding: 3,
      width: "fit-content",
    }}>
      {options.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            style={{
              padding: "5px 14px",
              background: active ? "var(--surface)" : "transparent",
              border: active ? "1px solid var(--line2)" : "1px solid transparent",
              borderRadius: "var(--r-sm)",
              fontFamily: "var(--font-sans)", fontSize: 12.5,
              fontWeight: active ? 600 : 400,
              color: active ? "var(--ink)" : "var(--ink3)",
              cursor: "pointer",
              letterSpacing: "-0.003em",
            }}
          >{o.l}</button>
        );
      })}
    </div>
  );
}
