import { NextResponse } from "next/server";

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return NextResponse.json({ enabled: false }, { status: 200 });
  return NextResponse.json({ enabled: true, publicKey });
}
