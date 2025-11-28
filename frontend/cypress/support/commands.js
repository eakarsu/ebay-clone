// ***********************************************
// Custom commands for eBay clone E2E tests
// ***********************************************

// Login command
Cypress.Commands.add('login', (email = 'testuser@example.com', password = 'password123') => {
  cy.visit('/login');
  cy.get('input[name="email"], input[type="email"]').first().clear().type(email);
  cy.get('input[name="password"], input[type="password"]').first().clear().type(password);
  cy.get('button[type="submit"]').first().click();
  cy.url().should('not.include', '/login');
});

// Login via API (faster)
Cypress.Commands.add('loginViaApi', (email = 'testuser@example.com', password = 'password123') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body.token) {
      window.localStorage.setItem('token', response.body.token);
      if (response.body.user) {
        window.localStorage.setItem('user', JSON.stringify(response.body.user));
      }
    }
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
  cy.visit('/');
});

// Register command
Cypress.Commands.add('register', (username, email, password) => {
  cy.visit('/register');
  cy.get('input[name="username"]').clear().type(username);
  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('input[name="confirmPassword"]').clear().type(password);
  cy.get('button[type="submit"]').click();
});

// Add product to cart command
Cypress.Commands.add('addToCart', (productId) => {
  cy.visit(`/product/${productId}`);
  cy.get('button').contains(/add to cart|buy it now/i).first().click();
});

// Check if element is visible or exists
Cypress.Commands.add('isVisible', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).should('be.visible');
});

// Wait for page to load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.wait(500); // Small delay for React to hydrate
});

// Check navigation works
Cypress.Commands.add('navigateTo', (path) => {
  cy.visit(path);
  cy.waitForPageLoad();
});

// Search for products
Cypress.Commands.add('searchProducts', (query) => {
  cy.get('input[type="search"], input[placeholder*="Search"], input[name="search"]').first()
    .clear()
    .type(query)
    .type('{enter}');
});

// Check toast/alert message
Cypress.Commands.add('checkToast', (message) => {
  cy.get('.MuiAlert-root, .MuiSnackbar-root, [role="alert"]')
    .should('be.visible')
    .and('contain', message);
});

// Generate TOTP code from secret
Cypress.Commands.add('generateTOTP', (secret) => {
  return cy.task('generateTOTP', secret);
});

// Verify TOTP code
Cypress.Commands.add('verifyTOTP', (secret, token) => {
  return cy.task('verifyTOTP', { secret, token });
});

// Login with 2FA support via API
Cypress.Commands.add('loginWith2FA', (email, password, twoFactorCode) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password, twoFactorCode },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body.token) {
      window.localStorage.setItem('token', response.body.token);
      if (response.body.user) {
        window.localStorage.setItem('user', JSON.stringify(response.body.user));
      }
    }
    return response;
  });
});

// Setup 2FA via API (requires auth token)
Cypress.Commands.add('setup2FAViaApi', () => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/2fa/setup`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    failOnStatusCode: false,
  });
});

// Verify and enable 2FA via API
Cypress.Commands.add('verify2FAViaApi', (code) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/2fa/verify`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    body: { code },
    failOnStatusCode: false,
  });
});

// Disable 2FA via API
Cypress.Commands.add('disable2FAViaApi', () => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/2fa/disable`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    failOnStatusCode: false,
  });
});
