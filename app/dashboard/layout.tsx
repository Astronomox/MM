"use client";
// app/dashboard/layout.tsx — auth gate only.
// The sidebar lives in AppShell, which each page renders. Don't render a sidebar here.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        color: "var(--ink3)",
        fontFamily: "var(--font-sans)",
        fontSize: 13,
      }}>
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
