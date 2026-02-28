import { spawn } from "child_process";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 1800; // 30 minutes max for full regeneration

/**
 * GET /api/admin/regenerate?scope=all
 * GET /api/admin/regenerate?scope=unit&unit=3
 * GET /api/admin/regenerate?scope=unit&unit=r1   (review 1)
 *
 * Returns a Server-Sent Events stream. Each event is a JSON object emitted by
 * scripts/regenerate-content.js, prefixed with PROGRESS: on stdout.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "all";
  const unitParam = searchParams.get("unit");

  // Build CLI args for the script
  const scriptArgs: string[] =
    scope === "unit" && unitParam ? ["--unit", unitParam] : ["--all"];

  const scriptPath = path.join(process.cwd(), "scripts/regenerate-content.js");

  // Strip CLAUDECODE so the child claude process isn't blocked as a nested session
  const childEnv: NodeJS.ProcessEnv = { ...process.env };
  delete childEnv.CLAUDECODE;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const child = spawn("node", [scriptPath, ...scriptArgs], {
        cwd: process.cwd(),
        env: childEnv,
      });

      let buffer = "";

      child.stdout.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("PROGRESS:")) {
            const payload = trimmed.slice("PROGRESS:".length);
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        // Forward stderr as error events for debugging
        const msg = chunk.toString().trim();
        if (msg) {
          console.error("[regenerate]", msg);
        }
      });

      child.on("close", (code) => {
        if (buffer.trim().startsWith("PROGRESS:")) {
          const payload = buffer.trim().slice("PROGRESS:".length);
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "closed", code })}\n\n`)
        );
        controller.close();
      });

      child.on("error", (err) => {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", detail: err.message })}\n\n`
          )
        );
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
