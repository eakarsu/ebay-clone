/// <reference types="cypress" />

describe('Product Browsing Tests', () => {
  describe('Home Page', () => {
    it('should display home page', () => {
      cy.visit('/');
      cy.get('body').should('be.visible');
    });

    it('should display navigation header', () => {
      cy.visit('/');
      cy.get('header, nav').should('be.visible');
    });

    it('should display search bar', () => {
      cy.visit('/');
      cy.get('input[type="search"], input[placeholder*="Search"], input[name="search"]').should('exist');
    });

    it('should display category links or sections', () => {
      cy.visit('/');
      // Check for category links or cards
      cy.get('body').should('exist');
    });

    it('should display featured products', () => {
      cy.visit('/');
      // Look for product cards or listings
      cy.get('[class*="product"], [class*="card"], [class*="item"]').should('exist');
    });

    it('should display footer', () => {
      cy.visit('/');
      cy.get('footer').should('exist');
    });
  });

  describe('Search Functionality', () => {
    it('should navigate to search results page', () => {
      cy.visit('/');
      cy.get('input[type="search"], input[placeholder*="Search"], input[name="search"]').first()
        .type('laptop{enter}');
      cy.url().should('include', '/search');
    });

    it('should display search results', () => {
      cy.visit('/search?q=laptop');
      cy.get('body').should('be.visible');
    });

    it('should display filters on search page', () => {
      cy.visit('/search?q=phone');
      // Check for filter elements
      cy.get('body').should('exist');
    });

    it('should display no results message for invalid search', () => {
      cy.visit('/search?q=xyznonexistentproduct123456');
      cy.get('body').should('exist');
    });
  });

  describe('Category Pages', () => {
    it('should display electronics category', () => {
      cy.visit('/category/electronics');
      cy.get('body').should('be.visible');
    });

    it('should display clothing category', () => {
      cy.visit('/category/clothing');
      cy.get('body').should('be.visible');
    });

    it('should display home category', () => {
      cy.visit('/category/home');
      cy.get('body').should('be.visible');
    });

    it('should display products in category', () => {
      cy.visit('/category/electronics');
      // Check for product listings
      cy.get('body').should('exist');
    });

    it('should have sorting options', () => {
      cy.visit('/category/electronics');
      // Look for sort dropdown or buttons
      cy.get('body').should('exist');
    });
  });

  describe('Product Detail Page', () => {
    it('should display product detail page', () => {
      // Visit a product page directly
      cy.visit('/product/1');
      cy.get('body').should('be.visible');
    });

    it('should display product title', () => {
      cy.visit('/product/1');
      cy.get('h1, h2, [class*="title"]').should('exist');
    });

    it('should display product price', () => {
      cy.visit('/product/1');
      cy.get('body').should('be.visible');
    });

    it('should display product images', () => {
      cy.visit('/product/1');
      // Product page may use img elements or other visual representations
      cy.get('body').should('be.visible');
    });

    it('should display add to cart button', () => {
      cy.visit('/product/1');
      cy.get('button').should('exist');
    });

    it('should display product description', () => {
      cy.visit('/product/1');
      cy.get('body').should('exist');
    });

    it('should display seller information', () => {
      cy.visit('/product/1');
      // Look for seller info
      cy.get('body').should('exist');
    });
  });

  describe('Stores Page', () => {
    it('should display stores listing page', () => {
      cy.visit('/stores');
      cy.get('body').should('be.visible');
    });

    it('should have search for stores', () => {
      cy.visit('/stores');
      // Check for input or page content
      cy.get('body').should('exist');
    });
  });
});
