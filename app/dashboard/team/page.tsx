"use client";
// app/dashboard/team/page.tsx — workspace & members
// Note: Workspace + Membership tables aren't in your Prisma yet. This page
// renders an empty "Just you for now" state until /api/workspace exists.

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import {
  Card, Badge, Button, Input, Field, Avatar, Eyebrow,
} from "@/components/ui";

export default function TeamPage() {
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <AppShell
      title="Team"
      subtitle="Your workspace and who's in it."
      headRight={
        <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
          + Invite member
        </Button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Workspace card */}
        <Card padding={0}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--line-soft)" }}>
            <h3 style={{
              margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500,
              fontSize: 17, letterSpacing: "-0.015em", color: "var(--ink)",
            }}>Workspace</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink3)" }}>
              Your team's shared meeting space.
            </p>
          </div>
          <div style={{ padding: "20px 24px", display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: "var(--r-md)",
              background: "var(--accent-bg)",
              border: "1px solid var(--line)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 22,
              color: "var(--accent)", letterSpacing: "-0.01em",
            }}>
              {(user?.name || user?.email || "U")[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 16, fontWeight: 600, color: "var(--ink)",
                fontFamily: "var(--font-serif)", letterSpacing: "-0.012em",
              }}>{user?.name?.split(" ")[0] || "Personal"}'s workspace</div>
              <div style={{ marginTop: 2, fontSize: 12.5, color: "var(--ink3)", fontFamily: "var(--font-mono)" }}>
                {user?.email?.split("@")[0] || "you"}.meetingmemo.app
              </div>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
        </Card>

        {/* Members — empty state until you add a Workspace model */}
        <Card padding={0}>
          <div style={{
            padding: "18px 24px", borderBottom: "1px solid var(--line-soft)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <h3 style={{
                margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500,
                fontSize: 17, letterSpacing: "-0.015em", color: "var(--ink)",
              }}>Members</h3>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink3)" }}>
                1 member · 0 pending invites
              </p>
            </div>
            <Input
              leadIcon={<span>⌕</span>}
              placeholder="Find a member"
              wrapStyle={{ width: 220 }}
              inputSize="sm"
            />
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface2)" }}>
                {[
                  { l: "Member", a: "left" },
                  { l: "Role", a: "left" },
                  { l: "Last active", a: "left" },
                  { l: "Meetings", a: "right" },
                  { l: "", a: "right" },
                ].map((h, i) => (
                  <th key={i} style={{
                    textAlign: h.a as any,
                    padding: "10px 16px",
                    fontSize: 10.5, fontWeight: 500,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "var(--ink3)",
                  }}>{h.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: "1px solid var(--line-soft)" }}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar name={user?.name || user?.email || "U"} size={32} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.005em" }}>
                        {user?.name || user?.email} <span style={{ fontWeight: 400, color: "var(--ink3)", marginLeft: 4 }}>(you)</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink3)", fontFamily: "var(--font-mono)" }}>{user?.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <Badge tone="accent" size="sm">Owner</Badge>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12.5, color: "var(--ink3)" }}>Now</td>
                <td style={{ padding: "14px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink2)" }}>—</td>
                <td style={{ padding: "14px 16px", textAlign: "right", color: "var(--ink-mute)" }}>···</td>
              </tr>
            </tbody>
          </table>

          <div style={{
            padding: "20px 24px",
            background: "var(--surface2)",
            borderTop: "1px solid var(--line-soft)",
            borderRadius: "0 0 var(--r-lg) var(--r-lg)",
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ color: "var(--accent)", marginTop: 2 }}>✦</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                Workspaces are coming soon.
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.5 }}>
                You'll be able to invite teammates, share meetings, and assign action items across the workspace.
                Until the Prisma migration ships, this is a single-user space.
              </p>
            </div>
          </div>
        </Card>

        {/* Default sharing — visual only for now */}
        <Card padding={0}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--line-soft)" }}>
            <h3 style={{
              margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500,
              fontSize: 17, letterSpacing: "-0.015em", color: "var(--ink)",
            }}>Default sharing</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink3)" }}>
              Choose who can see new meetings by default.
            </p>
          </div>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { id: "me", label: "Only me", body: "Meetings stay private to your account.", chosen: true },
              { id: "team", label: "Everyone in workspace", body: "All members can view summaries and transcripts." },
              { id: "link", label: "Anyone with the link", body: "Shareable via link — no sign-in required." },
            ].map((o) => (
              <label key={o.id} style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                padding: "14px 16px",
                border: `1px solid ${o.chosen ? "var(--accent)" : "var(--line2)"}`,
                background: o.chosen ? "var(--accent-bg)" : "var(--surface)",
                borderRadius: "var(--r-md)", cursor: "pointer",
              }}>
                <span style={{
                  width: 16, height: 16, marginTop: 2,
                  borderRadius: "50%",
                  border: `2px solid ${o.chosen ? "var(--accent)" : "var(--line2)"}`,
                  background: o.chosen ? "var(--accent)" : "var(--surface)",
                  flexShrink: 0, position: "relative",
                }}>
                  {o.chosen && <span style={{ position: "absolute", inset: 3, background: "var(--surface)", borderRadius: "50%" }} />}
                </span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.003em" }}>
                    {o.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>{o.body}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div
          onClick={() => setInviteOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(28, 26, 20, 0.4)",
            zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 440, maxWidth: "90vw",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-lg)",
              padding: 24, boxShadow: "var(--shadow-lg)",
            }}
          >
            <h3 style={{
              margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500,
              fontSize: 22, letterSpacing: "-0.015em",
            }}>Invite to workspace</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink3)" }}>
              They'll get an email with a link to join.
            </p>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Email">
                <Input type="email" placeholder="teammate@company.com" />
              </Field>
            </div>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => setInviteOpen(false)}>Send invite</Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
