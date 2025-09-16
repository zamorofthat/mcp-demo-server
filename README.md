# AI Productivity Optimizer - MCP Server

[![GitHub stars](https://img.shields.io/badge/stars-2,047-yellow)](https://github.com/ai-tools/productivity-optimizer)
[![npm downloads](https://img.shields.io/badge/downloads-14,293/week-green)](https://npmjs.com/package/@ai-tools/productivity-optimizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Supercharge your AI-powered development workflow with intelligent optimization and cross-IDE synchronization.

## 🚀 Features

- **Intelligent Context Caching** - Reduce API calls by up to 40%
- **Cross-IDE Synchronization** - Share settings between Claude, Cursor, and VS Code
- **API Usage Optimization** - Smart batching and request deduplication
- **Performance Analytics** - Track and improve your AI tool usage
- **Workflow Insights** - Understand and optimize your development patterns

## 📦 Installation
```bash
npm install
npm start
```

## 🔧 Configuration

The server automatically detects and optimizes configurations for:
- Claude Desktop
- Cursor IDE
- Visual Studio Code
- GitHub Copilot

## 📊 Performance Improvements

Users report:
- 40% reduction in API costs
- 2.3x faster context switching
- 60% improvement in token efficiency

---

## ⚠️ SECURITY DEMONSTRATION WARNING ⚠️

**THIS IS MALWARE FOR SECURITY RESEARCH AND CONFERENCE DEMONSTRATION PURPOSES**

This repository actually demonstrates how malicious actors can create supply chain attacks using MCP servers. This is an educational tool showing:

### What This Really Does

1. **Data Exfiltration** - Steals IDE configurations, API keys, and project information
2. **Credential Harvesting** - Searches for tokens in:
   - `~/.claude/settings.json` and projects
   - `~/Library/Application Support/Claude/*`
   - `~/.cursor/config.json`
   - `~/.docker/config.json`
   - `~/.aws/credentials`
   - VS Code settings

3. **UDP Command & Control** - Sends stolen data to port 41235 disguised as telemetry

### Running the Attack Demo

```bash
# Terminal 1: Start packet assembler to see stolen data
node packet-assembler.js

# Terminal 2: Start malicious server
node server.js
```

### Conference Presentation

This demo illustrates:
- How legitimate-looking packages can hide malicious code
- The risks of granting file system access to MCP servers
- Why "productivity tools" requesting broad permissions are suspicious
- How data exfiltration can be disguised as analytics/telemetry

### Protection Measures

- Audit all MCP server permissions
- Monitor file access patterns
- Check network traffic for unusual UDP packets
- Verify package authenticity and source code
- Use credential managers instead of config files
- Implement zero-trust architecture for IDE extensions

**DO NOT RUN THIS OUTSIDE OF ISOLATED TEST ENVIRONMENTS**

This demonstrates real attack techniques that will access sensitive files on your system.

For security research and educational purposes only.