import { test, expect } from '@playwright/test';

test.describe('Terminal Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/terminal');
  });

  test('should load terminal with welcome message', async ({ page }) => {
    // Wait for terminal to load - use more specific selector
    await expect(page.locator('main').getByText('noah@jenkins-terminal:~').first()).toBeVisible();
    
    // Check for welcome message
    await expect(page.getByText('Welcome to Noah Jenkins Interactive Resume Terminal')).toBeVisible();
    await expect(page.getByText('Type \'help\' to see available commands.')).toBeVisible();
    
    // Check for input field
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  test('should display help command output', async ({ page }) => {
    // Wait for terminal to be ready
    await page.waitForSelector('input[type="text"]');
    
    // Type help command
    await page.locator('input[type="text"]').fill('help');
    await page.keyboard.press('Enter');
    
    // Wait for command to complete
    await page.waitForTimeout(1000);
    
    // Check for help output
    await expect(page.getByText('Available commands:')).toBeVisible();
    await expect(page.getByText('help        - Show this help message')).toBeVisible();
    await expect(page.getByText('about       - Personal summary')).toBeVisible();
    await expect(page.getByText('experience  - Work history')).toBeVisible();
    await expect(page.getByText('Navigate with UP/DOWN arrow keys for command history.')).toBeVisible();
  });

  test('should execute about command', async ({ page }) => {
    await page.waitForSelector('input[type="text"]');
    
    await page.locator('input[type="text"]').fill('about');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Noah Jenkins - Cloud Administrator, Full Stack Developer & Voice Actor')).toBeVisible();
    await expect(page.getByText('Always learning, always building, always creating.')).toBeVisible();
  });

  test('should execute experience command', async ({ page }) => {
    await page.waitForSelector('input[type="text"]');
    
    await page.locator('input[type="text"]').fill('experience');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Professional Experience:')).toBeVisible();
    await expect(page.getByText('🏢 Middleby, Cloud Engineer')).toBeVisible();
    await expect(page.getByText('🏢 MSI, Cloud Administrator')).toBeVisible();
  });

  test('should execute skills command', async ({ page }) => {
    await page.waitForSelector('input[type="text"]');
    
    await page.locator('input[type="text"]').fill('skills');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Technical Skills:')).toBeVisible();
    await expect(page.getByText('☁️  Cloud Platforms:')).toBeVisible();
    await expect(page.getByText('Azure: Azure Active Directory/Entra ID')).toBeVisible();
  });

  test('should execute whoami command', async ({ page }) => {
    await page.waitForSelector('input[type="text"]');
    
    await page.locator('input[type="text"]').fill('whoami');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Use more specific selector within main content area
    await expect(page.locator('main').getByText('Noah Jenkins').first()).toBeVisible();
    await expect(page.getByText('Current session: Interactive Resume Terminal')).toBeVisible();
  });

  test('should execute ls command', async ({ page }) => {
    await page.waitForSelector('input[type="text"]');
    
    await page.locator('input[type="text"]').fill('ls');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Available sections:')).toBeVisible();
    await expect(page.getByText('about.txt      experience.txt    skills.txt')).toBeVisible();
    await expect(page.getByText('Use "cat [filename]" to view contents')).toBeVisible();
  });

  test('should execute cat command with file', async ({ page }) => {
    await page.waitForSelector('input[type="text"]');
    
    await page.locator('input[type="text"]').fill('cat about.txt');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Noah Jenkins - Cloud Administrator, Full Stack Developer & Voice Actor')).toBeVisible();
  });

  test('should handle invalid command', async ({ page }) => {
    await page.waitForSelector('input[type="text"]');
    
    await page.locator('input[type="text"]').fill('invalidcommand');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Command not found: invalidcommand')).toBeVisible();
    await expect(page.getByText('Type \'help\' for available commands.')).toBeVisible();
  });

  test('should clear terminal with clear command', async ({ page }) => {
    await page.waitForSelector('input[type="text"]');
    
    // First, add some content
    await page.locator('input[type="text"]').fill('help');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Verify content exists
    await expect(page.getByText('Available commands:')).toBeVisible();
    
    // Clear terminal
    await page.locator('input[type="text"]').fill('clear');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Verify content is cleared (welcome message should be gone)
    await expect(page.getByText('Available commands:')).not.toBeVisible();
  });

  test('should support command history with arrow keys', async ({ page }) => {
    await page.waitForSelector('input[type="text"]');
    
    const input = page.locator('input[type="text"]');
    
    // Execute first command
    await input.fill('help');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000); // Wait for typing animation
    
    // Execute second command
    await input.fill('about');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000); // Wait for typing animation
    
    // Ensure input is focused and ready
    await input.click();
    await page.waitForTimeout(500);
    
    // Use up arrow to get previous command
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('about');
    
    // Use up arrow again to get earlier command
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('help');
    
    // Use down arrow to go forward in history
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveValue('about');
  });

  test('should have working close button', async ({ page }) => {
    // Wait for terminal to be fully loaded
    await page.waitForSelector('input[type="text"]');
    
    // Click close button (red circle)
    await page.locator('main .w-3.h-3.rounded-full.bg-red-500').click();
    
    // Terminal should be hidden - wait a moment for animation
    await page.waitForTimeout(500);
    await expect(page.locator('main').getByText('noah@jenkins-terminal:~').first()).not.toBeVisible();
  });

  test('should have draggable functionality', async ({ page }) => {
    await page.waitForSelector('.bg-black.border-2.border-\\[\\#00ff00\\]');
    
    const terminal = page.locator('.bg-black.border-2.border-\\[\\#00ff00\\]');
    const header = page.locator('.bg-\\[\\#00ff00\\].text-black');
    
    // Get initial position
    const initialBox = await terminal.boundingBox();
    
    // Drag terminal header
    await header.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 50);
    await page.mouse.up();
    
    // Terminal should have moved (position should be different)
    const newBox = await terminal.boundingBox();
    expect(newBox!.x).not.toBe(initialBox!.x);
  });

  test('should execute easter egg commands', async ({ page }) => {
    await page.waitForSelector('input[type="text"]');
    
    // Test R2D2 easter egg
    await page.locator('input[type="text"]').fill('r2d2');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('*BEEP BOOP* R2-D2 reporting for duty!')).toBeVisible();
    await expect(page.getByText('May the Force be with you, young padawan.')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/terminal');
    
    await page.waitForSelector('.bg-black.border-2.border-\\[\\#00ff00\\]');
    
    // Terminal should still be visible and functional
    await expect(page.locator('.bg-black.border-2.border-\\[\\#00ff00\\]')).toBeVisible();
    await expect(page.getByText('Welcome to Noah Jenkins Interactive Resume Terminal')).toBeVisible();
    
    // Input should still work
    await page.locator('input[type="text"]').fill('help');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Available commands:')).toBeVisible();
  });

  test('should have proper keyboard accessibility', async ({ page }) => {
    await page.waitForSelector('input[type="text"]');
    
    // Focus should automatically be on input
    const input = page.locator('input[type="text"]');
    await expect(input).toBeFocused();
    
    // Tab navigation should work
    await page.keyboard.press('Tab');
    // Focus might move to close button or other interactive elements
    
    // Enter key should submit commands
    await input.fill('help');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Available commands:')).toBeVisible();
  });
});