import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, buildAuthCookie } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email });

    const responseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      avatar: user.avatar,
    };

    // NOTE: token is intentionally included in the body so the frontend
    // AuthContext can use it for Bearer auth on API calls. The HTTP-only
    // cookie covers browser navigation; Bearer covers axios requests.
    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append("Set-Cookie", buildAuthCookie(token));

    return new Response(JSON.stringify({ user: responseUser, token }), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
