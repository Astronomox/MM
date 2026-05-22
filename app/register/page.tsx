"use client";
// app/register/page.tsx — split-screen sign-up

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button, Input, Field, Avatar, Eyebrow, Wordmark } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(form.name, form.email, form.password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1.1fr 0.9fr",
      background: "var(--bg)",
      color: "var(--ink)",
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{ display: "flex", flexDirection: "column", padding: "32px 64px" }}>
        <Wordmark size={16} />

        <div style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          maxWidth: 400, width: "100%", margin: "0 auto",
        }}>
          <Eyebrow>Welcome</Eyebrow>
          <h1 style={{
            margin: "10px 0 8px",
            fontFamily: "var(--font-serif)", fontWeight: 500,
            fontSize: 38, letterSpacing: "-0.022em", color: "var(--ink)", lineHeight: 1.1,
          }}>
            Get your first memo in <em style={{ color: "var(--accent)", fontStyle: "italic" }}>two minutes.</em>
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--ink3)", lineHeight: 1.55 }}>
            Free forever, 5 meetings a month. We won't email you nonsense.
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <div style={{
                background: "var(--danger-bg)", color: "var(--danger)",
                fontSize: 13, padding: "10px 14px",
                borderRadius: "var(--r-md)", border: "1px solid var(--danger-bg)",
              }}>{error}</div>
            )}

            <Field label="Name">
              <Input
                placeholder="Ada Mensah"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                inputSize="lg"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                inputSize="lg"
              />
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={8}
                inputSize="lg"
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" full disabled={loading} style={{ marginTop: 8 }}>
              {loading ? "Creating account…" : "Create my account →"}
            </Button>

            <p style={{ margin: "12px 0 0", textAlign: "center", fontSize: 13, color: "var(--ink3)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink3)" }}>
          <span>© 2026 MeetingMemo</span>
          <div style={{ display: "flex", gap: 16 }}>
            <a href="#" style={{ color: "var(--ink3)" }}>Privacy</a>
            <a href="#" style={{ color: "var(--ink3)" }}>Terms</a>
          </div>
        </div>
      </div>

      {/* RIGHT — editorial panel */}
      <aside style={{
        background: "var(--accent-bg)",
        borderLeft: "1px solid var(--line)",
        padding: "48px 56px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }}>
        <Eyebrow>What you get back</Eyebrow>

        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["TL;DR", "One paragraph. The whole point."],
            ["Decisions", "Pulled out and listed."],
            ["Action items", "With owners and dates."],
            ["Searchable transcript", "Every word, every speaker."],
            ["A clean PDF", "Send it to whoever wasn't there."],
          ].map(([h, b]) => (
            <li key={h} style={{ display: "flex", gap: 12 }}>
              <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }}>✓</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{h}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink3)" }}>{b}</div>
              </div>
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Avatar name="Pascal Olu" size={32} />
          <Avatar name="Sade Lin" size={32} />
          <Avatar name="Tom Hu" size={32} />
          <span style={{ fontSize: 12.5, color: "var(--ink3)" }}>
            Free, while we're new.
          </span>
        </div>
      </aside>
    </main>
  );
}
