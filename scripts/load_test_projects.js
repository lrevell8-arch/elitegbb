// Test Data Loader for Evaluation Builder
// This script loads sample projects with player data for testing the evaluation builder
//
// Usage: node scripts/load_test_projects.js
//
// Required environment variables:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - BACKEND_URL (e.g., http://localhost:8787 or https://app.elitegbb.com)

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
    verified: true
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
    verified: true
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
    verified: true
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
    verified: true
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
    verified: true
  }
];

const SAMPLE_INTAKE_SUBMISSIONS = [
  {
    self_words: "Determined, Leader, Clutch",
    strength: "My greatest strength is my ability to stay calm under pressure and make smart decisions in clutch moments. I have excellent court vision and can find open teammates even when the defense collapses on me.",
    improvement: "I need to work on my off-hand finishing. I tend to favor my right hand too much around the rim, and better defenders are starting to pick up on that tendency.",
    separation: "What separates me is my work ethic and basketball IQ. I watch hours of film and study the game. I understand spacing, timing, and how to make my teammates better.",
    adversity_response: "Last season I sprained my ankle mid-season and had to sit out for three weeks. It was frustrating watching my team struggle without me, but I used that time to study film and become a better vocal leader from the bench. When I returned, I was actually a smarter player and helped lead us to the playoffs.",
    pride_tags: ["leadership", "basketball_iq", "clutch_performer"],
    ppg: 14.5,
    apg: 6.2,
    rpg: 4.8,
    spg: 2.1,
    bpg: 0.5,
    fg_pct: 45.2,
    three_pct: 38.5,
    ft_pct: 78.0,
    games_played: 24,
    film_links: ["https://youtube.com/watch?v=example1", "https://hudl.com/video/example1"],
    highlight_links: ["https://youtube.com/watch?v=highlight1"],
    level: "AAU",
    team_names: "Atlanta Lady Panthers",
    iq_self_rating: 8,
    goal: "Play college basketball at a high academic Division I school while pursuing a degree in business or sports medicine."
  },
  {
    self_words: "Strong, Relentless, Worker",
    strength: "My greatest strength is my physicality and rebounding. I box out every possession and fight for every loose ball. I take pride in doing the dirty work that doesn't show up in the stats.",
    improvement: "I need to expand my offensive game beyond the paint. I'm working on my mid-range jumper and developing a consistent face-up game to become a more versatile threat.",
    separation: "What separates me is my motor and toughness. I never take plays off and I'm willing to do whatever it takes to help my team win. Coaches can count on me to bring energy every single game.",
    adversity_response: "During my freshman year, I was cut from the varsity team and had to play JV. Instead of quitting, I used that as motivation. I worked out twice a day and focused on improving my skills. By sophomore year, I not only made varsity but started every game. That experience taught me that setbacks are just setups for comebacks.",
    pride_tags: ["rebounding", "physicality", "work_ethic"],
    ppg: 12.3,
    apg: 3.5,
    rpg: 8.2,
    spg: 1.8,
    bpg: 1.2,
    fg_pct: 52.1,
    three_pct: 28.0,
    ft_pct: 65.5,
    games_played: 22,
    film_links: ["https://youtube.com/watch?v=example2"],
    highlight_links: [],
    level: "School",
    team_names: "Riverside Ravens",
    iq_self_rating: 7,
    goal: "Earn a scholarship to play basketball at a competitive Division II program and study kinesiology."
  },
  {
    self_words: "Shooter, Competitor, Student",
    strength: "My greatest strength is my shooting ability. I have a quick, consistent release and can shoot off the catch or off the dribble. I space the floor and make defenders pay for helping off me.",
    improvement: "I need to improve my defensive versatility. I'm a good team defender but need to work on my on-ball defense against quicker guards and my ability to fight through screens.",
    separation: "What separates me is my shot preparation and footwork. I come off screens ready to shoot, and I put in countless hours perfecting my mechanics. I also study defenders to know their tendencies.",
    adversity_response: "I went through a major shooting slump last season where I couldn't make anything for five straight games. It was mentally tough, but my coach worked with me on my form and I realized I had developed a slight hitch in my release. I spent two weeks doing nothing but form shooting before and after practice. I came back and shot 45% from three the rest of the season.",
    pride_tags: ["shooting", "footwork", "preparation"],
    ppg: 16.8,
    apg: 4.1,
    rpg: 5.5,
    spg: 2.5,
    bpg: 0.8,
    fg_pct: 48.5,
    three_pct: 42.3,
    ft_pct: 82.0,
    games_played: 28,
    film_links: ["https://youtube.com/watch?v=example3", "https://hudl.com/video/example3"],
    highlight_links: ["https://youtube.com/watch?v=highlight3"],
    level: "AAU",
    team_names: "Chicago Sky Elite",
    iq_self_rating: 9,
    goal: "Play at a Power Five conference school with strong academics and compete for a national championship."
  },
  {
    self_words: "Playmaker, Floor General, Quick",
    strength: "My greatest strength is my passing ability and court awareness. I can see plays develop before they happen and deliver passes that put my teammates in position to score. I control the tempo of the game.",
    improvement: "I need to become more of a scoring threat myself. Sometimes I pass up open shots to look for the pass. I need to develop a consistent jumper so defenders have to respect my shot.",
    separation: "What separates me is my speed and decision-making. I push the ball in transition and make quick decisions. I'm a true point guard who prioritizes winning over stats.",
    adversity_response: "My team was down by 10 with two minutes left in the championship game. Our star player had fouled out and everyone thought we were done. I called a huddle and told my teammates to trust me and trust each other. I scored 8 straight points and assisted on the game-winning shot. That taught me that leadership isn't just about what you do when things are going well, but how you respond when everything is on the line.",
    pride_tags: ["passing", "speed", "unselfish"],
    ppg: 11.2,
    apg: 7.8,
    rpg: 3.2,
    spg: 3.0,
    bpg: 0.2,
    fg_pct: 42.0,
    three_pct: 35.5,
    ft_pct: 75.0,
    games_played: 20,
    film_links: [],
    highlight_links: [],
    level: "School",
    team_names: "Jefferson Jaguars",
    iq_self_rating: 8,
    goal: "Earn an athletic scholarship to play point guard at a Division I program with a winning tradition."
  },
  {
    self_words: "Protector, Anchor, Presence",
    strength: "My greatest strength is my rim protection and ability to anchor a defense. I alter shots without fouling and communicate well with my teammates on defensive rotations.",
    improvement: "I need to improve my offensive versatility. Right now I'm mostly a catch-and-finish player around the rim. I want to develop a short corner jumper and improve my passing reads from the post.",
    separation: "What separates me is my defensive impact. I change how opponents approach the paint. I'm also a good screener who creates space for my guards and rolls hard to the rim.",
    adversity_response: "I grew 6 inches in one summer and completely lost my coordination. I went from being a good player to someone who could barely dribble. It was humiliating and I thought about quitting. But my dad worked with me every day on my footwork and balance. It took months, but I eventually adjusted to my new body and became an even better player with the added height.",
    pride_tags: ["shot_blocking", "screening", "communication"],
    ppg: 13.5,
    apg: 2.2,
    rpg: 10.5,
    spg: 0.8,
    bpg: 2.5,
    fg_pct: 55.0,
    three_pct: 15.0,
    ft_pct: 60.0,
    games_played: 26,
    film_links: ["https://youtube.com/watch?v=example5"],
    highlight_links: ["https://youtube.com/watch?v=highlight5"],
    level: "AAU",
    team_names: "Seattle Storm Youth",
    iq_self_rating: 7,
    goal: "Play college basketball while getting a degree in computer science, potentially at a STEM-focused university."
  }
];

