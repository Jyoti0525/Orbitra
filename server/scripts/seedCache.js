/**
 * Seed Firestore daily cache with past 7 days of asteroid data
 * Run once to populate initial cache
 */
import { fetchFeed } from '../src/services/nasaService.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedCache() {
  console.log('🌱 Starting cache seed...\n');

  const today = new Date();
  const results = [];

  // Seed past 7 days
  for (let i = 7; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    try {
      console.log(`📅 Fetching ${dateStr}...`);
      const asteroids = await fetchFeed(dateStr, dateStr);

      results.push({
        date: dateStr,
        count: asteroids.length,
        status: '✅ Success'
      });

      console.log(`   ✅ Saved ${asteroids.length} asteroids to cache\n`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      results.push({
        date: dateStr,
        count: 0,
        status: `❌ ${error.message}`
      });
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log('═══════════════════════════════════════');
  results.forEach(result => {
    console.log(`${result.date}: ${result.count} asteroids - ${result.status}`);
  });
  console.log('═══════════════════════════════════════');

  const totalAsteroids = results.reduce((sum, r) => sum + r.count, 0);
  const successCount = results.filter(r => r.status.includes('✅')).length;

  console.log(`\n✨ Total: ${totalAsteroids} asteroids cached`);
  console.log(`✨ Success rate: ${successCount}/${results.length} days\n`);

  process.exit(0);
}

seedCache().catch(error => {
  console.error('💥 Seed failed:', error);
  process.exit(1);
});
