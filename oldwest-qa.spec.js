const { test } = require('playwright/test');
const pages = ['index.html','servicios.html','experiencia.html','ubicacion.html','agendamiento.html','contacto.html'];
for (const pageName of pages) {
  test.describe(pageName, () => {
    test('desktop audit', async ({ page }) => {
      const errors = [];
      const failures = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('pageerror', err => errors.push('PAGE: ' + err.message));
      page.on('requestfailed', req => failures.push(req.url() + ' :: ' + req.failure().errorText));
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.goto('http://localhost:3000/' + pageName, { waitUntil: 'networkidle' });
      const result = await page.evaluate(() => ({
        width: window.innerWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        h1: document.querySelector('h1')?.textContent?.trim() || '',
        brokenImages: Array.from(document.images).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src),
        btns: Array.from(document.querySelectorAll('.btn')).length
      }));
      console.log('AUDIT_DESKTOP ' + pageName + ' ' + JSON.stringify({ result, errors, failures }));
    });
    test('mobile audit', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('http://localhost:3000/' + pageName, { waitUntil: 'networkidle' });
      const result = await page.evaluate(() => ({
        width: window.innerWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        ctaVisible: !!Array.from(document.querySelectorAll('.nav__cta')).find(el => getComputedStyle(el).display !== 'none'),
        heroButtons: Array.from(document.querySelectorAll('.hero .btn')).map(el => el.textContent.trim())
      }));
      console.log('AUDIT_MOBILE ' + pageName + ' ' + JSON.stringify(result));
    });
  });
}
