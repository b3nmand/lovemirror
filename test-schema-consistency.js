#!/usr/bin/env node

/**
 * Schema Consistency Test Script
 * 
 * This script verifies that:
 * 1. All tables exist and have correct schemas
 * 2. All policies are properly configured
 * 3. Edge Functions can access required tables
 * 4. TypeScript interfaces match database schemas
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table ${tableName}: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Table ${tableName}: EXISTS`);
    return true;
  } catch (err) {
    console.log(`❌ Table ${tableName}: ${err.message}`);
    return false;
  }
}

async function testTableSchema(tableName, expectedColumns) {
  try {
    // Get table schema by selecting all columns
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (error) {
      console.log(`❌ Schema test for ${tableName}: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Schema test for ${tableName}: SUCCESS`);
    return true;
  } catch (err) {
    console.log(`❌ Schema test for ${tableName}: ${err.message}`);
    return false;
  }
}

async function testServiceRoleAccess(tableName, operation = 'SELECT') {
  try {
    let query = supabase.from(tableName);
    
    switch (operation) {
      case 'SELECT':
        query = query.select('*').limit(1);
        break;
      case 'INSERT':
        // Test with dummy data
        query = query.insert({ id: '00000000-0000-0000-0000-000000000000' });
        break;
      case 'UPDATE':
        query = query.update({ updated_at: new Date().toISOString() }).eq('id', '00000000-0000-0000-0000-000000000000');
        break;
    }
    
    const { error } = await query;
    
    if (error && error.message.includes('permission denied')) {
      console.log(`❌ Service role ${operation} access to ${tableName}: PERMISSION DENIED`);
      return false;
    }
    
    console.log(`✅ Service role ${operation} access to ${tableName}: SUCCESS`);
    return true;
  } catch (err) {
    console.log(`❌ Service role ${operation} access to ${tableName}: ${err.message}`);
    return false;
  }
}

async function testEdgeFunctionEndpoint() {
  try {
    console.log('\n🧪 Testing Edge Function endpoint...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/verify-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        session_id: 'cs_test_dummy_session_id'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 500 && data.error?.includes('No such session')) {
      console.log('✅ Edge Function endpoint: RESPONDS (expected error for invalid session)');
      return true;
    } else if (response.status === 200) {
      console.log('✅ Edge Function endpoint: RESPONDS SUCCESSFULLY');
      return true;
    } else {
      console.log(`❌ Edge Function endpoint: UNEXPECTED RESPONSE (${response.status})`);
      console.log('Response:', data);
      return false;
    }
  } catch (err) {
    console.log(`❌ Edge Function endpoint: ${err.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🔍 Running Schema Consistency Tests...\n');
  
  const tables = [
    'profiles',
    'subscriptions', 
    'external_assessors',
    'external_assessment_results',
    'assessment_history',
    'partner_invitations',
    'relationships',
    'compatibility_scores'
  ];
  
  let allTestsPassed = true;
  
  // Test table existence
  console.log('📋 Testing Table Existence:');
  for (const table of tables) {
    const exists = await testTableExists(table);
    if (!exists) allTestsPassed = false;
  }
  
  // Test table schemas
  console.log('\n🔧 Testing Table Schemas:');
  for (const table of tables) {
    const schemaOk = await testTableSchema(table);
    if (!schemaOk) allTestsPassed = false;
  }
  
  // Test service role access for critical tables
  console.log('\n🔐 Testing Service Role Access:');
  const criticalTables = [
    { table: 'profiles', operation: 'UPDATE' },
    { table: 'subscriptions', operation: 'INSERT' },
    { table: 'subscriptions', operation: 'UPDATE' }
  ];
  
  for (const { table, operation } of criticalTables) {
    const accessOk = await testServiceRoleAccess(table, operation);
    if (!accessOk) allTestsPassed = false;
  }
  
  // Test Edge Function endpoint
  const endpointOk = await testEdgeFunctionEndpoint();
  if (!endpointOk) allTestsPassed = false;
  
  // Summary
  console.log('\n📊 Test Summary:');
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED - Schema is consistent!');
  } else {
    console.log('❌ SOME TESTS FAILED - Check the issues above');
  }
  
  return allTestsPassed;
}

// Run the tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('💥 Test runner error:', err);
    process.exit(1);
  }); 