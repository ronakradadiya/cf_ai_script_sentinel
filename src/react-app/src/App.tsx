import { useState } from "react";
import "./App.css";

interface ScriptInfo {
  url: string;
  timestamp: number;
}

interface AnalysisResult {
  success: boolean;
  url: string;
  totalScripts: number;
  thirdPartyScripts: number;
  scripts: ScriptInfo[];
}

function App() {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeWebsite = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data: AnalysisResult = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
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
            onKeyUp={(e) => e.key === "Enter" && analyzeWebsite()}
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
            <p>Analyzing scripts... This may take 15-20 seconds</p>
          </div>
        )}

        {analysis && (
          <div className="results">
            <h2>Security Report</h2>

            <div className="summary">
              <div className="stat">
                <span className="label">Total Scripts:</span>
                <span className="value">{analysis.totalScripts}</span>
              </div>
              <div className="stat">
                <span className="label">Third-Party:</span>
                <span className="value">{analysis.thirdPartyScripts}</span>
              </div>
            </div>

            <div className="scripts-list">
              {analysis.scripts?.map((script, i) => (
                <div key={i} className="script-card">
                  <div className="script-header">
                    <h3>{new URL(script.url).hostname}</h3>
                  </div>
                  <p className="script-url">{script.url}</p>
                  <p className="timestamp">
                    Detected: {new Date(script.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
