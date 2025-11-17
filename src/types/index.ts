// Cloudflare environment bindings
export interface Env {
  MYBROWSER: Fetcher;
  AI: Ai;
  SCRIPT_ANALYZER: DurableObjectNamespace;
  CACHE: KVNamespace;
}

// Script analysis types
export interface ScriptInfo {
  url: string;
  timestamp: number;
}

export interface ScriptBehavior {
  cookieReads: number;
  cookieWrites: number;
  localStorageWrites: number;
  fetchCalls: FetchCall[];
}

export interface FetchCall {
  url: string;
  method: string;
  timestamp: number;
}

export interface ScriptAnalysis {
  scriptUrl: string;
  scriptName: string;
  purpose: string;
  dataCollected: string[];
  destinations: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reasoning: string;
  recommendation: "ALLOW" | "MONITOR" | "BLOCK";
  userFriendlyExplanation: string;
}

export interface AnalysisResult {
  success: boolean;
  url: string;
  totalScripts: number;
  thirdPartyScripts: number;
  scripts: ScriptInfo[];
  analyses?: ScriptAnalysis[];
  summary?: string;
}

export interface ChatMessage {
  message: string;
  sessionId: string;
  analysisData?: AnalysisResult;
}

export interface ChatResponse {
  reply: string;
}

// Runtime monitoring types
export interface RuntimeEvent {
  type: "cookie_read" | "cookie_write" | "localStorage_write" | "fetch";
  timestamp: number;
  stack?: string;
  url?: string;
  value?: string;
  key?: string;
}
