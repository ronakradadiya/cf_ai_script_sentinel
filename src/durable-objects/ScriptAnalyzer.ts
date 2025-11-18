import { DurableObject } from "cloudflare:workers";
import type { AnalysisResult, ChatMessage, ChatSession, Env } from "../types";

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

    if (url.pathname === "/chat/message" && request.method === "POST") {
      return this.storeChatMessage(request);
    }

    if (url.pathname === "/chat/history" && request.method === "GET") {
      return this.getChatHistory(request);
    }

    if (url.pathname === "/chat/init" && request.method === "POST") {
      return this.initChatSession(request);
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

  private async initChatSession(request: Request): Promise<Response> {
    try {
      const { sessionId, analysisData } = (await request.json()) as {
        sessionId: string;
        analysisData: AnalysisResult;
      };

      const session: ChatSession = {
        sessionId,
        messages: [],
        analysisData,
        createdAt: Date.now(),
        lastActive: Date.now(),
      };

      await this.ctx.storage.put(`chat:${sessionId}`, session);

      return new Response(
        JSON.stringify({
          success: true,
          sessionId,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to init chat session",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  private async storeChatMessage(request: Request): Promise<Response> {
    try {
      const { sessionId, message } = (await request.json()) as {
        sessionId: string;
        message: ChatMessage;
      };

      const session = (await this.ctx.storage.get(
        `chat:${sessionId}`
      )) as ChatSession;

      if (!session) {
        return new Response(
          JSON.stringify({
            error: "Session not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      session.messages.push(message);
      session.lastActive = Date.now();

      await this.ctx.storage.put(`chat:${sessionId}`, session);

      return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to store message",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  private async getChatHistory(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get("sessionId");

      if (!sessionId) {
        return new Response(
          JSON.stringify({
            error: "Session ID required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const session = (await this.ctx.storage.get(
        `chat:${sessionId}`
      )) as ChatSession;

      if (!session) {
        return new Response(
          JSON.stringify({
            messages: [],
            analysisData: null,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          messages: session.messages,
          analysisData: session.analysisData,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to get chat history",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}
