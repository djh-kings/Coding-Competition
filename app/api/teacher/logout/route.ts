import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const url = new URL("/teacher/login", req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.delete("teacher_token");
  return res;
}
