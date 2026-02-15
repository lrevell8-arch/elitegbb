// Script to activate a disabled coach account
// Usage: node activate-coach.js <coach_email>
// Or set COACH_EMAIL env variable

const API_BASE = process.env.API_BASE || 'https://app.elitegbb.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@hoopwithher.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPass123!';

async function loginAdmin() {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Admin login failed: ${error}`);
  }

  const data = await response.json();
  console.log('✓ Admin logged in:', data.user.email);
  return data.token;
}

async function getCoach(token, email) {
  const response = await fetch(`${API_BASE}/api/admin/coaches`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch coaches list');
  }

  const data = await response.json();
  const coach = data.coaches.find(c => c.email.toLowerCase() === email.toLowerCase());

  if (!coach) {
    throw new Error(`Coach not found: ${email}`);
  }

  console.log('✓ Found coach:', coach.name, `(${coach.email})`);
  console.log('  Current status: is_active=' + coach.is_active + ', is_verified=' + coach.is_verified);
  return coach;
}

async function activateCoach(token, coachId) {
  const response = await fetch(`${API_BASE}/api/admin/coaches`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      id: coachId,
      is_active: true,
      is_verified: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to activate coach: ${error}`);
  }

  const data = await response.json();
  console.log('✓ Coach activated successfully!');
  console.log('  New status: is_active=' + data.coach.is_active + ', is_verified=' + data.coach.is_verified);
  return data.coach;
}

async function main() {
  const coachEmail = process.argv[2] || process.env.COACH_EMAIL;

  if (!coachEmail) {
    console.error('Usage: node activate-coach.js <coach_email>');
    console.error('   or: COACH_EMAIL=email@example.com node activate-coach.js');
    process.exit(1);
  }

  console.log('Activating coach:', coachEmail);
  console.log('API Base:', API_BASE);
  console.log('');

  try {
    // Step 1: Login as admin
    const token = await loginAdmin();

    // Step 2: Find the coach
    const coach = await getCoach(token, coachEmail);

    // Step 3: Activate if needed
    if (coach.is_active && coach.is_verified) {
      console.log('Coach is already active and verified. No action needed.');
      process.exit(0);
    }

    await activateCoach(token, coach.id);

    console.log('');
    console.log('The coach can now log in with their credentials at:');
    console.log(`${API_BASE}/coach/login`);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
