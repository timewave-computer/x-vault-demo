import { NextResponse } from "next/server";

export async function GET() {
  // MOCK DATA: This endpoint returns a fake APR percentage
  // In a real application, this would be fetched from a real data source
  // such as a database, external API, or blockchain contract

  const mockApr = "0.0412";

  // Add artificial delay to simulate network latency (optional)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Log that we're using mock data
  console.log("APR API: Returning mock APR data:", mockApr);

  return NextResponse.json(Number(mockApr));
}
