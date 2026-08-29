import { NextResponse } from "next/server";
import { getTitleById } from "@/lib/data-source";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const title = getTitleById(params.id);
  if (!title) return NextResponse.json({ error: "Title not found" }, { status: 404 });
  return NextResponse.json({ title });
}
