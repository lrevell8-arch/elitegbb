// Create Coach via Browser Console
// Usage:
// 1. Go to https://app.elitegbb.com/admin/login
// 2. Login with admin@hoopwithher.com / AdminPass123!
// 3. Open DevTools (F12) → Console
// 4. Paste this entire script and press Enter

(async function createCoach() {
    const coachData = {
        email: "coach@university.edu",
        password: "CoachPass123!",
        name: "Coach Name",
        school: "University Name",
        title: "Head Coach",
        state: "CA"  // optional
    };

    console.log('%c Elite GBB - Create Coach ', 'background: #2563eb; color: white; font-size: 16px; padding: 4px 8px;');
    console.log('Creating coach account...');

    try {
        // Step 1: Get admin token (if not already logged in via API)
        const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@hoopwithher.com',
                password: 'AdminPass123!'
            })
        });
        
        if (!loginRes.ok) {
            throw new Error('Admin login failed. Check credentials.');
        }
        
        const { token } = await loginRes.json();
        console.log('✓ Admin authenticated');

        // Step 2: Create coach
        const createRes = await fetch('/api/admin/coaches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(coachData)
        });

        if (!createRes.ok) {
            const error = await createRes.json();
            throw new Error(error.detail || 'Failed to create coach');
        }

        const result = await createRes.json();
        const coach = result.coach;

        console.log('%c ✓ Coach created successfully! ', 'background: #10b981; color: white; padding: 4px 8px;');
        console.log({
            id: coach.id,
            email: coach.email,
            name: coach.name,
            school: coach.school,
            is_active: coach.is_active,
            is_verified: coach.is_verified
        });

        console.log('%c Login Credentials ', 'background: #f59e0b; color: white; padding: 4px 8px;');
        console.log('URL: https://app.elitegbb.com/coach/login');
        console.log('Email:', coach.email);
        console.log('Password: [as set in coachData variable]');

    } catch (err) {
        console.error('%c ✗ Error: ', 'background: #ef4444; color: white; padding: 4px 8px;', err.message);
    }
})();
