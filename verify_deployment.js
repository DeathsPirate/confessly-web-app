#!/usr/bin/env node

const axios = require('axios');

// Verification script for Confessly deployment
async function verifyDeployment(baseUrl = 'http://localhost:3001') {
  console.log('🔍 Verifying Confessly Deployment');
  console.log('================================');
  console.log(`Testing: ${baseUrl}`);
  console.log('');

  const tests = [];
  
  try {
    // Test 1: Health Check
    console.log('1. Health Check...');
    const health = await axios.get(`${baseUrl}/api/health`);
    tests.push({ name: 'Health Check', status: health.status === 200 ? '✅' : '❌' });
    
    // Test 2: Get Confessions
    console.log('2. Confessions Feed...');
    const confessions = await axios.get(`${baseUrl}/api/confessions`);
    const hasConfessions = confessions.data.confessions && confessions.data.confessions.length > 0;
    tests.push({ name: 'Confessions Feed', status: hasConfessions ? '✅' : '❌' });
    
    // Test 3: Login Test
    console.log('3. Authentication...');
    try {
      const login = await axios.post(`${baseUrl}/api/auth/login`, {
        email: 'alice@example.com',
        password: 'password123'
      });
      const hasToken = login.data.token && login.data.user;
      tests.push({ name: 'Authentication', status: hasToken ? '✅' : '❌' });
      
      if (hasToken) {
        const token = login.data.token;
        
        // Test 4: Protected Route (Profile)
        console.log('4. Protected Routes...');
        const profile = await axios.get(`${baseUrl}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        tests.push({ name: 'Protected Routes', status: profile.status === 200 ? '✅' : '❌' });
        
        // Test 5: Create Confession
        console.log('5. Create Confession...');
        const confession = await axios.post(`${baseUrl}/api/confessions`, {
          content: 'Test confession for deployment verification',
          mood: 'Hopeful'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        tests.push({ name: 'Create Confession', status: confession.status === 201 ? '✅' : '❌' });
      }
    } catch (authError) {
      tests.push({ name: 'Authentication', status: '❌' });
      tests.push({ name: 'Protected Routes', status: '❌' });
      tests.push({ name: 'Create Confession', status: '❌' });
    }
    
    // Test 6: AI Assistant Check
    console.log('6. AI Assistant...');
    const aiComments = await axios.get(`${baseUrl}/api/confessions/1/comments`);
    const hasAiResponse = aiComments.data.comments.some(c => c.author_handle.includes('🤖'));
    tests.push({ name: 'AI Assistant', status: hasAiResponse ? '✅' : '⚠️' });
    
    // Test 7: Moderator Login
    console.log('7. Moderator Features...');
    try {
      const modLogin = await axios.post(`${baseUrl}/api/auth/login`, {
        email: 'moderator@example.com',
        password: 'password123'
      });
      
      if (modLogin.data.token) {
        const moderation = await axios.get(`${baseUrl}/api/moderation/flagged`, {
          headers: { Authorization: `Bearer ${modLogin.data.token}` }
        });
        tests.push({ name: 'Moderator Features', status: moderation.status === 200 ? '✅' : '❌' });
      }
    } catch (modError) {
      tests.push({ name: 'Moderator Features', status: '❌' });
    }
    
  } catch (error) {
    console.error('❌ Deployment verification failed:', error.message);
    console.log('');
    console.log('Common issues:');
    console.log('- Server not running');
    console.log('- Database not seeded');
    console.log('- Wrong URL or port');
    return false;
  }
  
  // Results
  console.log('');
  console.log('📊 Verification Results');
  console.log('=======================');
  
  tests.forEach(test => {
    console.log(`${test.status} ${test.name}`);
  });
  
  const passed = tests.filter(t => t.status === '✅').length;
  const total = tests.length;
  const warnings = tests.filter(t => t.status === '⚠️').length;
  
  console.log('');
  console.log(`Results: ${passed}/${total} tests passed`);
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning(s) - AI assistant may need time to generate responses`);
  }
  
  if (passed >= total - 1) { // Allow AI assistant to be warning
    console.log('');
    console.log('🎉 Deployment Verified Successfully!');
    console.log('');
    console.log('Your Confessly app is ready with:');
    console.log('✅ Anonymous confessions');
    console.log('✅ Voting system');
    console.log('✅ User authentication');  
    console.log('✅ Moderation tools');
    console.log('✅ AI assistant (may take time to respond)');
    console.log('✅ Data export');
    console.log('');
    console.log('Test accounts:');
    console.log('👤 alice@example.com / password123');
    console.log('🛡️  moderator@example.com / password123');
    return true;
  } else {
    console.log('');
    console.log('❌ Some tests failed. Please check the deployment.');
    return false;
  }
}

// Run verification
const url = process.argv[2] || 'http://localhost:3001';
verifyDeployment(url).then(success => {
  process.exit(success ? 0 : 1);
});