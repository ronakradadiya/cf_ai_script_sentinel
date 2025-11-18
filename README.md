# CF AI Script Sentinel 🛡️

A full-stack web security application that analyzes third-party JavaScript on websites using Cloudflare Workers, Puppeteer, and AI to detect potential security risks.

## 🚀 Live Demo

**URL**: https://cf-ai-script-sentinel.pages.dev

## 🌟 Features

- **Automated Script Detection**: Crawls websites and identifies all third-party JavaScript files
- **AI-Powered Security Analysis**: Uses Cloudflare AI to analyze scripts for security risks, data collection practices, and privacy concerns
- **Interactive Chat**: Ask questions about detected scripts and get AI-powered explanations
- **Persistent Storage**: Saves analysis history using Durable Objects
- **Modern UI**: Clean, responsive React interface with real-time analysis feedback

## 🏗️ Architecture

- **Frontend**: React + Vite + TypeScript
- **Backend**: Cloudflare Workers + Hono
- **Browser Automation**: Cloudflare Browser Rendering (Puppeteer)
- **AI**: Cloudflare AI (Llama 3.1 70B)
- **Storage**: Durable Objects + KV
- **Deployment**: Cloudflare Pages (Frontend) + Cloudflare Workers (Backend)

## 📋 Prerequisites

- Node.js 20+
- pnpm (or npm)
- Cloudflare account
- Wrangler CLI installed globally

## 🛠️ Local Development Setup

### 1. Clone the Repository

    git clone https://github.com/ronakradadiya/cf_ai_script_sentinel.git
    cd cf_ai_script_sentinel

### 2. Install Dependencies

    pnpm install

### 3. Configure Environment Variables

Create a `.env` file in the project root:

    VITE_API_BASE_URL=http://localhost:8787

### 4. Update Wrangler Configuration

Edit `wrangler.toml` and update your account ID and KV namespace ID.

### 5. Run Backend (Worker)

    pnpm run dev:worker

The Worker will start at `http://localhost:8787`

### 6. Run Frontend (React App)

In a separate terminal:

    pnpm run dev:react

The frontend will start at `http://localhost:5173`

### 7. Test the Application

1. Open `http://localhost:5173` in your browser
2. Enter a website URL (e.g., `https://example.com`)
3. Click "Analyze Scripts"
4. View the AI security analysis results
5. Use the chat feature to ask questions about the scripts

## 🧠 How It Works

1. **User Input**: Enter a website URL in the frontend
2. **Script Detection**: Worker launches a headless browser using Puppeteer to detect all third-party scripts
3. **AI Analysis**: Each script URL is analyzed by Cloudflare AI for security risks, tracking, and data practices
4. **Results Display**: Frontend displays comprehensive security analysis with risk levels
5. **Interactive Chat**: Users can ask follow-up questions about the detected scripts
6. **Persistence**: Analysis results are stored in Durable Objects for future reference

## 🔒 Security Considerations

- Scripts are analyzed by URL only (not content) to avoid executing malicious code
- Browser automation runs in isolated Cloudflare Browser Rendering environment
- CORS is configured to prevent unauthorized access
- No user data is stored beyond analysis results

## 🛡️ Technologies Used

- **Cloudflare Workers**: Serverless compute platform
- **Cloudflare Pages**: Static site hosting
- **Cloudflare Browser Rendering**: Headless browser automation
- **Cloudflare AI**: AI inference with Llama 3.1 70B
- **Durable Objects**: Stateful serverless storage
- **Hono**: Lightweight web framework
- **React**: Frontend UI library
- **Vite**: Fast build tool
- **TypeScript**: Type-safe development

## 🙏 Acknowledgments

Built for the Cloudflare AI Challenge using Cloudflare's powerful edge computing platform.
