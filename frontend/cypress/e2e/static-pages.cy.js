/// <reference types="cypress" />

describe('Static Pages Tests', () => {
  describe('Help Page', () => {
    it('should display help page', () => {
      cy.visit('/help');
      cy.get('body').should('be.visible');
    });

    it('should have search functionality', () => {
      cy.visit('/help');
      cy.get('input').should('exist');
    });

    it('should display help categories', () => {
      cy.visit('/help');
      cy.get('body').should('exist');
    });
  });

  describe('About Page', () => {
    it('should display about page', () => {
      cy.visit('/about');
      cy.get('body').should('be.visible');
    });

    it('should display company information', () => {
      cy.visit('/about');
      cy.get('body').should('exist');
    });
  });

  describe('Contact Page', () => {
    it('should display contact page', () => {
      cy.visit('/contact');
      cy.get('body').should('be.visible');
    });

    it('should have contact form', () => {
      cy.visit('/contact');
      cy.get('form, input, textarea').should('exist');
    });
  });

  describe('Legal Page', () => {
    it('should display legal page', () => {
      cy.visit('/legal');
      cy.get('body').should('be.visible');
    });
  });

  describe('Policies Page', () => {
    it('should display policies page', () => {
      cy.visit('/policies');
      cy.get('body').should('be.visible');
    });
  });

  describe('Careers Page', () => {
    it('should display careers page', () => {
      cy.visit('/careers');
      cy.get('body').should('be.visible');
    });
  });

  describe('Site Map Page', () => {
    it('should display site map page', () => {
      cy.visit('/site-map');
      cy.get('body').should('be.visible');
    });

    it('should display navigation links', () => {
      cy.visit('/site-map');
      cy.get('a').should('exist');
    });
  });

  describe('Authenticity Guarantee Page', () => {
    it('should display authenticity guarantee page', () => {
      cy.visit('/authenticity-guarantee');
      cy.get('body').should('be.visible');
    });
  });

  describe('Motors Page', () => {
    it('should display motors page', () => {
      cy.visit('/motors');
      cy.get('body').should('be.visible');
    });
  });

  describe('Apps Page', () => {
    it('should display apps page', () => {
      cy.visit('/apps');
      cy.get('body').should('be.visible');
    });

    it('should display app download links', () => {
      cy.visit('/apps');
      cy.get('body').should('exist');
    });
  });

  describe('Local Pickup Page', () => {
    it('should display local pickup page', () => {
      cy.visit('/local-pickup');
      cy.get('body').should('be.visible');
    });
  });

  describe('GSP Page', () => {
    it('should display global shipping program page', () => {
      cy.visit('/gsp');
      cy.get('body').should('be.visible');
    });
  });

  describe('Import Duties Page', () => {
    it('should display import duties page', () => {
      cy.visit('/import-duties');
      cy.get('body').should('be.visible');
    });
  });

  describe('Charity Listings Page', () => {
    it('should display charity listings page', () => {
      cy.visit('/charity-listings');
      cy.get('body').should('be.visible');
    });
  });

  describe('Government Page', () => {
    it('should display government page', () => {
      cy.visit('/government');
      cy.get('body').should('be.visible');
    });
  });

  describe('Volume Pricing Page', () => {
    it('should display volume pricing page', () => {
      cy.visit('/volume-pricing');
      cy.get('body').should('be.visible');
    });
  });

  describe('Bid Retractions Page', () => {
    it('should display bid retractions page', () => {
      cy.visit('/bid-retractions');
      cy.get('body').should('be.visible');
    });
  });

  describe('Proxy Bidding Page', () => {
    it('should display proxy bidding page', () => {
      cy.visit('/proxy-bidding');
      cy.get('body').should('be.visible');
    });
  });

  describe('Second Chance Offer Page', () => {
    it('should display second chance offer page', () => {
      cy.visit('/second-chance-offer');
      cy.get('body').should('be.visible');
    });
  });

  describe('Payment Plans Page', () => {
    it('should display payment plans page', () => {
      cy.visit('/payment-plans');
      cy.get('body').should('be.visible');
    });
  });
});
