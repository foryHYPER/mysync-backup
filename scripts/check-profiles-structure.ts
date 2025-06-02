import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkProfilesStructure() {
  console.log('🔍 Checking profiles table structure...\n');
  
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  
  if (error) {
    console.log('❌ Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📋 Sample profile:', data[0]);
    console.log('\n📋 Available columns:', Object.keys(data[0]));
  } else {
    console.log('📋 No profiles found');
  }
}

checkProfilesStructure().catch(console.error); 