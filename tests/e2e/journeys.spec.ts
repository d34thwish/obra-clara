import { test, expect } from '@playwright/test';
test('citizen journey', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /El dinero público/ })).toBeVisible();
  await page.getByLabel('Buscar').fill('Municipalidad');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('link', { name: /Municipalidad Provincial/ }).click();
  await expect(page.getByText('Modo demostración.')).toBeVisible();
});
test('community form', async ({ page }) => {
  await page.goto('/comunidad/proponer');
  await page.getByLabel('Título').fill('Nuevo indicador explicable');
  await page
    .getByLabel('Problema y utilidad')
    .fill('Permitiría revisar patrones con metodología y fuentes claramente documentadas.');
  await page.getByRole('button', { name: 'Enviar a moderación' }).click();
  await expect(page.getByText('Propuesta recibida')).toBeVisible();
});
