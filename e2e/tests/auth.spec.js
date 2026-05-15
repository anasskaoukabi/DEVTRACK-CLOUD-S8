import { test, expect } from '@playwright/test';

test.describe('Authentification (DevTrack)', () => {
  test('Login avec Youssef (Admin) et vérification du tableau de bord', async ({ page }) => {
    // 1. Accéder à la page de login
    await page.goto('/login');
    
    // 2. Remplir le formulaire
    await page.fill('input[type="email"]', 'youssef@g2i.ma');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 3. Vérifier la redirection et la présence du titre du dashboard
    // Wait for URL to not be /login
    await page.waitForURL('**/');
    
    const heading = await page.locator('h1', { hasText: 'Tableau de bord' });
    await expect(heading).toBeVisible();
    
    // 4. Vérifier la présence du projet marocain dans la liste
    const projectCard = await page.locator('text=Migration ERP Odoo 19 (G2I)');
    await expect(projectCard).toBeVisible();
  });
});
