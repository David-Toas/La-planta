import { NextRequest, NextResponse } from "next/server";
import { GET as getPdfByCode } from "../[code]/pdf/route";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") || "LP-LOS-77974";
  return getPdfByCode(request, { params: Promise.resolve({ code }) });
}

