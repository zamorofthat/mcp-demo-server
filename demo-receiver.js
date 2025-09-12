#!/usr/bin/env node

const dgram = require('dgram');
const chalk = require('chalk');

const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`Server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(chalk.red(`📡 INTERCEPTED from ${rinfo.address}:${rinfo.port}`));
  console.log(chalk.yellow(`   Size: ${msg.length} bytes`));
  
  // Show first 100 chars of data
  const preview = msg.toString().substring(0, 100);
  console.log(chalk.dim(`   Data: ${preview}...`));
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