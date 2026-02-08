/**
 * Firebase Cloud Functions for Orbitra
 * Scheduled function to fetch asteroid data from NASA every 6 hours
 */

import {onSchedule} from "firebase-functions/v2/scheduler";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {createNasaService} from "@orbitra/shared";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// NASA API Configuration
const NASA_CONFIG = {
  NASA_BASE_URL: process.env.NASA_BASE_URL || "https://api.nasa.gov/neo/rest/v1",
  NASA_API_KEY: process.env.NASA_API_KEY || "zhybXnOiyWPUxaprhlWbHf4oDl2bCunR1Tvfkbf1",
};

// Create NASA service instance
const nasaService = createNasaService(db, NASA_CONFIG);

/**
 * Scheduled function: Update asteroid cache every 6 hours
 * Runs at 00:00, 06:00, 12:00, 18:00 (Asia/Kolkata timezone)
 * Fetches next 7 days of asteroid data from NASA
 */
export const updateAsteroidCache = onSchedule({
  schedule: "0 */6 * * *", // Every 6 hours
  timeZone: "Asia/Kolkata",
  memory: "512MiB",
  timeoutSeconds: 540, // 9 minutes (NASA API can be slow)
  retryCount: 2,
}, async (event) => {
  try {
    console.log("[SCHEDULED] Starting asteroid cache update");
    const startTime = Date.now();

    // Calculate date range: today + next 7 days
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const startDate = today.toISOString().split("T")[0];
    const endDate = nextWeek.toISOString().split("T")[0];

    console.log(`[SCHEDULED] Fetching asteroids from ${startDate} to ${endDate}`);

    // Fetch and save to Firestore
    const asteroids = await nasaService.fetchFeed(startDate, endDate);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[SCHEDULED] Successfully cached ${asteroids.length} asteroids in ${duration}s`);

    return {
      success: true,
      count: asteroids.length,
      dateRange: {startDate, endDate},
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[SCHEDULED] Error updating asteroid cache:", error);
    throw error; // Trigger retry
  }
});

/**
 * Helper function: Check if an asteroid matches an alert rule
 */
function asteroidMatchesAlert(asteroid, alert) {
  const {alertType, thresholdValue} = alert;

  switch (alertType) {
    case "distance": {
      const approach = asteroid.closeApproaches?.[0];
      if (!approach) return false;
      return approach.missDistanceKm < thresholdValue;
    }
    case "diameter": {
      const diameter = asteroid.diameterMaxM || 0;
      return diameter > thresholdValue;
    }
    case "hazardous": {
      return asteroid.isHazardous === true;
    }
    case "sentry": {
      return asteroid.isSentry === true;
    }
    default:
      return false;
  }
}

/**
 * Helper function: Generate notification message
 */
function generateNotificationMessage(asteroid, alert) {
  const {alertType, thresholdValue} = alert;

  switch (alertType) {
    case "distance": {
      const approach = asteroid.closeApproaches?.[0];
      const distance = approach ? (approach.missDistanceKm / 1000).toFixed(0) : "unknown";
      return `${asteroid.name} passed within ${distance}K km (threshold: ${(thresholdValue / 1000).toFixed(0)}K km)`;
    }
    case "diameter": {
      const diameter = asteroid.diameterMaxM || 0;
      return `${asteroid.name} detected, ${diameter.toFixed(0)}m diameter (threshold: ${thresholdValue}m)`;
    }
    case "hazardous": {
      const size = asteroid.diameterMaxM || 0;
      return `${asteroid.name} flagged as potentially hazardous, ${size.toFixed(0)}m diameter`;
    }
    case "sentry": {
      return `${asteroid.name} added to NASA Sentry risk monitoring system`;
    }
    default:
      return `${asteroid.name} triggered alert`;
  }
}

/**
 * Scheduled function: Check alerts and trigger notifications
 * Runs 10 minutes after the cache update (00:10, 06:10, 12:10, 18:10)
 * Checks all active user alerts against today's asteroids
 */
export const checkAlerts = onSchedule({
  schedule: "10 0,6,12,18 * * *", // 10 minutes after cache updates
  timeZone: "Asia/Kolkata",
  memory: "256MiB",
  timeoutSeconds: 300, // 5 minutes
  retryCount: 1,
}, async (event) => {
  try {
    console.log("[SCHEDULED] Starting alert check");
    const startTime = Date.now();

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Fetch all active alerts from Firestore
    const alertsSnapshot = await db.collection("alerts")
        .where("isActive", "==", true)
        .get();

    if (alertsSnapshot.empty) {
      console.log("[SCHEDULED] No active alerts found");
      return {
        success: true,
        message: "No active alerts to check",
        timestamp: new Date().toISOString(),
      };
    }

    const alerts = alertsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`[SCHEDULED] Found ${alerts.length} active alerts to check`);

    // Fetch today's asteroids from cache
    const asteroidsSnapshot = await db.collection("asteroids")
        .where("approachDate", "==", today)
        .get();

    if (asteroidsSnapshot.empty) {
      console.log("[SCHEDULED] No asteroids found for today");
      return {
        success: true,
        message: "No asteroids approaching today",
        timestamp: new Date().toISOString(),
      };
    }

    const asteroids = asteroidsSnapshot.docs.map((doc) => doc.data());
    console.log(`[SCHEDULED] Checking ${asteroids.length} asteroids against alerts`);

    let notificationCount = 0;
    const notificationBatch = db.batch();

    // Check each alert against each asteroid
    for (const alert of alerts) {
      for (const asteroid of asteroids) {
        // Check if asteroid matches alert criteria
        if (asteroidMatchesAlert(asteroid, alert)) {
          // Check if notification already exists (prevent duplicates)
          const existingNotification = await db.collection("notifications")
              .where("userId", "==", alert.userId)
              .where("alertId", "==", alert.id)
              .where("asteroidNeoId", "==", asteroid.id)
              .where("approachDate", "==", today)
              .get();

          if (existingNotification.empty) {
            // Create notification
            const notificationRef = db.collection("notifications").doc();
            const message = generateNotificationMessage(asteroid, alert);

            notificationBatch.set(notificationRef, {
              userId: alert.userId,
              alertId: alert.id,
              asteroidNeoId: asteroid.id,
              asteroidName: asteroid.name,
              approachDate: today,
              message: message,
              triggeredAt: new Date(),
              isRead: false,
              alertType: alert.alertType,
              thresholdValue: alert.thresholdValue,
            });

            notificationCount++;
            console.log(`[SCHEDULED] Notification created: ${asteroid.name} matched alert ${alert.id} for user ${alert.userId}`);
          }
        }
      }
    }

    // Commit all notifications in batch
    if (notificationCount > 0) {
      await notificationBatch.commit();
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[SCHEDULED] Alert check completed: ${notificationCount} notifications created in ${duration}s`);

    return {
      success: true,
      alertsChecked: alerts.length,
      asteroidsChecked: asteroids.length,
      notificationsCreated: notificationCount,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[SCHEDULED] Error checking alerts:", error);
    throw error; // Trigger retry
  }
});
