const fs = require('fs');
const path = require('path');

// Function to check if .env.local exists and read environment variables
function checkEnvironment() {
  console.log('Checking environment configuration...\n');

  const envPath = path.join(__dirname, '.env.local');

  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file does not exist');
    console.log('Please create .env.local with the following variables:');
    console.log('VITE_SUPABASE_URL=your_supabase_url');
    console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
    console.log('VITE_OPENROUTER_API_KEY=your_openrouter_api_key');
    return;
  }

  console.log('✅ .env.local file exists\n');

  // Read the file content
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  const envVars = {};
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  // Check Supabase configuration
  console.log('Checking Supabase configuration:');
  const supabaseUrl = envVars['VITE_SUPABASE_URL'];
  const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];

  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
    console.log('❌ VITE_SUPABASE_URL is not set or using placeholder');
  } else {
    console.log('✅ VITE_SUPABASE_URL is set');
  }

  if (!supabaseKey || supabaseKey === 'your_supabase_anon_key') {
    console.log('❌ VITE_SUPABASE_ANON_KEY is not set or using placeholder');
  } else {
    console.log('✅ VITE_SUPABASE_ANON_KEY is set');
  }

  // Check OpenRouter configuration
  console.log('\nChecking OpenRouter configuration:');
  const openRouterKey = envVars['VITE_OPENROUTER_API_KEY'];

  if (!openRouterKey || openRouterKey === 'your_openrouter_api_key_here') {
    console.log('❌ VITE_OPENROUTER_API_KEY is not set or using placeholder');
    console.log('Get your API key from: https://openrouter.ai/keys');
  } else {
    console.log('✅ VITE_OPENROUTER_API_KEY is set');
  }

  console.log('\nEnvironment check completed!');
}

// Run the check
checkEnvironment();
