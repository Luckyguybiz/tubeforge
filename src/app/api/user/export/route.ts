import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userData = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      createdAt: true,
      referralCode: true,
      referralEarnings: true,
      aiUsage: true,
      projects: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          scenes: {
            select: {
              id: true,
              prompt: true,
              duration: true,
              order: true,
            },
          },
        },
      },
      channels: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
          subscribers: true,
          createdAt: true,
        },
      },
      assets: {
        select: {
          id: true,
          filename: true,
          type: true,
          size: true,
          createdAt: true,
        },
      },
    },
  });

  if (!userData)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(JSON.stringify(userData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="tubeforge-data-${session.user.id}.json"`,
    },
  });
}
