/**
 * Alert Checker Cron Job
 * Runs every hour to check user alerts against today's asteroid data
 */
import cron from 'node-cron';
import { getAsteroidsByDateRange } from '../services/nasaService.js';
import {
  getAllActiveAlerts,
  asteroidMatchesAlert,
  generateNotificationMessage,
  createNotification,
} from '../services/alertsService.js';

/**
 * Check all active alerts against today's asteroids
 */
async function checkAlerts() {
  try {
    const startTime = Date.now();
    console.log('[Alert Checker] Starting alert check...');

    // Get today's asteroids
    const today = new Date().toISOString().split('T')[0];
    const asteroids = await getAsteroidsByDateRange(today, today);

    if (!asteroids || asteroids.length === 0) {
      console.log('[Alert Checker] No asteroids for today, skipping');
      return;
    }

    console.log(`[Alert Checker] Found ${asteroids.length} asteroids for today`);

    // Get all active alerts from all users
    const activeAlerts = await getAllActiveAlerts();

    if (!activeAlerts || activeAlerts.length === 0) {
      console.log('[Alert Checker] No active alerts found, skipping');
      return;
    }

    console.log(`[Alert Checker] Found ${activeAlerts.length} active alerts to check`);

    let notificationCount = 0;
    let matchCount = 0;

    // Check each alert against each asteroid
    for (const alert of activeAlerts) {
      for (const asteroid of asteroids) {
        // Check if asteroid matches alert criteria
        if (asteroidMatchesAlert(asteroid, alert)) {
          matchCount++;

          // Generate notification message
          const message = generateNotificationMessage(asteroid, alert);

          // Create notification in Firestore
          try {
            await createNotification(alert.userId, alert.id, {
              neoId: asteroid.id,
              name: asteroid.name,
              riskScore: asteroid.riskScore,
              isHazardous: asteroid.isHazardous,
            }, message);

            notificationCount++;
            console.log(`[Alert Checker] ✓ Notification created for user ${alert.userId}: ${message.substring(0, 50)}...`);
          } catch (error) {
            console.error(`[Alert Checker] ✗ Failed to create notification:`, error.message);
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Alert Checker] Check complete! ${matchCount} matches found, ${notificationCount} notifications created in ${duration}ms`);
  } catch (error) {
    console.error('[Alert Checker] Error during alert check:', error);
  }
}

/**
 * Initialize alert checker cron job
 * Runs every hour at the top of the hour (0 * * * *)
 */
export function initAlertChecker() {
  console.log('[Alert Checker] Initializing cron job...');

  // Run every hour at minute 0
  const job = cron.schedule('0 * * * *', async () => {
    console.log('[Alert Checker] Hourly check triggered');
    await checkAlerts();
  }, {
    timezone: 'UTC'
  });

  console.log('[Alert Checker] Cron job scheduled to run every hour');

  // Run immediately on startup (for testing/demo purposes)
  console.log('[Alert Checker] Running initial check...');
  checkAlerts();

  return job;
}
