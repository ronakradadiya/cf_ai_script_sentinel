import { DurableObject } from "cloudflare:workers";
import type { AnalysisResult, Env } from "../types";

export class ScriptAnalyzer extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Store analysis results
    if (url.pathname === "/store" && request.method === "POST") {
      return this.storeAnalysis(request);
    }

    // Retrieve past analyses
    if (url.pathname === "/retrieve" && request.method === "GET") {
      return this.retrieveAnalyses();
    }

    return new Response("Not Found", { status: 404 });
  }

  private async storeAnalysis(request: Request): Promise<Response> {
    try {
      const data = (await request.json()) as AnalysisResult;
      const key = `analysis:${data.url}:${Date.now()}`;

      // Store in Durable Object storage
      await this.ctx.storage.put(key, data);

      return new Response(
        JSON.stringify({
          success: true,
          key: key,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to store analysis",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  private async retrieveAnalyses(): Promise<Response> {
    try {
      // Get all stored analyses
      const analyses = await this.ctx.storage.list({ prefix: "analysis:" });
      const results = Array.from(analyses.values());

      return new Response(
        JSON.stringify({
          success: true,
          count: results.length,
          analyses: results,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to retrieve analyses",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}
