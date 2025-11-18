import { Hono } from "hono";
import { cors } from "hono/cors";
import puppeteer from "@cloudflare/puppeteer";
import type { Env, AnalysisResult, ScriptInfo, ChatRequest } from "../types";
import { analyzeScript } from "./analyzer";
import { handleChatMessage } from "./chat";

export { ScriptAnalyzer } from "../durable-objects/ScriptAnalyzer";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Health check
app.get("/", (c) => {
  return c.json({
    status: "running",
    service: "Script Sentinel API",
    version: "1.0.0",
  });
});

// Group routes under /api/v1
const api = new Hono<{ Bindings: Env }>();

// Main analysis endpoint with AI
api.post("/analyze", async (c) => {
  try {
    const { url } = await c.req.json<{ url: string }>();

    if (!url) {
      return c.json({ error: "URL is required" }, 400);
    }

    try {
      new URL(url);
    } catch {
      return c.json({ error: "Invalid URL format" }, 400);
    }

    console.log(`[Script Sentinel] Analyzing: ${url}`);

    // Launch browser
    const browser = await puppeteer.launch(c.env.MYBROWSER);
    const page = await browser.newPage();

    const scripts: ScriptInfo[] = [];
    const pageDomain = new URL(url).hostname;

    await page.setRequestInterception(true);

    page.on("request", (req) => {
      const requestUrl = req.url();
      const resourceType = req.resourceType();

      // Log JavaScript files
      if (resourceType === "script") {
        scripts.push({
          url: requestUrl,
          timestamp: Date.now(),
        });
      }

      // Block heavy resources we don't need
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        req.abort();
        return;
      }

      // Continue the request
      req.continue();
    });

    // Load page with fallback strategy
    let loadSuccess = false;

    // Strategy 1: Try networkidle2 (balanced)
    try {
      console.log("[Script Sentinel] Loading with networkidle2...");
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 45000,
      });
      loadSuccess = true;
    } catch {
      console.log("[Script Sentinel] Fallback to domcontentloaded...");
      // Strategy 2: Fallback to domcontentloaded
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        loadSuccess = true;

        // Give time for scripts to load after DOM ready
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (fallbackError) {
        await browser.close();
        return c.json(
          {
            error: "Failed to load page",
            message: "The website could not be loaded.",
          },
          504
        );
      }
    }

    // Wait a bit more for dynamic scripts
    if (loadSuccess) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    await browser.close();

    console.log("Scripts", scripts);

    // Filter third-party scripts
    const thirdPartyScripts = scripts.filter((s) => {
      try {
        const scriptDomain = new URL(s.url).hostname;
        return scriptDomain !== pageDomain;
      } catch {
        return false;
      }
    });

    console.log(
      `[Script Sentinel] Found ${thirdPartyScripts.length} third-party scripts`
    );
    console.log("[Script Sentinel] Starting AI analysis...");

    // Analyze each script with AI
    const analyses = await Promise.all(
      thirdPartyScripts.slice(0, 10).map(
        (script) => analyzeScript(script, pageDomain, c.env) // ← Add pageDomain
      )
    );

    console.log("[Script Sentinel] AI analysis complete");

    const result: AnalysisResult = {
      success: true,
      url: url,
      totalScripts: scripts.length,
      thirdPartyScripts: thirdPartyScripts.length,
      scripts: thirdPartyScripts,
      analyses: analyses,
    };

    // Store in Durable Object
    try {
      const id = c.env.SCRIPT_ANALYZER.idFromName("global");
      const stub = c.env.SCRIPT_ANALYZER.get(id);

      await stub.fetch("http://internal/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
    } catch (storageError) {
      console.error("[Script Sentinel] Storage error:", storageError);
    }

    return c.json(result);
  } catch (error) {
    console.error("[Script Sentinel] Error:", error);
    return c.json(
      {
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

api.post("/chat", async (c) => {
  try {
    const { message, sessionId, analysisContext } =
      await c.req.json<ChatRequest>();

    if (!message || !sessionId) {
      return c.json({ error: "Message and session ID required" }, 400);
    }

    console.log(`[Chat] User: ${message}`);

    // Get AI response with analysis context
    const reply = await handleChatMessage(message, analysisContext, c.env);

    // Store message in Durable Object
    const id = c.env.SCRIPT_ANALYZER.idFromName(sessionId);
    const stub = c.env.SCRIPT_ANALYZER.get(id);

    // Store user message
    await stub.fetch("http://internal/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: {
          role: "user",
          content: message,
          timestamp: Date.now(),
        },
      }),
    });

    // Store assistant response
    await stub.fetch("http://internal/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: {
          role: "assistant",
          content: reply,
          timestamp: Date.now(),
        },
      }),
    });

    console.log(`[Chat] Assistant: ${reply.substring(0, 100)}...`);

    return c.json({
      reply,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[Chat Error]", error);
    return c.json(
      {
        error: "Chat failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

api.post("/chat/init", async (c) => {
  try {
    const { sessionId, analysisData } = await c.req.json<{
      sessionId: string;
      analysisData: AnalysisResult;
    }>();

    const id = c.env.SCRIPT_ANALYZER.idFromName(sessionId);
    const stub = c.env.SCRIPT_ANALYZER.get(id);

    await stub.fetch("http://internal/chat/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, analysisData }),
    });

    return c.json({ success: true, sessionId });
  } catch (error) {
    return c.json({ error: "Failed to init chat" }, 500);
  }
});

app.route("/api/v1", api);

export default app;
