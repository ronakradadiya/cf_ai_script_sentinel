import type {
  Env,
  ChatRequest,
  ChatResponse,
  AnalysisResult,
  ScriptAnalysis,
} from "../types";

export async function handleChatMessage(
  message: string,
  analysisData: AnalysisResult | undefined,
  env: Env
): Promise<string> {
  try {
    // Build context from analysis
    const context = buildAnalysisContext(analysisData);

    const systemPrompt = `You are a cybersecurity expert assistant helping users understand third-party scripts on websites.

${context}

Answer user questions about:
- Script purposes and risks
- Data collection and privacy
- GDPR/CCPA compliance
- Security recommendations
- Technical explanations in plain English

Be concise, accurate, and helpful. If you don't know something, say so.`;

    const response: any = await env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.4,
        max_tokens: 800,
      }
    );

    const reply =
      response?.response ||
      response?.result ||
      response ||
      "Sorry, I could not generate a response.";
    return String(reply);
  } catch (error) {
    console.error("[Chat Error]", error);
    return "Sorry, I encountered an error processing your question. Please try again.";
  }
}

function buildAnalysisContext(
  analysisData: AnalysisResult | undefined
): string {
  if (!analysisData || !analysisData.analyses) {
    return "No analysis data available yet. User is asking a general question about scripts.";
  }

  const { url, totalScripts, thirdPartyScripts, analyses } = analysisData;

  // Summarize analysis for AI context
  const scriptSummaries = analyses
    .map((script: ScriptAnalysis) => {
      return `- ${script.scriptName} (${script.scriptUrl})
  Purpose: ${script.purpose}
  Risk: ${script.riskLevel}
  Data Collected: ${script.dataCollected.join(", ")}
  Recommendation: ${script.recommendation}`;
    })
    .join("\n\n");

  return `ANALYSIS CONTEXT:
Website analyzed: ${url}
Total scripts: ${totalScripts}
Third-party scripts: ${thirdPartyScripts}

Detected Scripts:
${scriptSummaries}

Use this context to answer the user's questions accurately.`;
}
