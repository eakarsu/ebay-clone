/// <reference types="cypress" />

describe('Bidding and Auctions Tests', () => {
  describe('Bids Page', () => {
    it('should display bids page or redirect to login', () => {
      cy.visit('/bids');
      cy.get('body').should('be.visible');
    });

    it('should display my bids page or redirect to login', () => {
      cy.visit('/my-bids');
      cy.get('body').should('be.visible');
    });
  });

  describe('Auction Listings', () => {
    it('should display auctions page', () => {
      cy.visit('/auctions');
      cy.get('body').should('be.visible');
    });

    it('should display auction category page', () => {
      cy.visit('/category/auctions');
      cy.get('body').should('be.visible');
    });
  });

  describe('Bid Increments Info', () => {
    it('should display bid increments page', () => {
      cy.visit('/bid-increments');
      cy.get('body').should('be.visible');
    });
  });

  describe('Reserve Price Auctions', () => {
    it('should display reserve price info page', () => {
      cy.visit('/reserve-price');
      cy.get('body').should('be.visible');
    });
  });

  describe('Buy It Now + Auction', () => {
    it('should display buy it now info page', () => {
      cy.visit('/buy-it-now');
      cy.get('body').should('be.visible');
    });
  });

  describe('Auction End Times', () => {
    it('should display ending soon auctions', () => {
      cy.visit('/ending-soon');
      cy.get('body').should('be.visible');
    });
  });
});
