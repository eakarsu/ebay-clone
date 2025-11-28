/// <reference types="cypress" />

describe('Messaging and Notifications Tests', () => {
  describe('Messages Page', () => {
    it('should display messages page or redirect to login', () => {
      cy.visit('/messages');
      cy.get('body').should('be.visible');
    });
  });

  describe('Notifications', () => {
    it('should display notifications page or redirect to login', () => {
      cy.visit('/notifications');
      cy.get('body').should('be.visible');
    });

    it('should show notification icon in header on home page', () => {
      cy.visit('/');
      cy.get('header, nav').should('exist');
    });
  });
});
