const { defineConfig } = require('cypress');
const { authenticator } = require('otplib');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // Task to generate TOTP code from secret
      on('task', {
        generateTOTP(secret) {
          return authenticator.generate(secret);
        },
        verifyTOTP({ secret, token }) {
          return authenticator.verify({ token, secret });
        },
      });
    },
  },
  env: {
    apiUrl: 'http://localhost:4000/api',
  },
});
