// Test script to verify Edge Function permissions
// Run this in your browser console or as a Node.js script

const SUPABASE_URL = 'https://fweatrkxjdlwyjrofsgv.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // Replace with your actual anon key

// Test 1: Check if we can read profiles (should work)
async function testReadProfiles() {
  console.log('🧪 Testing profile read permissions...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Profile read successful:', data);
      return true;
    } else {
      console.error('❌ Profile read failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Profile read error:', error);
    return false;
  }
}

// Test 2: Check if we can read subscriptions (should work)
async function testReadSubscriptions() {
  console.log('🧪 Testing subscription read permissions...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Subscription read successful:', data);
      return true;
    } else {
      console.error('❌ Subscription read failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Subscription read error:', error);
    return false;
  }
}

// Test 3: Check Edge Function endpoint (should work)
async function testEdgeFunction() {
  console.log('🧪 Testing Edge Function endpoint...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-checkout-session`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ session_id: 'test_session' })
    });
    
    const data = await response.json();
    console.log('✅ Edge Function response:', data);
    
    // We expect an error about missing session_id, but the function should respond
    if (response.status === 400 && data.message === 'No session_id provided') {
      console.log('✅ Edge Function is working correctly (expected error)');
      return true;
    } else {
      console.log('⚠️ Unexpected response from Edge Function');
      return false;
    }
  } catch (error) {
    console.error('❌ Edge Function error:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting permission tests...\n');
  
  const results = {
    profileRead: await testReadProfiles(),
    subscriptionRead: await testReadSubscriptions(),
    edgeFunction: await testEdgeFunction()
  };
  
  console.log('\n📊 Test Results:');
  console.log('Profile Read:', results.profileRead ? '✅ PASS' : '❌ FAIL');
  console.log('Subscription Read:', results.subscriptionRead ? '✅ PASS' : '❌ FAIL');
  console.log('Edge Function:', results.edgeFunction ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result);
  console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('🎉 Your Edge Functions should have the proper permissions to update user data!');
  } else {
    console.log('⚠️ Some permissions may need to be fixed. Check the Supabase dashboard.');
  }
}

// Instructions
console.log(`
🔧 Permission Test Script
========================

This script tests whether your Edge Functions have the proper permissions to:
1. Read user profiles
2. Read subscriptions  
3. Call the verify-checkout-session function

To use this script:
1. Replace 'your-anon-key-here' with your actual Supabase anon key
2. Run this in your browser console or as a Node.js script
3. Check the results to verify permissions are working

Run: runAllTests()
`);

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testReadProfiles, testReadSubscriptions, testEdgeFunction };
} 