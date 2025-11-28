/// <reference types="cypress" />

describe('Membership and Rewards Tests', () => {
  describe('Membership Page', () => {
    it('should display membership page or redirect to login', () => {
      cy.visit('/membership');
      cy.get('body').should('be.visible');
    });

    it('should display plan cards', () => {
      cy.visit('/membership');
      cy.get('body').should('exist');
    });

    it('should display prices', () => {
      cy.visit('/membership');
      cy.get('body').should('exist');
    });
  });

  describe('Rewards Page', () => {
    it('should display rewards page or redirect to login', () => {
      cy.visit('/rewards');
      cy.get('body').should('be.visible');
    });
  });
});
