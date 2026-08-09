export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "myjudicial-next-app",
    apiVersion: "v1",
    timestamp: new Date().toISOString(),
  });
}