import { test, expect } from '@playwright/test';

test.describe('Terminal Resize Fix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/terminal');
    // Wait for terminal to fully load
    await expect(page.getByText('Welcome to Noah Jenkins Interactive Resume Terminal')).toBeVisible();
  });

  test('should NOT close terminal when resizing', async ({ page }) => {
    // Verify terminal is visible initially
    const terminal = page.locator('.bg-black.border-2.border-\\[\\#00ff00\\]');
    await expect(terminal).toBeVisible();
    
    // Find the resize handle
    const resizeHandle = page.locator('.cursor-se-resize');
    await expect(resizeHandle).toBeVisible();
    
    // Get initial bounds
    const initialBox = await terminal.boundingBox();
    expect(initialBox).toBeTruthy();
    
    // Simulate resize operation by dragging the resize handle
    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + initialBox!.width + 50, initialBox!.y + initialBox!.height + 50);
    await page.mouse.up();
    
    // Terminal should still be visible after resize
    await expect(terminal).toBeVisible();
    await expect(page.getByText('Welcome to Noah Jenkins Interactive Resume Terminal')).toBeVisible();
    
    // Input should still work
    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await input.fill('help');
    await page.keyboard.press('Enter');
    
    // Wait for command output
    await page.waitForTimeout(1000);
    await expect(page.getByText('Available commands:')).toBeVisible();
  });

  test('should close terminal when clicking outside', async ({ page }) => {
    // Verify terminal is visible initially
    const terminal = page.locator('.bg-black.border-2.border-\\[\\#00ff00\\]');
    await expect(terminal).toBeVisible();
    
    // Click outside the terminal (on the background)
    await page.mouse.click(50, 50);
    
    // Terminal should be hidden after clicking outside
    await expect(terminal).not.toBeVisible();
  });

  test('should NOT close when clicking inside terminal during resize preparation', async ({ page }) => {
    // Verify terminal is visible initially
    const terminal = page.locator('.bg-black.border-2.border-\\[\\#00ff00\\]');
    await expect(terminal).toBeVisible();
    
    // Click inside the terminal (on the content area)
    const terminalBox = await terminal.boundingBox();
    expect(terminalBox).toBeTruthy();
    
    await page.mouse.click(
      terminalBox!.x + terminalBox!.width / 2, 
      terminalBox!.y + terminalBox!.height / 2
    );
    
    // Terminal should still be visible after clicking inside
    await expect(terminal).toBeVisible();
    await expect(page.getByText('Welcome to Noah Jenkins Interactive Resume Terminal')).toBeVisible();
  });
});