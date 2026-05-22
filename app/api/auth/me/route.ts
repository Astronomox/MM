import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUserUsageStats } from "@/lib/limits";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getUserUsageStats(user.id);

  return Response.json({ user, stats });
}
