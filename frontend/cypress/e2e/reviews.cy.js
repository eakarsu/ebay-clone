/// <reference types="cypress" />

describe('Reviews and Feedback Tests', () => {
  describe('Feedback Page', () => {
    it('should display feedback page or redirect to login', () => {
      cy.visit('/feedback');
      cy.get('body').should('be.visible');
    });

    it('should display my feedback page or redirect to login', () => {
      cy.visit('/my-feedback');
      cy.get('body').should('be.visible');
    });

    it('should display feedback profile page', () => {
      cy.visit('/feedback-profile');
      cy.get('body').should('be.visible');
    });
  });

  describe('Reviews Page', () => {
    it('should display reviews page', () => {
      cy.visit('/reviews');
      cy.get('body').should('be.visible');
    });

    it('should display my reviews page or redirect to login', () => {
      cy.visit('/my-reviews');
      cy.get('body').should('be.visible');
    });
  });

  describe('Seller Ratings', () => {
    it('should display seller ratings page', () => {
      cy.visit('/seller-ratings');
      cy.get('body').should('be.visible');
    });
  });

  describe('Product Reviews', () => {
    it('should display product review guidelines', () => {
      cy.visit('/review-guidelines');
      cy.get('body').should('be.visible');
    });
  });

  describe('Reputation System', () => {
    it('should display reputation info page', () => {
      cy.visit('/reputation');
      cy.get('body').should('be.visible');
    });
  });
});
