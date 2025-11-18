# PROMPTS.md

This document contains the AI prompts used in this assignment.

---

## Script Security Analysis Prompt

    You are a web security expert that analyzes third-party JavaScript files for potential risks.

    Analyze this script:
    - URL: ${scriptUrl}
    - Found on domain: ${pageDomain}

    Provide a structured analysis including:
    1. Risk Level: Assign one of [Low, Medium, High, Critical]
    2. Primary Purpose: What does this script do?
    3. Data Collection: What user data does it collect (cookies, localStorage, tracking pixels)?
    4. Privacy Concerns: What are the privacy implications?
    5. Security Risks: Identify potential vulnerabilities or malicious behavior
    6. Recommendations: Actionable steps to mitigate risks

    Keep the analysis concise and actionable. Focus on specific security and privacy concerns.

---

## Chat Assistant Prompt

    You are a helpful cybersecurity assistant that explains website script analysis to users.

    Context: The user has analyzed a website and received security analysis of third-party scripts.

    Analysis Results: ${analysisContext}
    User Question: ${userMessage}

    Provide a clear explanation in simple words. Focus on:
    - Practical implications for the user's privacy and security
    - What the findings mean in everyday language
    - Actionable advice if relevant

    Be concise. Avoid unnecessary technical details unless asked.

---

## Development Notes

Key prompts used during development:

- "How do I use Cloudflare Browser Rendering (Puppeteer) in a Worker to detect all third-party JavaScript files on a webpage ?"
- "How do I implement request interception in Puppeteer to capture JavaScript file requests ?"
- "How to handle Puppeteer page timeout errors gracefully ?"
- "Explain how to properly close browser instances and pages in Puppeteer to avoid memory leaks"
- "Tell me the correct wrangler.toml configuration for Durable Objects"
- "How do I set up Durable Objects in Cloudflare Workers to store analysis results and chat history ?"
- "How do I create a chat session storage system using Durable Objects that persists messages and analysis context ?"
- "How do I limit the number of sentences in chat responses ?"
- "Will the max_tokens set to 800 break for longer text ?"
- "Summarize the answer strictly under 200 words. What are better approaches for controlling AI response length ?"
- "How do I add API versioning with /api/v1/ prefix to my Hono routes ?"
- "What does this error mean - Configuration file cannot contain both main and pages_build_output_dir"
