// Simple test script to verify AI functionality
import { geminiService } from './services/gemini.ts';

async function testAI() {
  console.log('Testing AI functionality...\n');

  // Check if API key is set
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    console.log('❌ VITE_OPENROUTER_API_KEY is not set or is using placeholder value');
    console.log('Please set your OpenRouter API key in .env.local:');
    console.log('VITE_OPENROUTER_API_KEY=your_actual_openrouter_api_key_here');
    console.log('\nGet your API key from: https://openrouter.ai/keys');
    return;
  }

  console.log('✅ API key is configured\n');

  // Test 1: Translation
  console.log('1. Testing Translation:');
  try {
    const translated = await geminiService.translate('Hello, how are you?', 'ar');
    console.log('   English: "Hello, how are you?"');
    console.log('   Arabic:', translated);
    console.log('   ✅ Translation test passed\n');
  } catch (error) {
    console.log('   ❌ Translation test failed:', error.message, '\n');
  }

  // Test 2: Chat Summarization
  console.log('2. Testing Chat Summarization:');
  try {
    const messages = [
      { senderName: 'John', text: 'Aircraft at gate 12 needs fueling' },
      { senderName: 'Sarah', text: 'Fueling team dispatched' },
      { senderName: 'Mike', text: 'Fueling complete, ready for departure' }
    ];
    const summary = await geminiService.summarizeChat(messages);
    console.log('   Summary:', summary);
    console.log('   ✅ Chat summarization test passed\n');
  } catch (error) {
    console.log('   ❌ Chat summarization test failed:', error.message, '\n');
  }

  // Test 3: Safety Report Analysis
  console.log('3. Testing Safety Report Analysis:');
  try {
    const report = 'Fuel spill at gate 15. Aircraft Boeing 737-800. Involved ground crew member Ahmed Hassan.';
    const analysis = await geminiService.analyzeSafetyReport(report);
    if (analysis) {
      console.log('   Summary:', analysis.summary);
      console.log('   Locations:', analysis.entities.locations);
      console.log('   Equipment:', analysis.entities.equipment);
      console.log('   Personnel:', analysis.entities.personnel);
      console.log('   ✅ Safety analysis test passed\n');
    } else {
      console.log('   ❌ Safety analysis returned null\n');
    }
  } catch (error) {
    console.log('   ❌ Safety analysis test failed:', error.message, '\n');
  }

  // Test 4: Briefing Generation
  console.log('4. Testing Briefing Generation:');
  try {
    const tasks = [
      { title: 'Fuel aircraft at gate 12', location: 'Gate 12', status: 'in_progress' },
      { title: 'Load cargo on flight EK203', location: 'Cargo bay 3', status: 'pending' },
      { title: 'Clean passenger cabin', location: 'Gate 8', status: 'completed' }
    ];
    const briefing = await geminiService.generateBriefing(tasks);
    console.log('   Briefing:', briefing);
    console.log('   ✅ Briefing generation test passed\n');
  } catch (error) {
    console.log('   ❌ Briefing generation test failed:', error.message, '\n');
  }

  console.log('AI testing completed!');
}

// Run the test
testAI().catch(console.error);
