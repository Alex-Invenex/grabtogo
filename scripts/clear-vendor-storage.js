const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const VENDOR_BUCKETS = [
  'vendor-documents',
  'vendor-logos',
  'vendor-photos',
];

async function clearBucket(bucketName) {
  console.log(`\n📦 Processing bucket: ${bucketName}`);

  try {
    // List all files in the bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        offset: 0,
      });

    if (listError) {
      console.error(`❌ Error listing files in ${bucketName}:`, listError.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log(`✅ No files found in ${bucketName}`);
      return;
    }

    console.log(`📄 Found ${files.length} files in ${bucketName}`);

    // Delete all files
    const filePaths = files.map(file => file.name);
    const { error: deleteError } = await supabase
      .storage
      .from(bucketName)
      .remove(filePaths);

    if (deleteError) {
      console.error(`❌ Error deleting files from ${bucketName}:`, deleteError.message);
      return;
    }

    console.log(`✅ Successfully deleted ${filePaths.length} files from ${bucketName}`);
  } catch (error) {
    console.error(`❌ Unexpected error processing ${bucketName}:`, error.message);
  }
}

async function main() {
  console.log('🧹 Starting vendor storage cleanup...\n');

  for (const bucket of VENDOR_BUCKETS) {
    await clearBucket(bucket);
  }

  console.log('\n✅ Vendor storage cleanup completed!');
}

main().catch(console.error);
