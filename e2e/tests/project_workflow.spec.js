import { test, expect } from '@playwright/test';

test.describe('Workflow Projet & Tâches', () => {
  test.beforeEach(async ({ page }) => {
    // Login avant chaque test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'amine@g2i.ma'); // Amine is DEV
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
  });

  test('Consulter les détails du projet OCP et créer une tâche', async ({ page }) => {
    // 1. Aller sur la page Projets
    await page.click('nav a:has-text("Projets")');
    await page.waitForURL('**/projects');
    
    // 2. Cliquer sur le projet OCP
    await page.click('text=Portail Fournisseurs OCP');
    await page.waitForURL('**/projects/*');
    
    // 3. Vérifier que la description est correcte
    await expect(page.locator('text=Plateforme de gestion')).toBeVisible();

    // 4. Créer une nouvelle tâche dans le backlog
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[name="title"]', 'Intégration API e-Devise Bank Al-Maghrib');
    await page.fill('textarea[name="description"]', 'Connecter l\'API de la banque centrale pour les taux de change.');
    await page.selectOption('select[name="priority"]', 'HIGH');
    await page.click('button:has-text("Créer")');

    // 5. Vérifier que la tâche est dans la liste
    await expect(page.locator('text=Intégration API e-Devise Bank Al-Maghrib')).toBeVisible();
  });
});
