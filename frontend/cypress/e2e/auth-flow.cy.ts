// frontend/cypress/e2e/auth-flow.cy.ts
describe('Authentication Flow', () => {
    beforeEach(() => {
      // Clear localStorage and cookies before each test
      cy.clearLocalStorage();
      cy.clearCookies();
    });
    
    it('should allow a user to log in and access protected pages', () => {
      // Visit login page
      cy.visit('/login');
      
      // Fill out login form
      cy.get('[data-testid=email-input]').type('user@example.com');
      cy.get('[data-testid=password-input]').type('password123');
      
      // Submit form
      cy.get('[data-testid=login-button]').click();
      
      // Verify redirect to dashboard
      cy.url().should('include', '/dashboard');
      
      // Verify user info is displayed
      cy.get('[data-testid=user-display]').should('contain', 'user@example.com');
      
      // Navigate to protected page
      cy.get('[data-testid=contexts-link]').click();
      
      // Verify access to protected page
      cy.url().should('include', '/contexts');
      cy.get('h1').should('contain', 'Contexts');
    });
    
    it('should redirect unauthenticated users to login page', () => {
      // Try to access protected page without logging in
      cy.visit('/contexts');
      
      // Verify redirect to login page
      cy.url().should('include', '/login');
      
      // Verify login form is displayed
      cy.get('[data-testid=login-form]').should('exist');
    });
    
    it('should maintain authentication after page refresh', () => {
      // Log in
      cy.visit('/login');
      cy.get('[data-testid=email-input]').type('user@example.com');
      cy.get('[data-testid=password-input]').type('password123');
      cy.get('[data-testid=login-button]').click();
      
      // Verify login successful
      cy.url().should('include', '/dashboard');
      
      // Refresh the page
      cy.reload();
      
      // Verify still logged in
      cy.get('[data-testid=user-display]').should('contain', 'user@example.com');
      cy.url().should('include', '/dashboard');
    });
    
    it('should allow a user to log out', () => {
      // Log in
      cy.visit('/login');
      cy.get('[data-testid=email-input]').type('user@example.com');
      cy.get('[data-testid=password-input]').type('password123');
      cy.get('[data-testid=login-button]').click();
      
      // Click logout button
      cy.get('[data-testid=user-menu]').click();
      cy.get('[data-testid=logout-button]').click();
      
      // Verify redirect to login page
      cy.url().should('include', '/login');
      
      // Try to access protected page
      cy.visit('/contexts');
      
      // Verify redirect back to login
      cy.url().should('include', '/login');
    });
  });