// Deliverable types matching the schema
const DELIVERABLE_TYPES = {
  elite_track: [
    { type: 'one_pager', status: 'approved' },
    { type: 'tracking_profile', status: 'approved' },
    { type: 'referral_note', status: 'in_progress' },
    { type: 'film_index', status: 'pending' },
    { type: 'verified_badge', status: 'approved' }
  ],
  development: [
    { type: 'one_pager', status: 'approved' },
    { type: 'tracking_profile', status: 'in_progress' },
    { type: 'verified_badge', status: 'approved' }
  ],
  basic: [
    { type: 'one_pager', status: 'in_progress' },
    { type: 'verified_badge', status: 'pending' }
  ]
};

const PACKAGE_TYPES = ['elite_track', 'development', 'basic'];

// Project statuses matching schema: pending, in_progress, review, completed, cancelled
const PROJECT_STATUSES = ['pending', 'in_progress', 'review', 'completed', 'cancelled'];

async function loadTestData() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8787';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    console.error('Usage: SUPABASE_URL=https://... SUPABASE_ANON_KEY=... node scripts/load_test_projects.js');
    process.exit(1);
  }

  console.log('Loading test data for evaluation builder...');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log('');

  const createdPlayers = [];
  const createdProjects = [];

  // Step 1: Create players
  console.log('Step 1: Creating sample players...');
  for (let i = 0; i < SAMPLE_PLAYERS.length; i++) {
    const player = SAMPLE_PLAYERS[i];
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

  console.log(`\nCreated/Found ${createdPlayers.length} players\n`);

  // Step 2: Create intake submissions
  console.log('Step 2: Creating intake submissions...');
  for (let i = 0; i < createdPlayers.length; i++) {
    const player = createdPlayers[i];
    const intakeData = SAMPLE_INTAKE_SUBMISSIONS[i];

    try {
      // Check if intake submission already exists
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/intake_submissions?player_id=eq.${player.id}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const existing = await checkRes.json();

      if (existing && existing.length > 0) {
        console.log(`  Intake submission for ${player.player_name} already exists`);
        continue;
      }

      // Create intake submission
      const res = await fetch(`${SUPABASE_URL}/rest/v1/intake_submissions`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...intakeData,
          player_id: player.id,
          parent_name: player.parent_name,
          parent_email: player.parent_email,
          parent_phone: player.parent_phone,
          player_email: player.player_email,
          package_selected: 'development' // Default package for intake
        })
      });

      if (!res.ok) {
        const error = await res.text();
        console.error(`  Failed to create intake for ${player.player_name}: ${error}`);
        continue;
      }

      console.log(`  Created intake submission for: ${player.player_name}`);
    } catch (err) {
      console.error(`  Error creating intake for ${player.player_name}: ${err.message}`);
    }
  }

  console.log('');

  // Step 3: Create projects
  console.log('Step 3: Creating projects...');
  for (let i = 0; i < createdPlayers.length; i++) {
    const player = createdPlayers[i];
    const packageType = PACKAGE_TYPES[i % PACKAGE_TYPES.length];

    try {
      // Check if project already exists
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?player_id=eq.${player.id}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const existing = await checkRes.json();

      if (existing && existing.length > 0) {
        console.log(`  Project for ${player.player_name} already exists (ID: ${existing[0].id})`);
        createdProjects.push(existing[0]);
        continue;
      }

      // Create project
      const projectData = {
        player_id: player.id,
        package_type: packageType,
        status: PROJECT_STATUSES[i % PROJECT_STATUSES.length],
        payment_status: i === 3 ? 'pending' : 'paid',
        notes: `Test project for evaluation builder - ${player.player_name}`
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(projectData)
      });

      if (!res.ok) {
        const error = await res.text();
        console.error(`  Failed to create project for ${player.player_name}: ${error}`);
        continue;
      }

      const data = await res.json();
      createdProjects.push(data[0]);
      console.log(`  Created project for: ${player.player_name} (ID: ${data[0].id}, Status: ${projectData.status}, Package: ${packageType})`);
    } catch (err) {
      console.error(`  Error creating project for ${player.player_name}: ${err.message}`);
    }
  }

  console.log(`\nCreated/Found ${createdProjects.length} projects\n`);

  // Step 4: Create deliverables
  console.log('Step 4: Creating deliverables...');
  for (const project of createdProjects) {
    try {
      // Check existing deliverables
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/deliverables?project_id=eq.${project.id}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const existing = await checkRes.json();

      if (existing && existing.length > 0) {
        console.log(`  Deliverables for project ${project.id} already exist`);
        continue;
      }

      // Create deliverables based on package type
      const packageType = project.package_type;
      const deliverablesToCreate = DELIVERABLE_TYPES[packageType] || DELIVERABLE_TYPES.basic;

      for (const del of deliverablesToCreate) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/deliverables`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            project_id: project.id,
            type: del.type,
            status: del.status
          })
        });

        if (!res.ok) {
          const error = await res.text();
          console.error(`    Failed to create ${del.type}: ${error}`);
        }
      }

      console.log(`  Created ${deliverablesToCreate.length} deliverables for project ${project.id}`);
    } catch (err) {
      console.error(`  Error creating deliverables for project ${project.id}: ${err.message}`);
    }
  }

  console.log('');

  // Summary
  console.log('=====================================');
  console.log('Test Data Loading Complete!');
  console.log('=====================================');
  console.log(`Players: ${createdPlayers.length}`);
  console.log(`Projects: ${createdProjects.length}`);
  console.log('');
  console.log('Sample Project IDs for testing:');
  createdProjects.forEach((p, i) => {
    const player = createdPlayers.find(pl => pl.id === p.player_id);
    console.log(`  ${i + 1}. ${player?.player_name || 'Unknown'} - Project ID: ${p.id}`);
    console.log(`     Package: ${p.package_type}, Status: ${p.status}`);
    console.log(`     URL: ${BACKEND_URL}/admin/projects/${p.id}`);
    console.log(`     Evaluation: ${BACKEND_URL}/admin/projects/${p.id}/evaluation`);
  });
  console.log('');
  console.log('To test the evaluation builder:');
  console.log('1. Log in as admin');
  console.log('2. Navigate to /admin/pipeline to see all projects');
  console.log('3. Click on any project to view the Project Detail page');
  console.log('4. Click "Evaluation Packet" to view the printable evaluation');
}

// Run the loader
loadTestData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
