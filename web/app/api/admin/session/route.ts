import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminCookie, readSessionToken } from "@/lib/admin-auth";

export async function GET() {
  const store = await cookies();
  const session = await readSessionToken(store.get(adminCookie.name)?.value);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, email: session.email });
}
