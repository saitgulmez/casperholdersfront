describe('Balance', () => {
  it('It show balance', () => {
    cy.visit('http://localhost:8080/balance');
    cy.wait(500);
    cy.get('#balance-not-connected')
      .should('be.visible')
      .should('contain', 'Not connected.');
    cy.get('#balance-no-liquidity')
      .should('not.exist');
    cy.get('#balance-chart')
      .should('not.exist');

    const msg = {
      detail: {
        isUnlocked: true,
        isConnected: true,
        activeKey: '01270a577d2d106c4d29402775f3dffcb9f04aad542579dd4d1cfad20572ebcb7c',
      },
    };
    const event = new CustomEvent('signer:connected', msg);
    cy.window().then((win) => {
      win.dispatchEvent(event);
    });
    cy.get('#balance-not-connected', { timeout: 5000 })
      .should('not.exist');
    cy.get('#balance-total-staked .amount')
      .should('be.visible')
      .should('not.contain', '0.00000\xa0CSPR')
      .contains(/^\d*,*\d+\.\d{5} CSPR$/);
    cy.get('#balance-total-available .amount')
      .should('be.visible')
      .should('not.contain', '0.00000\xa0CSPR')
      .contains(/^\d*,*\d+\.\d{5} CSPR$/);
    cy.get('#balance-total-staked .amount')
      .should('be.visible')
      .should('not.contain', '0.00000\xa0CSPR')
      .contains(/^\d*,*\d+\.\d{5} CSPR$/);

    cy.get('.reward-calculator-panel-header').click();
    cy.get('.reward-calculator').should('be.visible');
    cy.get('.operations', { timeout: 60000 }).should('contain', '1-10 of');

    cy.wait(2000).window().then((win) => {
      msg.detail.activeKey = '01270a577d2d106c4d29402775f3dffcb9f04aad542579dd4d1cfad20572ebcb7a';
      win.dispatchEvent(event);
    });

    cy.get('#balance-not-connected')
      .should('not.exist');
    cy.get('#balance-total-staked .amount')
      .should('be.visible')
      .should('contain', '0.00000\xa0CSPR')
    cy.get('#balance-total-available .amount')
      .should('be.visible')
      .should('contain', '0.00000\xa0CSPR')
    cy.get('#balance-total .amount')
      .should('be.visible')
      .should('contain', '0.00000\xa0CSPR')
  });
});
