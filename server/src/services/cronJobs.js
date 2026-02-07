/**
 * Cron Jobs for automated data fetching
 */
import cron from 'node-cron';
import { fetchFeed } from './nasaService.js';

/**
 * Start all cron jobs
 */
export function startCronJobs() {
  console.log('Starting cron jobs...');

  // Fetch NASA feed every 6 hours
  // Runs at: 00:00, 06:00, 12:00, 18:00
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Fetching NASA feed for next 7 days');

    try {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const startDate = today.toISOString().split('T')[0];
      const endDate = nextWeek.toISOString().split('T')[0];

      await fetchFeed(startDate, endDate);
      console.log('[CRON] Successfully fetched NASA feed');
    } catch (error) {
      console.error('[CRON] Error fetching NASA feed:', error.message);
    }
  });

  // Check for alerts every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Checking for alerts (placeholder)');
    // TODO: Implement alert checking logic
  });

  console.log('Cron jobs started successfully');
}

export default { startCronJobs };
