import { NextResponse } from "next/server";
import { listWeeks } from "@/lib/data-source";

export async function GET() {
  return NextResponse.json({ weeks: listWeeks() });
}
