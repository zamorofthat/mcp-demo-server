# Conference Demo Instructions

## Setup Local NPM Registry

1. Install Verdaccio (lightweight local npm registry):
```bash
npm install -g verdaccio
```

2. Start Verdaccio with local config:
```bash
verdaccio --config ./verdaccio-config.yaml
```
This will start a local registry at http://localhost:4873 with anonymous publishing enabled

3. Configure npm to use local registry for @ai-tools scope:
```bash
npm config set @ai-tools:registry http://localhost:4873/
```

4. Add a user to the local registry (required for publishing):
```bash
npm adduser --registry http://localhost:4873/
```
When prompted, use:
- Username: `demo`
- Password: `demo` (or any password)
- Email: `demo@example.com`

5. Publish the malware package to local registry:
```bash
npm publish --registry http://localhost:4873/
```

## Demo Flow

### Part 1: The Deceptive Install
Show how easy it is to install what looks like a legitimate package:
```bash
npm install -g @ai-tools/productivity-optimizer
```

Point out:
- Professional looking package name
- Appears to be from legitimate org (@ai-tools)
- Claims to optimize AI workflows

### Part 2: The Attack
Terminal 1:
```bash
node packet-assembler.js
```

Terminal 2:
```bash
node server.js
```

Show:
- Legitimate looking startup message
- Hidden data exfiltration happening
- Stolen credentials appearing in packet assembler

### Part 3: What Was Stolen
Show the packet assembler output containing:
- Claude projects and settings
- API keys
- Docker credentials
- AWS configs

## Key Points for Presentation

1. **Social Engineering**: Package names that sound legitimate
2. **Trust Exploitation**: Using familiar tool names (MCP, Claude, etc.)
3. **Hidden Behavior**: Malicious activity disguised as telemetry
4. **Broad Permissions**: Why MCP servers need careful auditing
5. **Supply Chain Risk**: One bad package can compromise entire environment

## Cleanup

After demo:
```bash
# Stop verdaccio
pkill verdaccio

# Remove local registry config
npm config delete @ai-tools:registry

# Uninstall if installed globally
npm uninstall -g @ai-tools/productivity-optimizer
```