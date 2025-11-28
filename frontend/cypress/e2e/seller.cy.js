/// <reference types="cypress" />

describe('Seller Features Tests', () => {
  describe('Sell Item Page', () => {
    it('should display sell item page or redirect to login', () => {
      cy.visit('/sell');
      cy.get('body').should('be.visible');
    });
  });

  describe('My Listings Page', () => {
    it('should display my listings page or redirect to login', () => {
      cy.visit('/my-listings');
      cy.get('body').should('be.visible');
    });
  });

  describe('Seller Dashboard', () => {
    it('should display seller dashboard or redirect to login', () => {
      cy.visit('/seller-dashboard');
      cy.get('body').should('be.visible');
    });
  });

  describe('Seller Store', () => {
    it('should display seller store page or redirect to login', () => {
      cy.visit('/seller-store');
      cy.get('body').should('be.visible');
    });
  });

  describe('Seller Performance', () => {
    it('should display seller performance page or redirect to login', () => {
      cy.visit('/seller-performance');
      cy.get('body').should('be.visible');
    });
  });

  describe('Selling Limits', () => {
    it('should display selling limits page or redirect to login', () => {
      cy.visit('/selling-limits');
      cy.get('body').should('be.visible');
    });
  });

  describe('Promoted Listings', () => {
    it('should display promoted listings page or redirect to login', () => {
      cy.visit('/promoted-listings');
      cy.get('body').should('be.visible');
    });
  });

  describe('Bulk Upload', () => {
    it('should display bulk upload page or redirect to login', () => {
      cy.visit('/bulk-upload');
      cy.get('body').should('be.visible');
    });
  });

  describe('Scheduled Listings', () => {
    it('should display scheduled listings page or redirect to login', () => {
      cy.visit('/scheduled-listings');
      cy.get('body').should('be.visible');
    });
  });

  describe('Invoices', () => {
    it('should display invoices page or redirect to login', () => {
      cy.visit('/invoices');
      cy.get('body').should('be.visible');
    });
  });
});
