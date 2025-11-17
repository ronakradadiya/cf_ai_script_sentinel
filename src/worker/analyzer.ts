import type { Env, ScriptInfo, ScriptAnalysis } from "../types";

// Helper: Check if script is first-party
function isFirstParty(scriptUrl: string, pageDomain: string): boolean {
  try {
    const scriptDomain = new URL(scriptUrl).hostname;
    const pageBase = pageDomain.replace(/^www\./, "");
    const scriptBase = scriptDomain.replace(/^www\./, "");

    // Same domain or subdomain
    return (
      scriptBase === pageBase ||
      scriptBase.endsWith("." + pageBase) ||
      pageBase.endsWith("." + scriptBase)
    );
  } catch {
    return false;
  }
}

// Helper: Check if it's a known framework/CDN
function isKnownFramework(scriptUrl: string): boolean {
  const frameworkPatterns = [
    "/_next/static/", // Next.js
    "/_nuxt/", // Nuxt.js
    "/webpack", // Webpack
    "/react", // React
    "/vue", // Vue
    "chunk", // Build chunks
    "runtime", // Runtime files
  ];

  return frameworkPatterns.some((pattern) => scriptUrl.includes(pattern));
}

// Expanded database of known services
const KNOWN_SERVICES: Record<string, Partial<ScriptAnalysis>> = {
  // Payment Gateways
  "razorpay.com": {
    scriptName: "Razorpay Payment Gateway",
    purpose: "Secure payment processing for Indian market",
    dataCollected: ["payment details", "transaction data", "contact info"],
    riskLevel: "LOW",
    recommendation: "ALLOW",
    reasoning: "Legitimate payment gateway used by thousands of businesses",
  },
  "stripe.com": {
    scriptName: "Stripe Payment Gateway",
    purpose: "Payment processing",
    dataCollected: ["payment details", "transaction data"],
    riskLevel: "LOW",
    recommendation: "ALLOW",
  },
  "paypal.com": {
    scriptName: "PayPal",
    purpose: "Payment processing",
    dataCollected: ["payment details", "transaction data"],
    riskLevel: "LOW",
    recommendation: "ALLOW",
  },

  // Analytics
  "google-analytics.com": {
    scriptName: "Google Analytics",
    purpose: "Website analytics and tracking",
    dataCollected: ["page views", "user behavior", "device info"],
    riskLevel: "LOW",
    recommendation: "ALLOW",
  },
  "googletagmanager.com": {
    scriptName: "Google Tag Manager",
    purpose: "Tag management system",
    dataCollected: ["page views", "events", "user interactions"],
    riskLevel: "LOW",
    recommendation: "ALLOW",
  },

  // Social Media
  "facebook.net": {
    scriptName: "Facebook Pixel",
    purpose: "Advertising and conversion tracking",
    dataCollected: ["page views", "events", "user behavior"],
    riskLevel: "MEDIUM",
    recommendation: "MONITOR",
    reasoning: "Tracks user behavior for advertising purposes",
  },
  "connect.facebook.net": {
    scriptName: "Facebook SDK",
    purpose: "Social login and sharing",
    dataCollected: ["profile data", "social interactions"],
    riskLevel: "MEDIUM",
    recommendation: "MONITOR",
  },

  // Ads
  "doubleclick.net": {
    scriptName: "Google DoubleClick",
    purpose: "Ad serving and tracking",
    dataCollected: ["browsing behavior", "ad interactions"],
    riskLevel: "MEDIUM",
    recommendation: "MONITOR",
  },
  "googlesyndication.com": {
    scriptName: "Google AdSense",
    purpose: "Display advertisements",
    dataCollected: ["browsing context", "ad performance"],
    riskLevel: "MEDIUM",
    recommendation: "MONITOR",
  },

  // CDNs
  "ajax.googleapis.com": {
    scriptName: "Google CDN",
    purpose: "Content delivery (libraries)",
    dataCollected: ["basic request data"],
    riskLevel: "LOW",
    recommendation: "ALLOW",
  },
  "cdn.jsdelivr.net": {
    scriptName: "jsDelivr CDN",
    purpose: "Content delivery network",
    dataCollected: ["basic request data"],
    riskLevel: "LOW",
    recommendation: "ALLOW",
  },
  "cdnjs.cloudflare.com": {
    scriptName: "Cloudflare CDN",
    purpose: "Content delivery network",
    dataCollected: ["basic request data"],
    riskLevel: "LOW",
    recommendation: "ALLOW",
  },
  "unpkg.com": {
    scriptName: "UNPKG CDN",
    purpose: "NPM package CDN",
    dataCollected: ["basic request data"],
    riskLevel: "LOW",
    recommendation: "ALLOW",
  },
};

