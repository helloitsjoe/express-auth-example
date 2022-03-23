// eslint-disable-next-line
/// <reference types="cypress" />

const testId = (id) => `[data-testid="${id}"]`;

describe('Auth', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('JWT', () => {
    it('Returns error before logging in', () => {
      cy.get(testId('jwt-input')).type('test');
      cy.get('.error').should('not.be.visible');

      cy.get(testId('jwt-submit')).click();
      cy.get('.error').should('be.visible');
    });

    it('Returns token when logging in', () => {
      cy.get(testId('jwt-login-input')).type('test');
      cy.get(testId('jwt-password-input')).type('123');

      cy.get(testId('jwt-login-submit')).click();
      cy.contains(/loading/i).should('be', true);

      cy.contains(/token/i).should('be', true);
      cy.contains(/loading/i).should('be', false);
    });
  });

  describe('Simple Token', () => {
    it('Returns error before logging in', () => {
      cy.get(testId('simple-token-input')).type('test');
      cy.get('.error').should('not.be.visible');

      cy.get(testId('simple-token-submit')).click();
      cy.get('.error').should('be.visible');
    });

    it('Returns token when logging in', () => {
      cy.get(testId('simple-token-login-input')).type('test');
      cy.get(testId('simple-token-password-input')).type('123');

      cy.get(testId('simple-token-login-submit')).click();
      cy.contains(/loading/i).should('be', true);

      cy.contains(/token/i).should('be', true);
      cy.contains(/loading/i).should('be', false);
    });
  });

  describe('Session', () => {
    it('Returns error before logging in', () => {
      cy.get(testId('session-input')).type('test');
      cy.get('.error').should('not.be.visible');

      cy.get(testId('session-submit')).click();
      cy.get('.error').should('be.visible');
    });

    it('Returns token when logging in', () => {
      cy.get(testId('session-login-input')).type('test');
      cy.get(testId('session-password-input')).type('123');

      cy.get(testId('session-login-submit')).click();
      cy.contains(/loading/i).should('be', true);

      cy.contains(/token/i).should('be', true);
      cy.contains(/loading/i).should('be', false);
    });
  });

  describe('OAuth', () => {
    it('Returns error before logging in', () => {
      cy.get(testId('oauth-message-input')).type('test');
      cy.get('.error').should('not.be.visible');

      cy.contains(/send oauth message/i).click();
      cy.get('.error').should('be.visible');
    });

    // Apparently Cypress can't handle multiple windows
    // it('Returns token when logging in', () => {
    //   cy.contains(/authorize with oauth/i).click();

    //   // 2nd window
    //   cy.contains(/^authorize$/i).click();

    //   cy.contains(/token/i).should('be', true);
    // });
  });
});
