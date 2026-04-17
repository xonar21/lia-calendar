export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    service: "lia-calendar",
    timestamp: new Date().toISOString(),
  });
}
