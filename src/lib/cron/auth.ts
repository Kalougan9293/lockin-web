import { NextResponse } from "next/server";

export function verifyCronSecret(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET non configuré sur le serveur." },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization")?.trim() ?? "";
  const expected = `Bearer ${secret}`;

  if (authHeader !== expected) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  return null;
}
