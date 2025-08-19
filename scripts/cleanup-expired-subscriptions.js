#!/usr/bin/env node

/**
 * Cleanup Expired Subscriptions Script
 * 
 * This script immediately cleans up expired subscriptions in the database.
 * Run this after deploying the updated subscription logic to fix current issues.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupExpiredSubscriptions() {
  try {
    console.log('🔍 Starting cleanup of expired subscriptions...');
    
    // Find all expired subscriptions
    const { data: expiredSubscriptions, error: findError } = await supabase
      .from('subscriptions')
      .select('id, user_id, current_period_end, status')
      .eq('status', 'active')
      .lt('current_period_end', new Date().toISOString());
      
    if (findError) {
      console.error('❌ Error finding expired subscriptions:', findError);
      return;
    }
    
    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log('✅ No expired subscriptions found');
      return;
    }
    
    console.log(`📊 Found ${expiredSubscriptions.length} expired subscriptions`);
    
    // Update expired subscriptions to 'expired' status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .in('id', expiredSubscriptions.map(sub => sub.id));
      
    if (updateError) {
      console.error('❌ Error updating expired subscriptions:', updateError);
      return;
    }
    
    console.log(`✅ Updated ${expiredSubscriptions.length} subscriptions to 'expired' status`);
    
    // Get unique user IDs from expired subscriptions
    const userIds = [...new Set(expiredSubscriptions.map(sub => sub.user_id))];
    
    // Update profiles.is_premium to false for users with expired subscriptions
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_premium: false })
      .in('id', userIds);
      
    if (profileError) {
      console.error('❌ Error updating profiles:', profileError);
      return;
    }
    
    console.log(`✅ Updated ${userIds.length} user profiles to remove premium access`);
    
    // Log details of cleaned up subscriptions
    console.log('\n📋 Cleaned up subscriptions:');
    expiredSubscriptions.forEach(sub => {
      console.log(`  - User: ${sub.user_id}, Expired: ${sub.current_period_end}`);
    });
    
    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error);
  }
}

async function validateSubscriptionStatus() {
  try {
    console.log('\n🔍 Validating current subscription statuses...');
    
    // Check for any remaining active subscriptions that might be expired
    const { data: activeSubs, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, status, current_period_end')
      .eq('status', 'active');
      
    if (error) {
      console.error('❌ Error checking active subscriptions:', error);
      return;
    }
    
    if (!activeSubs || activeSubs.length === 0) {
      console.log('✅ No active subscriptions found');
      return;
    }
    
    console.log(`📊 Found ${activeSubs.length} active subscriptions`);
    
    // Check for any that might still be expired
    const now = new Date();
    const potentiallyExpired = activeSubs.filter(sub => {
      const periodEnd = new Date(sub.current_period_end);
      return now > periodEnd;
    });
    
    if (potentiallyExpired.length > 0) {
      console.log(`⚠️  Found ${potentiallyExpired.length} potentially expired subscriptions still marked as active:`);
      potentiallyExpired.forEach(sub => {
        console.log(`  - User: ${sub.user_id}, Period End: ${sub.current_period_end}`);
      });
    } else {
      console.log('✅ All active subscriptions appear to be valid');
    }
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
  }
}

async function main() {
  console.log('🚀 LoveMirror Subscription Cleanup Script');
  console.log('==========================================\n');
  
  await cleanupExpiredSubscriptions();
  await validateSubscriptionStatus();
  
  console.log('\n✨ Script execution completed');
}

// Run the script
main().catch(console.error);
