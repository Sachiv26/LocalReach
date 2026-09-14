import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/access";
import { createCommunityWithDefaults } from "@/lib/communities/service";
import { AppError } from "@/lib/errors";

const schema = z.object({
  name: z.string().trim().min(3).max(120),
  adminEmail: z.string().email(),
  description: z.string().max(500).optional(),
  whatsappInviteUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("PLATFORM_ADMIN");
    const body = schema.parse(await req.json());
    const community = await createCommunityWithDefaults(
      {
        name: body.name,
        adminEmail: body.adminEmail,
        description: body.description,
        whatsappInviteUrl: body.whatsappInviteUrl,
      },
      ctx.userId!
    );
    return NextResponse.json({ ok: true, data: { id: community.id, slug: community.slug } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: err.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    if (err instanceof AppError) {
      return NextResponse.json({ ok: false, message: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 400 });
    }
    console.error("create community failed", err);
    return NextResponse.json({ ok: false, message: "Failed to create community." }, { status: 500 });
  }
}
