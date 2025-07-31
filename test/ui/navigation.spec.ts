import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between main pages', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Noah Jenkins' })).toBeVisible();
    
    // Navigate to About page
    await page.getByRole('link', { name: 'About' }).first().click({ force: true });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/about');
    
    // Navigate to Projects page
    await page.getByRole('link', { name: 'Projects' }).first().click({ force: true });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/projects');
    
    
    // Navigate to Voices page
    await page.getByRole('link', { name: 'Voices' }).first().click({ force: true });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/voices');
    
    // Navigate to CSS Generator
    await page.getByRole('link', { name: 'CSS Generator' }).first().click({ force: true });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/tools/css-generator');
    
    // Navigate to Blog
    await page.getByRole('link', { name: 'Blog' }).first().click({ force: true });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/blog');
  });

  test('should have responsive navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Navigation should still be functional
    await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();
    
    // Test mobile navigation (skip terminal since it's desktop-only)
    await page.getByRole('link', { name: 'About' }).first().click({ force: true });
    await expect(page).toHaveURL('/about');
  });

  test('should have working footer links', async ({ page }) => {
    await page.goto('/');
    
    // Check social links in footer - use more specific selector
    const linkedinLink = page.getByRole('link', { name: 'LinkedIn (Noah Jenkins)' });
    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/noah-jenkins/');
    
    const emailLink = page.getByRole('link', { name: 'Email Noah Jenkins' });
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute('href', 'mailto:noah@noahjenkins.com');
  });
});