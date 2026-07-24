const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

test('runtime AI requires canonical OpenRouter configuration and a provider receipt', () => {
  const service = fs.readFileSync(path.resolve(__dirname, '../src/services/aiService.js'), 'utf8');
  const controller = fs.readFileSync(path.resolve(__dirname, '../src/controllers/aiController.js'), 'utf8');
  assert.match(service, /this\.baseUrl !== 'https:\/\/openrouter\.ai\/api\/v1'/);
  assert.match(controller, /if \(!result \|\| !providerReceipt\)/);
  assert.match(controller, /AI result persistence failed/);
});

test('runtime AI persistence includes substantive output and provider receipt', () => {
  const controller = fs.readFileSync(path.resolve(__dirname, '../src/controllers/aiController.js'), 'utf8');
  assert.match(controller, /feature: 'marketplace-readiness'/);
  assert.match(controller, /payload: \{ result, provider: 'openrouter', providerReceipt \}/);
});
