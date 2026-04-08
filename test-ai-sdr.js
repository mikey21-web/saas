const { runAiSdrWorkflow } = await import('./lib/ai-sdr/ai-sdr.js');

async function testAISDR() {
  console.log('🧪 Testing AI SDR workflow...\n');
  
  // 1. Full workflow test
  const fullResult = await runAiSdrWorkflow({
    agent_id: 'test-sdr',
    user_id: 'test-user',
    entry_point: 'lead_finder',
    trigger