export async function analyzeScript(
  script: ScriptInfo,
  pageDomain: string,
  env: Env
): Promise<ScriptAnalysis> {
  try {
    const scriptDomain = new URL(script.url).hostname;

    // Check if first-party
    if (isFirstParty(script.url, pageDomain)) {
      return {
        scriptUrl: script.url,
        scriptName: "First-Party Script",
        purpose: "Part of the website's core functionality",
        dataCollected: ["Website functionality data only"],
        destinations: [scriptDomain],
        riskLevel: "LOW",
        reasoning: "This script is hosted on the same domain as the website",
        recommendation: "ALLOW",
        userFriendlyExplanation: `This script is part of ${pageDomain}'s own code and is necessary for the website to work properly. It's safe.`,
      };
    }

    // Check if known framework
    if (isKnownFramework(script.url)) {
      return {
        scriptUrl: script.url,
        scriptName: "Web Framework Component",
        purpose: "Powers website features and interactivity",
        dataCollected: ["Browser compatibility data"],
        destinations: [scriptDomain],
        riskLevel: "LOW",
        reasoning: "Standard web framework file (Next.js/React/Vue)",
        recommendation: "ALLOW",
        userFriendlyExplanation:
          "This is a framework file that helps the website function. It's a standard component and safe.",
      };
    }

    // Check expanded known services database
    for (const [key, value] of Object.entries(KNOWN_SERVICES)) {
      if (scriptDomain.includes(key)) {
        return {
          scriptUrl: script.url,
          scriptName: value.scriptName || "Known Service",
          purpose: value.purpose || "Third-party service",
          dataCollected: value.dataCollected || [],
          destinations: [scriptDomain],
          riskLevel: value.riskLevel || "MEDIUM",
          reasoning: value.reasoning || "Recognized third-party service",
          recommendation: value.recommendation || "MONITOR",
          userFriendlyExplanation: `This is ${
            value.scriptName
          }, commonly used for ${value.purpose}. ${
            value.riskLevel === "LOW"
              ? "It's generally safe."
              : "Monitor for privacy concerns."
          }`,
        };
      }
    }

    // Use AI for truly unknown scripts
    console.log(`[AI Analysis] Analyzing unknown script: ${script.url}`);

    const prompt = `Analyze this third-party JavaScript and respond with ONLY valid JSON:

Script URL: ${script.url}
Domain: ${scriptDomain}

Determine:
1. What service is this? (name)
2. What does it do? (purpose)
3. What data does it collect?
4. Risk level: LOW, MEDIUM, HIGH, or CRITICAL
5. Should we ALLOW, MONITOR, or BLOCK it?

JSON format:
{
  "scriptName": "Service Name",
  "purpose": "What it does",
  "dataCollected": ["data1", "data2"],
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "reasoning": "Why this risk",
  "recommendation": "ALLOW|MONITOR|BLOCK",
  "userFriendlyExplanation": "Plain English explanation"
}`;

    const response: any = await env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          {
            role: "system",
            content:
              "You are a cybersecurity expert. Respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 600,
      }
    );

    const text = response?.response || response?.result || response || "";
    const jsonMatch = String(text).match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        scriptUrl: script.url,
        destinations: [scriptDomain],
        ...analysis,
      };
    }

    throw new Error("No valid JSON in AI response");
  } catch (error) {
    console.error("[AI Analysis Failed]", script.url, error);

    // Final fallback for truly unknown scripts
    const scriptDomain = new URL(script.url).hostname;
    return {
      scriptUrl: script.url,
      scriptName: "Unrecognized Third-Party Script",
      purpose: "Unknown - requires manual review",
      dataCollected: ["Unknown - should be investigated"],
      destinations: [scriptDomain],
      riskLevel: "MEDIUM",
      reasoning:
        "This script is from an unfamiliar domain and should be reviewed by a developer",
      recommendation: "MONITOR",
      userFriendlyExplanation: `This script is from ${scriptDomain}, which is not in our database of known services. We recommend reviewing what this script does before allowing it.`,
    };
  }
}
