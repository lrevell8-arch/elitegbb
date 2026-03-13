#!/usr/bin/env node
/**
 * Debug script for player login blank screen issue
 * Tests the player authentication API endpoints
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.REACT_APP_BACKEND_URL || process.env.BACKEND_URL || 'https://app.elitegbb.com';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Player Login Debug Script');
console.log('==============================');
console.log(`API URL: ${API_URL}`);
console.log(`Supabase URL: ${SUPABASE_URL ? 'Set' : 'NOT SET'}`);
console.log(`Supabase Anon Key: ${SUPABASE_ANON_KEY ? 'Set (hidden)' : 'NOT SET'}`);
console.log('');

// Test player credentials from test data
const TEST_PLAYERS = [
  { player_key: 'MJ2028', password: 'test123', name: 'Maya Johnson' },
  { player_key: 'SW2029', password: 'test123', name: 'Sophia Williams' },
  { player_key: 'ZM2027', password: 'test123', name: 'Zoe Martinez' },
];

async function testEndpoint(method, url, data = null, headers = {}) {
  try {
    console.log(`\n📡 Testing ${method} ${url}`);
    const response = await axios({
      method,
      url,
      data,
      headers,
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2).substring(0, 500));
    return { success: response.status >= 200 && response.status < 300, data: response.data, status: response.status };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('   Connection refused - server may be down or URL incorrect');
    }
    if (error.code === 'ENOTFOUND') {
      console.log('   DNS lookup failed - URL may be incorrect');
    }
    return { success: false, error: error.message };
  }
}

async function runDiagnostics() {
  // 1. Test if API is reachable
  console.log('\n1️⃣ Testing API reachability...');
  const healthCheck = await testEndpoint('GET', `${API_URL}/api/health`);
  if (!healthCheck.success) {
    console.log('\n⚠️  API health check failed - trying alternative endpoints...');
    await testEndpoint('GET', `${API_URL}/api/debug/auth`);
  }

  // 2. Test player login endpoint (OPTIONS - CORS preflight)
  console.log('\n2️⃣ Testing CORS preflight...');
  try {
    const corsResponse = await axios.options(`${API_URL}/api/player/login`, {
      headers: {
        'Origin': 'https://app.elitegbb.com',
        'Access-Control-Request-Method': 'POST'
      },
      timeout: 5000,
      validateStatus: () => true
    });
    console.log(`   CORS Status: ${corsResponse.status}`);
    console.log(`   CORS Headers:`, corsResponse.headers['access-control-allow-origin'] || 'none');
  } catch (e) {
    console.log(`   CORS check failed: ${e.message}`);
  }

  // 3. Test player login with test credentials
  console.log('\n3️⃣ Testing player login...');
  for (const player of TEST_PLAYERS) {
    console.log(`\n   Testing ${player.name} (${player.player_key})...`);
    const loginResult = await testEndpoint('POST', `${API_URL}/api/player/login`, {
      player_key: player.player_key,
      password: player.password
    });

    if (loginResult.success && loginResult.data.token) {
      console.log(`   ✅ Login successful for ${player.name}`);
      console.log(`   Token received: ${loginResult.data.token.substring(0, 50)}...`);

      // 4. Test profile endpoint with token
      console.log(`\n4️⃣ Testing profile fetch with token...`);
      const profileResult = await testEndpoint(
        'GET',
        `${API_URL}/api/player/profile`,
        null,
        { 'Authorization': `Bearer ${loginResult.data.token}` }
      );

      if (profileResult.success) {
        console.log(`   ✅ Profile fetch successful`);
        console.log(`   Player: ${profileResult.data.player_name || profileResult.data.preferred_name}`);
      } else {
        console.log(`   ❌ Profile fetch failed: ${JSON.stringify(profileResult.data)}`);
      }
    } else {
      console.log(`   ❌ Login failed for ${player.name}: ${JSON.stringify(loginResult.data)}`);

      // Check if player exists in database
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        console.log(`\n   Checking if player exists in database...`);
        try {
          const checkResult = await axios.get(
            `${SUPABASE_URL}/rest/v1/players?player_key=eq.${player.player_key}&select=id,player_name,verified`,
            {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              },
              timeout: 5000,
              validateStatus: () => true
            }
          );
          if (checkResult.data && checkResult.data.length > 0) {
            console.log(`   Player exists: ${JSON.stringify(checkResult.data[0])}`);
          } else {
            console.log(`   Player NOT found in database - need to run test data loader`);
          }
        } catch (e) {
          console.log(`   Database check failed: ${e.message}`);
        }
      }
    }
  }

  // 5. Check common configuration issues
  console.log('\n5️⃣ Configuration diagnostics...');

  if (!process.env.REACT_APP_BACKEND_URL && !process.env.BACKEND_URL) {
    console.log('   ⚠️  Neither REACT_APP_BACKEND_URL nor BACKEND_URL is set');
    console.log('   Frontend may be using relative URLs which will fail');
  }

  if (!SUPABASE_URL) {
    console.log('   ⚠️  SUPABASE_URL not set - cannot verify database state');
  }

  if (!SUPABASE_ANON_KEY) {
    console.log('   ⚠️  SUPABASE_ANON_KEY not set - cannot verify database state');
  }

  console.log('\n==============================');
  console.log('📝 Summary');
  console.log('==============================');
  console.log('If all tests pass but player still sees blank screen:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Verify CORS headers allow the frontend origin');
  console.log('3. Check that JWT_SECRET matches between frontend and backend');
  console.log('4. Ensure player.verified = true in database');
  console.log('');
  console.log('To fix missing test data:');
  console.log('   node scripts/load_test_projects.js');
}

runDiagnostics().catch(console.error);
