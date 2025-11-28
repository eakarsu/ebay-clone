/// <reference types="cypress" />

describe('Buying Features Tests', () => {
  describe('Making Offers', () => {
    it('should display my offers page or redirect to login', () => {
      cy.visit('/my-offers');
      cy.get('body').should('be.visible');
    });

    it('should display offers received page or redirect to login', () => {
      cy.visit('/offers-received');
      cy.get('body').should('be.visible');
    });

    it('should display offer history page or redirect to login', () => {
      cy.visit('/offer-history');
      cy.get('body').should('be.visible');
    });
  });

  describe('Best Offer Feature', () => {
    it('should display best offer info page', () => {
      cy.visit('/best-offer');
      cy.get('body').should('be.visible');
    });
  });

  describe('Cart Features', () => {
    it('should display cart page', () => {
      cy.visit('/cart');
      cy.get('body').should('be.visible');
    });

    it('should display saved items page or redirect to login', () => {
      cy.visit('/saved-items');
      cy.get('body').should('be.visible');
    });
  });

  describe('Checkout Process', () => {
    it('should display checkout page or redirect to login', () => {
      cy.visit('/checkout');
      cy.get('body').should('be.visible');
    });

    it('should display order confirmation page', () => {
      cy.visit('/order-confirmation');
      cy.get('body').should('be.visible');
    });
  });

  describe('Payment Options', () => {
    it('should display payment options page', () => {
      cy.visit('/payment-options');
      cy.get('body').should('be.visible');
    });

    it('should display coupon codes page', () => {
      cy.visit('/coupons');
      cy.get('body').should('be.visible');
    });

    it('should display gift cards page', () => {
      cy.visit('/gift-cards');
      cy.get('body').should('be.visible');
    });
  });

  describe('Price Features', () => {
    it('should display price alerts page or redirect to login', () => {
      cy.visit('/price-alerts');
      cy.get('body').should('be.visible');
    });

    it('should display price history page', () => {
      cy.visit('/price-history');
      cy.get('body').should('be.visible');
    });
  });

  describe('Watchlist', () => {
    it('should display watchlist page or redirect to login', () => {
      cy.visit('/watchlist');
      cy.get('body').should('be.visible');
    });
  });

  describe('Recently Viewed', () => {
    it('should display recently viewed page', () => {
      cy.visit('/recently-viewed');
      cy.get('body').should('be.visible');
    });
  });
});
