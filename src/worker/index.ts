import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env, AnalysisResult, ChatMessage, ChatResponse } from "../types";

// ⭐ IMPORTANT: Export the Durable Object class
export { ScriptAnalyzer } from "../durable-objects/ScriptAnalyzer";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Health check
app.get("/", (c) => {
  return c.json({
    status: "running",
    service: "Script Sentinel API",
    version: "1.0.0",
    features: {
      browser: !!c.env.MYBROWSER,
      ai: !!c.env.AI,
      durableObjects: !!c.env.SCRIPT_ANALYZER,
    },
  });
});

// Analyze endpoint
app.post("/analyze", async (c) => {
  try {
    const { url } = await c.req.json<{ url: string }>();

    if (!url) {
      return c.json({ error: "URL is required" }, 400);
    }

    console.log(`[Script Sentinel] Analyzing: ${url}`);

    // Mock data for now
    const result: AnalysisResult = {
      success: true,
      url: url,
      totalScripts: 5,
      thirdPartyScripts: 2,
      scripts: [
        {
          url: "https://www.googletagmanager.com/gtag/js",
          timestamp: Date.now(),
        },
        {
          url: "https://connect.facebook.net/en_US/fbevents.js",
          timestamp: Date.now(),
        },
      ],
    };

    // ⭐ Store in Durable Object
    const id = c.env.SCRIPT_ANALYZER.idFromName("global");
    const stub = c.env.SCRIPT_ANALYZER.get(id);

    await stub.fetch("http://internal/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });

    return c.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return c.json(
      {
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Chat endpoint
app.post("/chat", async (c) => {
  try {
    const { message } = await c.req.json<ChatMessage>();

    const response: ChatResponse = {
      reply: `You asked: "${message}". Chat functionality coming soon!`,
    };

    return c.json(response);
  } catch (error) {
    console.error("Chat error:", error);
    return c.json({ error: "Chat failed" }, 500);
  }
});

export default app;
