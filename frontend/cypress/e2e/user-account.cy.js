/// <reference types="cypress" />

describe('User Account Tests', () => {
  describe('Profile Page', () => {
    it('should display profile page or redirect to login', () => {
      cy.visit('/profile');
      cy.get('body').should('be.visible');
    });
  });

  describe('Orders Page', () => {
    it('should display orders page or redirect to login', () => {
      cy.visit('/orders');
      cy.get('body').should('be.visible');
    });
  });

  describe('Returns Page', () => {
    it('should display returns page or redirect to login', () => {
      cy.visit('/returns');
      cy.get('body').should('be.visible');
    });
  });

  describe('Security Settings', () => {
    it('should display security settings page or redirect to login', () => {
      cy.visit('/security-settings');
      cy.get('body').should('be.visible');
    });
  });

  describe('Notifications Page', () => {
    it('should display notifications page or redirect to login', () => {
      cy.visit('/notifications');
      cy.get('body').should('be.visible');
    });
  });

  describe('Saved Searches', () => {
    it('should display saved searches page or redirect to login', () => {
      cy.visit('/saved-searches');
      cy.get('body').should('be.visible');
    });
  });

  describe('Price Alerts', () => {
    it('should display price alerts page or redirect to login', () => {
      cy.visit('/price-alerts');
      cy.get('body').should('be.visible');
    });
  });

  describe('My Offers', () => {
    it('should display my offers page or redirect to login', () => {
      cy.visit('/my-offers');
      cy.get('body').should('be.visible');
    });
  });

  describe('Collections', () => {
    it('should display collections page or redirect to login', () => {
      cy.visit('/collections');
      cy.get('body').should('be.visible');
    });
  });

  describe('Disputes', () => {
    it('should display disputes page or redirect to login', () => {
      cy.visit('/disputes');
      cy.get('body').should('be.visible');
    });
  });
});
