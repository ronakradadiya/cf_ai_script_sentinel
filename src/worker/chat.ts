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

ANSWER GUIDELINES:
- Answer the user's question ONLY about the detected third-party scripts on this website.
- Summarize your answer in UNDER 200 words.
- Focus on the most important points.
- If the answer has multiple scripts or items, use bullet points and include NO MORE THAN 5 items, even if the question asks for "all" or "every".
- If asked for an extremely detailed or long list, say "Only showing top 5 due to space limits."
- Your response MUST fit in a single short message.
- If you cannot answer, say so directly.

Always be clear, direct, and user-friendly.
${context}`;

    const response: any = await env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }
    );

    let reply = String(
      response?.response ||
        response?.result ||
        response ||
        "Sorry, I could not generate a response."
    );

    if (reply.length > 1800 && !reply.trim().endsWith(".")) {
      // Remove trailing incomplete word.
      reply =
        reply.slice(0, reply.lastIndexOf(" ")) +
        "\n\n⚠️ Response truncated. Ask for specific details if needed.";
    }
    return reply;
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
