/// <reference types="cypress" />

describe('Orders and Shipping Tests', () => {
  describe('Orders Page', () => {
    it('should display orders page or redirect to login', () => {
      cy.visit('/orders');
      cy.get('body').should('be.visible');
    });

    it('should display order history page or redirect to login', () => {
      cy.visit('/order-history');
      cy.get('body').should('be.visible');
    });

    it('should display purchases page or redirect to login', () => {
      cy.visit('/purchases');
      cy.get('body').should('be.visible');
    });
  });

  describe('Order Tracking', () => {
    it('should display tracking page', () => {
      cy.visit('/tracking');
      cy.get('body').should('be.visible');
    });

    it('should display track order page', () => {
      cy.visit('/track-order');
      cy.get('body').should('be.visible');
    });
  });

  describe('Shipping Information', () => {
    it('should display shipping info page', () => {
      cy.visit('/shipping');
      cy.get('body').should('be.visible');
    });

    it('should display shipping calculator page', () => {
      cy.visit('/shipping-calculator');
      cy.get('body').should('be.visible');
    });

    it('should display shipping rates page', () => {
      cy.visit('/shipping-rates');
      cy.get('body').should('be.visible');
    });
  });

  describe('Returns', () => {
    it('should display returns page or redirect to login', () => {
      cy.visit('/returns');
      cy.get('body').should('be.visible');
    });

    it('should display return policy page', () => {
      cy.visit('/return-policy');
      cy.get('body').should('be.visible');
    });

    it('should display start return page or redirect to login', () => {
      cy.visit('/start-return');
      cy.get('body').should('be.visible');
    });
  });

  describe('Refunds', () => {
    it('should display refunds page or redirect to login', () => {
      cy.visit('/refunds');
      cy.get('body').should('be.visible');
    });

    it('should display refund status page', () => {
      cy.visit('/refund-status');
      cy.get('body').should('be.visible');
    });
  });

  describe('Order Cancellation', () => {
    it('should display cancellations page or redirect to login', () => {
      cy.visit('/cancellations');
      cy.get('body').should('be.visible');
    });
  });

  describe('Disputes', () => {
    it('should display disputes page or redirect to login', () => {
      cy.visit('/disputes');
      cy.get('body').should('be.visible');
    });

    it('should display resolution center page', () => {
      cy.visit('/resolution-center');
      cy.get('body').should('be.visible');
    });

    it('should display open case page or redirect to login', () => {
      cy.visit('/open-case');
      cy.get('body').should('be.visible');
    });
  });
});
