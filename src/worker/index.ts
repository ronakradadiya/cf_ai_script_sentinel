import { Hono } from "hono";
import { cors } from "hono/cors";
import puppeteer from "@cloudflare/puppeteer";
import type { Env, AnalysisResult, ScriptInfo } from "../types";

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

// Main analysis endpoint with REAL browser automation
app.post("/analyze", async (c) => {
  try {
    const { url } = await c.req.json<{ url: string }>();

    if (!url) {
      return c.json({ error: "URL is required" }, 400);
    }

    // Validate URL
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

    // Intercept all script requests
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

    // Multi-strategy loading with fallbacks
    let loadSuccess = false;
    let loadError: Error | null = null;

    // Strategy 1: Try networkidle2 (balanced)
    try {
      console.log("[Script Sentinel] Attempting load with networkidle2...");
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 45000,
      });
      loadSuccess = true;
      console.log("[Script Sentinel] Page loaded successfully");
    } catch (error) {
      console.log(
        "[Script Sentinel] networkidle2 failed, trying domcontentloaded..."
      );
      loadError = error as Error;

      // Strategy 2: Fallback to domcontentloaded (faster, less strict)
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        loadSuccess = true;
        console.log("[Script Sentinel] Page loaded with domcontentloaded");

        // Give time for scripts to load after DOM ready
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (fallbackError) {
        console.error("[Script Sentinel] All load strategies failed");
        await browser.close();

        return c.json(
          {
            error: "Failed to load page",
            message:
              "The website could not be loaded. It may be blocking automated browsers, timing out, or requiring authentication.",
            attempts: {
              networkidle2: loadError?.message || "failed",
              domcontentloaded: (fallbackError as Error).message,
            },
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

    // Filter third-party scripts
    const thirdPartyScripts = scripts.filter((s) => {
      try {
        const scriptDomain = new URL(s.url).hostname;
        return scriptDomain !== pageDomain;
      } catch {
        return false;
      }
    });

    const result: AnalysisResult = {
      success: true,
      url: url,
      totalScripts: scripts.length,
      thirdPartyScripts: thirdPartyScripts.length,
      scripts: thirdPartyScripts,
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
      console.error("[Script Sentinel] Failed to store result:", storageError);
      // Continue anyway - analysis succeeded
    }

    console.log(
      `[Script Sentinel] Found ${thirdPartyScripts.length} third-party scripts`
    );

    return c.json(result);
  } catch (error) {
    console.error("[Script Sentinel] Analysis error:", error);
    return c.json(
      {
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Chat endpoint (placeholder for now)
app.post("/chat", async (c) => {
  try {
    const { message } = await c.req.json<{ message: string }>();

    return c.json({
      reply: `You asked: "${message}". AI chat coming in next phase!`,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json({ error: "Chat failed" }, 500);
  }
});

export default app;
