import { useState } from "react";
import "./App.css";
import { API_BASE_URL } from "./constants";

interface ScriptInfo {
  url: string;
  timestamp: number;
}

interface ScriptAnalysis {
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

interface AnalysisResult {
  success: boolean;
  url: string;
  totalScripts: number;
  thirdPartyScripts: number;
  scripts: ScriptInfo[];
  analyses?: ScriptAnalysis[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function App() {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [sessionId] = useState<string>(
    () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const analyzeWebsite = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setChatMessages([]);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data: AnalysisResult = await response.json();
      setAnalysis(data);

      // Initialize chat session
      await fetch(`${API_BASE_URL}/chat/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, analysisData: data }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !analysis) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput,
          sessionId,
          analysisContext: analysis,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply,
        timestamp: data.timestamp,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          "Sorry, there was an error answering your question. The AI may have been overloaded. Please ask again with a specific question.",
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setChatInput(question);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "#10b981";
      case "MEDIUM":
        return "#f59e0b";
      case "HIGH":
        return "#ef4444";
      case "CRITICAL":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const getRiskEmoji = (level: string) => {
    switch (level) {
      case "LOW":
        return "🟢";
      case "MEDIUM":
        return "🟡";
      case "HIGH":
        return "🟠";
      case "CRITICAL":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "LOW":
        return "LOW RISK";
      case "MEDIUM":
        return "MEDIUM RISK";
      case "HIGH":
        return "HIGH RISK";
      case "CRITICAL":
        return "CRITICAL RISK";
      default:
        return level;
    }
  };

  const getRiskExplanation = (level: string) => {
    switch (level) {
      case "LOW":
        return "Safe to use - minimal concerns";
      case "MEDIUM":
        return "Monitor this - collects data";
      case "HIGH":
        return "Caution - privacy risks";
      case "CRITICAL":
        return "Dangerous - should block";
      default:
        return "";
    }
  };

  return (
    <div className="App">
      <header>
        <h1>🛡️ Script Sentinel</h1>
        <p>AI-Powered Third-Party Script Security Analyzer</p>
      </header>

      <main>
        <div className="analyze-section">
          <input
            type="text"
            placeholder="Enter website URL (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyzeWebsite()}
          />
          <button onClick={analyzeWebsite} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Website"}
          </button>
        </div>

        {error && (
          <div className="error">
            <p>❌ {error}</p>
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing scripts with AI... This may take 20-30 seconds</p>
          </div>
        )}

        {analysis && (
          <div className="results">
            <h2>Security Report for {new URL(analysis.url).hostname}</h2>

            <div className="summary">
              <div className="stat">
                <span className="label">Total Scripts:</span>
                <span className="value">{analysis.totalScripts}</span>
              </div>
              <div className="stat">
                <span className="label">Third-Party:</span>
                <span className="value">{analysis.thirdPartyScripts}</span>
              </div>
              <div className="stat">
                <span className="label">Analyzed:</span>
                <span className="value">{analysis.analyses?.length || 0}</span>
              </div>
            </div>

            {/* Risk Legend */}
            <div className="risk-legend">
              <h3>🎯 Risk Level Guide</h3>
              <div className="legend-items">
                <div className="legend-item">
                  <span
                    className="legend-badge"
                    style={{ background: "#10b981" }}
                  >
                    🟢 LOW RISK
                  </span>
                  <span className="legend-text">
                    Safe - Legitimate services
                  </span>
                </div>
                <div className="legend-item">
                  <span
                    className="legend-badge"
                    style={{ background: "#f59e0b" }}
                  >
                    🟡 MEDIUM RISK
                  </span>
                  <span className="legend-text">
                    Monitor - Tracks user data
                  </span>
                </div>
                <div className="legend-item">
                  <span
                    className="legend-badge"
                    style={{ background: "#ef4444" }}
                  >
                    🟠 HIGH RISK
                  </span>
                  <span className="legend-text">
                    Caution - Privacy concerns
                  </span>
                </div>
                <div className="legend-item">
                  <span
                    className="legend-badge"
                    style={{ background: "#dc2626" }}
                  >
                    🔴 CRITICAL RISK
                  </span>
                  <span className="legend-text">Dangerous - Should block</span>
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="chat-section">
              <h3>💬 Ask Questions About This Analysis</h3>
              <div className="chat-container">
                <div className="chat-messages">
                  {chatMessages.length === 0 && (
                    <div className="chat-placeholder">
                      <p>
                        <strong>Tip:</strong> Ask about a specific script or
                        risk to get the most relevant, detailed answer.
                        <br />
                        <span>
                          Broad questions like “list all scripts” will show only
                          the quickest summary.
                        </span>
                      </p>
                      <div className="suggested-questions">
                        <button
                          className="question-button"
                          onClick={() =>
                            handleQuickQuestion(
                              "Which top 3 scripts should I monitor?"
                            )
                          }
                        >
                          🔍 Top scripts to monitor
                        </button>
                        <button
                          className="question-button"
                          onClick={() =>
                            handleQuickQuestion("Is this GDPR compliant?")
                          }
                        >
                          ⚖️ GDPR compliant?
                        </button>
                        <button
                          className="question-button"
                          onClick={() =>
                            handleQuickQuestion(
                              "What are the biggest privacy risks?"
                            )
                          }
                        >
                          🚫 Biggest risks?
                        </button>
                        <button
                          className="question-button"
                          onClick={() =>
                            handleQuickQuestion(
                              "Summarize this in 3 key points"
                            )
                          }
                        >
                          💡 Quick summary
                        </button>
                      </div>
                    </div>
                  )}

                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`chat-message ${msg.role}`}>
                      <div className="message-header">
                        <span className="message-role">
                          {msg.role === "user" ? "👤 You" : "🤖 AI Assistant"}
                        </span>
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="message-content">{msg.content}</div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="chat-message assistant">
                      <div className="message-header">
                        <span className="message-role">🤖 AI Assistant</span>
                      </div>
                      <div className="message-content typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="chat-input-container">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Ask a question about the scripts..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && !chatLoading && sendChatMessage()
                    }
                    disabled={chatLoading}
                  />
                  <button
                    className="chat-send"
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            {analysis.analyses && analysis.analyses.length > 0 && (
              <div className="analyses-list">
                <h3>AI Analysis Results</h3>
                {analysis.analyses.map((script, i) => (
                  <div
                    key={i}
                    className="analysis-card"
                    style={{
                      borderLeft: `4px solid ${getRiskColor(script.riskLevel)}`,
                    }}
                  >
                    <div className="analysis-header">
                      <h4>
                        {getRiskEmoji(script.riskLevel)} {script.scriptName}
                      </h4>
                      <div className="risk-badge-container">
                        <span
                          className="risk-badge"
                          style={{ background: getRiskColor(script.riskLevel) }}
                        >
                          {getRiskLabel(script.riskLevel)}
                        </span>
                        <span className="risk-explanation">
                          {getRiskExplanation(script.riskLevel)}
                        </span>
                      </div>
                    </div>

                    <p className="purpose">
                      <strong>Purpose:</strong> {script.purpose}
                    </p>

                    <p className="explanation">
                      {script.userFriendlyExplanation}
                    </p>

                    <div className="details">
                      <div className="detail-section">
                        <strong>Data Collected:</strong>
                        <ul>
                          {script.dataCollected.map((data, j) => (
                            <li key={j}>{data}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="detail-section">
                        <strong>Recommendation:</strong>
                        <span
                          className={`recommendation ${script.recommendation.toLowerCase()}`}
                        >
                          {script.recommendation}
                        </span>
                      </div>
                    </div>

                    <details className="script-details">
                      <summary>Technical Details</summary>
                      <p className="script-url">{script.scriptUrl}</p>
                      <p>
                        <strong>Reasoning:</strong> {script.reasoning}
                      </p>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
