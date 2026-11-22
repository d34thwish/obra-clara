import { test, expect } from '@playwright/test';

test('citizen journey', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /El dinero público/ })).toBeVisible();
  await page.getByLabel('Buscar').fill('Municipalidad');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('link', { name: /Municipalidad Provincial/ }).click();
  await expect(page.getByText('Municipalidad Provincial Demostrativa')).toBeVisible();
  await expect(page.getByText('Modo demostración.')).toBeVisible();
});

test('community form', async ({ page }) => {
  await page.goto('/comunidad/proponer');
  await page.getByLabel('Título').fill('Sugerencia general para Obra Clara');
  await page
    .getByLabel('Descripción')
    .fill('Esta propuesta describe una mejora general y concreta para la plataforma cívica.');
  await page.getByRole('button', { name: 'Enviar a moderación' }).click();
  await expect(page.getByRole('heading', { name: 'Propuesta recibida' })).toBeVisible();
  await expect(page.getByText(/OC-/)).toBeVisible();
});
