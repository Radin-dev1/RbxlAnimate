import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAnimationFromPrompt } from "@/lib/generateAnimation";
import type { AnimStyle } from "@/lib/types";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const prompt = String(body.prompt || "").slice(0, 500);
  const style = (body.style || "emote") as AnimStyle;
  const duration = Number(body.duration) || 2;
  const quality = body.quality === "high" ? "high" : "standard";
  const source = body.source === "video" ? "video" : "text";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  // Procedural AI motion engine (swap for external model later)
  const clip = generateAnimationFromPrompt({ prompt, style, duration, quality, source });

  return NextResponse.json({ clip });
}
