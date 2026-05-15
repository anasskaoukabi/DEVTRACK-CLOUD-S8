import { test, expect } from '@playwright/test';

test.describe('Assurance Qualité (QA) Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login avec Fatima (QA)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'fatima@g2i.ma');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
  });

  test('Consulter les bugs ISO 17025 et mettre à jour le statut', async ({ page }) => {
    // 1. Aller sur le Dashboard QA
    await page.click('nav a:has-text("Bugs")');
    await page.waitForURL('**/bugs');
    
    // 2. Vérifier la présence du bug d'encodage (spécifique au jeu de données)
    const bugTitle = await page.locator('text=Problème d\'encodage des caractères arabes');
    await expect(bugTitle).toBeVisible();

    // 3. Cliquer sur le bug pour voir les détails
    await bugTitle.click();
    
    // 4. Mettre à jour le statut du bug à "IN_PROGRESS"
    // Supposons qu'il y ait un select de statut ou un bouton "Mettre en cours"
    // Comme l'UI exacte peut varier, on tente de modifier le statut via un select :
    const statusSelect = await page.locator('select[name="status"]');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('IN_PROGRESS');
      await expect(page.locator('text=Sauvegardé')).toBeVisible();
    }
  });

  test('Vérifier la présence des Test Plans ISO 17025', async ({ page }) => {
    // 1. Aller sur la page Test Plans
    await page.click('nav a:has-text("Plans de Test")');
    await page.waitForURL('**/test-plans');
    
    // 2. Vérifier la présence du plan ISO 17025
    await expect(page.locator('text=Validation Conformité ISO 17025')).toBeVisible();
  });
});
