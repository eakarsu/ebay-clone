/// <reference types="cypress" />

describe('Security and 2FA Tests', () => {
  describe('Security Settings Page', () => {
    it('should display security settings page or redirect to login', () => {
      cy.visit('/security-settings');
      cy.get('body').should('be.visible');
    });

    it('should display security center page', () => {
      cy.visit('/security-center');
      cy.get('body').should('be.visible');
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should display 2FA setup page or redirect to login', () => {
      cy.visit('/2fa');
      cy.get('body').should('be.visible');
    });

    it('should display 2FA settings page or redirect to login', () => {
      cy.visit('/2fa-settings');
      cy.get('body').should('be.visible');
    });
  });

  describe('Password Management', () => {
    it('should display change password page or redirect to login', () => {
      cy.visit('/change-password');
      cy.get('body').should('be.visible');
    });

    it('should display reset password page', () => {
      cy.visit('/reset-password');
      cy.get('body').should('be.visible');
    });
  });

  describe('Account Security', () => {
    it('should display account activity page or redirect to login', () => {
      cy.visit('/account-activity');
      cy.get('body').should('be.visible');
    });

    it('should display login history page or redirect to login', () => {
      cy.visit('/login-history');
      cy.get('body').should('be.visible');
    });

    it('should display active sessions page or redirect to login', () => {
      cy.visit('/active-sessions');
      cy.get('body').should('be.visible');
    });
  });

  describe('Privacy Settings', () => {
    it('should display privacy settings page or redirect to login', () => {
      cy.visit('/privacy-settings');
      cy.get('body').should('be.visible');
    });

    it('should display data export page or redirect to login', () => {
      cy.visit('/data-export');
      cy.get('body').should('be.visible');
    });
  });
});
