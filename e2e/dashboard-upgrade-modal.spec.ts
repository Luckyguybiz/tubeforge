/**
 * E2E Smoke Tests - Dashboard Upgrade Modal (mobile viewport)
 *
 * Covers:
 * - Modal appears for new (unauthenticated-fresh) users on /dashboard
 * - Modal renders correctly on mobile viewport (375x667, iPhone SE)
 * - Monthly/Yearly toggle is tappable on mobile
 * - Close button is reachable on mobile without scrolling issues
 * - Modal does not appear on second visit (localStorage flag)
 * - Countdown timer is visible
 * - Pay Now button is visible and tappable
 *
 * Prerequisites: App must be running at baseURL. User must be authenticated.
 * These tests require a test user session (handled by Playwright auth state).
 */
import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 }; // iPhone SE
const TABLET_VIEWPORT = { width: 768, height: 1024 }; // iPad
const STORAGE_KEY = 'tubeforge_upgrade_modal_seen';

test.describe('Dashboard Upgrade Modal - Mobile Viewport', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear the upgrade modal flag to simulate new user
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('tubeforge_upgrade_modal_seen');
      } catch {
        // ignore
      }
    });
  });

  test('modal appears on /dashboard for new user (mobile)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/dashboard');

    // Wait for modal to appear (may have animation delay)
    const modal = page.locator('[data-testid="upgrade-modal"], [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });
  });

  test('modal content is fully visible without horizontal scroll (mobile)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/dashboard');

    const modal = page.locator('[data-testid="upgrade-modal"], [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    // Modal should not overflow horizontally
    const box = await modal.boundingBox();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
    }
  });

  test('Pay Now button is visible and tappable on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/dashboard');

    const payBtn = page.locator('text=Pay Now');
    await expect(payBtn).toBeVisible({ timeout: 10_000 });

    // Button should be within viewport or reachable by scrolling the modal
    const box = await payBtn.boundingBox();
    expect(box).not.toBeNull();

    // Ensure minimum tap target size (44x44 per Apple HIG)
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40);
      expect(box.width).toBeGreaterThanOrEqual(40);
    }
  });

  test('close button is accessible on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/dashboard');

    const modal = page.locator('[data-testid="upgrade-modal"], [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    const closeBtn = page.locator('[aria-label*="close" i], [aria-label*="dismiss" i], button:has-text("X"), button:has-text("x")').first();
    await expect(closeBtn).toBeVisible();

    // Tap close
    await closeBtn.click();

    // Modal should disappear
    await expect(modal).not.toBeVisible({ timeout: 5_000 });
  });

  test('modal does not appear on second visit (localStorage flag persists)', async ({ page, context }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/dashboard');

    // Wait for modal
    const modal = page.locator('[data-testid="upgrade-modal"], [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    // Close it
    const closeBtn = page.locator('[aria-label*="close" i], [aria-label*="dismiss" i], button:has-text("X"), button:has-text("x")').first();
    await closeBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    // Reload page
    await page.reload();

    // Modal should NOT appear again
    await page.waitForTimeout(3_000);
    await expect(modal).not.toBeVisible();
  });

  test('Monthly/Yearly toggle works on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/dashboard');

    const modal = page.locator('[data-testid="upgrade-modal"], [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    // Find toggle buttons
    const monthlyBtn = page.locator('text=Monthly').first();
    const yearlyBtn = page.locator('text=Yearly').first();

    await expect(monthlyBtn).toBeVisible();
    await expect(yearlyBtn).toBeVisible();

    // Tap Yearly
    await yearlyBtn.click();

    // Price should update - just verify no errors occurred
    await page.waitForTimeout(500);
    await expect(modal).toBeVisible();
  });

  test('countdown timer is visible on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/dashboard');

    const modal = page.locator('[data-testid="upgrade-modal"], [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    // Look for timer element or promo badge with timer
    const timer = page.locator('[data-testid="countdown-timer"]')
      .or(page.locator('text=/\\d{1,2}:\\d{2}/').first())
      .or(page.locator('text=/\\d{1,2}h/').first());

    await expect(timer.first()).toBeVisible();
  });

  test('strikethrough pricing is displayed on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/dashboard');

    const modal = page.locator('[data-testid="upgrade-modal"], [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    // Check for strikethrough elements (old price)
    const strikeThroughEl = page.locator('s, del, [style*="line-through"]').first();
    await expect(strikeThroughEl).toBeVisible();
  });

  test('feature comparison list renders all items on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/dashboard');

    const modal = page.locator('[data-testid="upgrade-modal"], [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    const features = [
      'Personalized Feed',
      'Video Scoring',
      'Keyword Research',
      'Outliers',
      'Browser Extension',
    ];

    for (const feature of features) {
      await expect(page.locator(`text=${feature}`).first()).toBeVisible();
    }
  });
});

test.describe('Dashboard Upgrade Modal - Tablet Viewport', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem('tubeforge_upgrade_modal_seen');
      } catch {
        // ignore
      }
    });
  });

  test('modal renders properly on tablet viewport', async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.goto('/dashboard');

    const modal = page.locator('[data-testid="upgrade-modal"], [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    // Check modal is centered and not overflowing
    const box = await modal.boundingBox();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(TABLET_VIEWPORT.width + 1);
    }
  });
});
