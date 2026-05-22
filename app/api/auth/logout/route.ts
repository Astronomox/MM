import { NextRequest } from "next/server";

export async function POST(_req: NextRequest) {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append(
    "Set-Cookie",
    "mm_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  );
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
