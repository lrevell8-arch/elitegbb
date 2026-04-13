// Simple Player Loader - Works with current database schema
// This creates only players with the existing columns
// For full evaluation builder support, run the schema migration first
//
// Usage: node scripts/load_simple_players.js

const SAMPLE_PLAYERS = [
  {
    player_name: "Maya Johnson",
    player_key: "mayaj2028",
    grad_class: "2028",
    gender: "female",
    dob: "2012-03-15",
    school: "Lincoln Academy",
    city: "Atlanta",
    state: "GA",
    primary_position: "PG",
    secondary_position: "SG",
    height: "5'6\"",
    weight: 120,
    parent_name: "Angela Johnson",
    parent_email: "angela.johnson@example.com",
    parent_phone: "404-555-0123",
    player_email: "maya.johnson.test@example.com",
    level: "prospect",
    verified: true,
    instagram_handle: "@mayajohnson2028"
  },
  {
    player_name: "Sophia Williams",
    player_key: "sophiaw2029",
    grad_class: "2029",
    gender: "female",
    dob: "2013-07-22",
    school: "Riverside Academy",
    city: "Houston",
    state: "TX",
    primary_position: "SF",
    secondary_position: "PF",
    height: "5'8\"",
    weight: 135,
    parent_name: "Marcus Williams",
    parent_email: "marcus.williams@example.com",
    parent_phone: "713-555-0456",
    player_email: "sophia.williams.test@example.com",
    level: "rising_star",
    verified: true,
    instagram_handle: "@sophiaw2029"
  },
  {
    player_name: "Zoe Martinez",
    player_key: "zoem2027",
    grad_class: "2027",
    gender: "female",
    dob: "2011-11-08",
    school: "St. Mary's School",
    city: "Chicago",
    state: "IL",
    primary_position: "SG",
    secondary_position: "SF",
    height: "5'7\"",
    weight: 128,
    parent_name: "Carlos Martinez",
    parent_email: "carlos.martinez@example.com",
    parent_phone: "312-555-0789",
    player_email: "zoe.martinez.test@example.com",
    level: "elite",
    verified: true,
    instagram_handle: "@zoem2027"
  },
  {
    player_name: "Ava Thompson",
    player_key: "avat2029",
    grad_class: "2029",
    gender: "female",
    dob: "2013-05-30",
    school: "Jefferson Academy",
    city: "Los Angeles",
    state: "CA",
    primary_position: "PG",
    secondary_position: null,
    height: "5'4\"",
    weight: 115,
    parent_name: "Jennifer Thompson",
    parent_email: "jennifer.thompson@example.com",
    parent_phone: "323-555-0321",
    player_email: "ava.thompson.test@example.com",
    level: "5ball_recruit",
    verified: true,
    instagram_handle: "@avathompson2029"
  },
  {
    player_name: "Isabella Chen",
    player_key: "isabellac2028",
    grad_class: "2028",
    gender: "female",
    dob: "2012-09-14",
    school: "Eastside Prep",
    city: "Seattle",
    state: "WA",
    primary_position: "C",
    secondary_position: "PF",
    height: "5'10\"",
    weight: 145,
    parent_name: "David Chen",
    parent_email: "david.chen@example.com",
    parent_phone: "206-555-0654",
    player_email: "isabella.chen.test@example.com",
    level: "prospect",
    verified: true,
    instagram_handle: "@isabellachen2028"
  }
];

async function loadPlayers() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const BACKEND_URL = process.env.BACKEND_URL || 'https://app.elitegbb.com';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    process.exit(1);
  }

  console.log('Loading sample players...');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  const createdPlayers = [];

  for (const player of SAMPLE_PLAYERS) {
    try {
      // Check if player already exists
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/players?player_key=eq.${player.player_key}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const existing = await checkRes.json();

      if (existing && existing.length > 0) {
        console.log(`  Player ${player.player_name} already exists (ID: ${existing[0].id})`);
        createdPlayers.push(existing[0]);
        continue;
      }

      // Create player
      const res = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(player)
      });

      if (!res.ok) {
        const error = await res.text();
        console.error(`  Failed to create ${player.player_name}: ${error}`);
        continue;
      }

      const data = await res.json();
      createdPlayers.push(data[0]);
      console.log(`  Created player: ${player.player_name} (ID: ${data[0].id})`);
    } catch (err) {
      console.error(`  Error creating ${player.player_name}: ${err.message}`);
    }
  }

  console.log('');
  console.log('=====================================');
  console.log(`Loaded ${createdPlayers.length} players`);
  console.log('=====================================');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run the schema migration in Supabase SQL Editor:');
  console.log('   - Open: https://app.supabase.com/project/srrasrbsqajtssqlxoju/sql/new');
  console.log('   - Copy and paste: backend/schema_migration_for_evaluation_builder.sql');
  console.log('   - Click "Run"');
  console.log('');
  console.log('2. After migration, run: node scripts/load_test_projects.js');
  console.log('');
  console.log('Created Players:');
  createdPlayers.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.player_name} (${p.player_key}) - ID: ${p.id}`);
  });
}

loadPlayers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
