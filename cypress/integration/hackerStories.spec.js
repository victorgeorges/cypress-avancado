describe('Hacker Stories', () => {
  const initialTerm = 'React'
  const newTerm = 'Cypress'
  context('Hitting the real API ', function () {
    beforeEach(() => {
      // tu ta fazendo uma interceptação do tipo GET para o segundo parâmetro e dando um alias .as('getStories')
      // cy.intercept('GET', '**/search?query=React&page=0').as('getStories') -> aqui tu passa o caminho da url
      // aqui tu ta ta abrindo a busca nos parâmetros específicos do JSON
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: initialTerm,
          page: '0'
        }
      }).as('getStories')
      cy.visit('/')
      // aqui tu ta esperando a interceptação ocorrer até tu continuar o script
      cy.wait('@getStories')
      // cy.assertLoadingIsShownAndHidden()
      // cy.contains('More').should('be.visible')
    })
    it('shows 20 stories, then the next 20 after clicking "More"', () => {
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: initialTerm,
          page: '1'
        }
      }).as('getNextStories')

      cy.get('.item').should('have.length', 20)
      cy.contains('More').should(`be.visible`).click()
      cy.wait('@getNextStories')
      cy.get('.item').should('have.length', 40)
    })

    it('searches via the last searched term', () => {
      cy.intercept('GET', `**/search?query=${newTerm}&page=0`).as('getNewTermStories')
      cy.get('#search').should(`be.visible`).clear().type(`${newTerm}{enter}`)

      // tu espera o novo termo digitado ser aparecido
      cy.wait('@getNewTermStories')

      cy.get(`button:contains(${initialTerm})`).should('be.visible').click()
      // tu volta a esperar o primeiro termo la do inicio
      cy.wait('@getStories')

      // verifica se deu certo
      cy.get('.item').should('have.length', 20)
      cy.get('.item').first().should(`be.visible`).and('contain', initialTerm)
      cy.get(`button:contains(${newTerm})`).should('be.visible')
    })
  })

  context('mock in API', () => {
    context('Footer and list stories', () => {
      beforeEach(() => {
        cy.intercept(
          'GET',
           `**/search?query=${initialTerm}&page=0`,
           { fixture: 'stories' }).as('getStories')
        cy.visit('/')
        cy.wait('@getStories')
      })
      it('shows the footer', () => {
        cy.get('footer').should('be.visible')
          .and('contain', 'Icons made by Freepik from www.flaticon.com')
      })

      context('List of stories', () => {
        const stories = require('../fixtures/stories')

        it('shows the right data for all rendered stories', () => {
          cy.get(`.item`).first().should(`be.visible`).and('contain', stories.hits[0].title)
          .and('contain', stories.hits[0].author)
          .and('contain', stories.hits[0].num_comments)
          .and('contain', stories.hits[0].points)
          
          cy.get(`.item a:contains(${stories.hits[0].title})`)
          .should(`have.attr` , `href`, stories.hits[0].url)


          cy.get(`.item`).last().should('contain', stories.hits[1].title)
          .and('contain', stories.hits[1].author)
          .and('contain', stories.hits[1].num_comments)
          .and('contain', stories.hits[1].points)

          cy.get(`.item a:contains(${stories.hits[1].title})`)
          .should(`have.attr` , `href`, stories.hits[1].url)

        })

        it('shows one less story after dimissing the first one', () => {
          cy.get('.button-small').first().click()
          cy.get('.item').should('have.length', 1)
        })


        context('Order by', () => {
          it('orders by title', () => {
            cy.get(`.list-header-button:contains(Title)`).as(`titleHeader`).click()

            cy.get(`.item`).first().should(`be.visible`).and(`contain` , stories.hits[0].title)
            cy.get(`.item a:contains(${stories.hits[0].title})`)
            .should(`have.attr` , `href`, stories.hits[0].url)


            cy.get(`@titleHeader`).click()

            cy.get(`.item`).first().should(`be.visible`).and(`contain` , stories.hits[1].title)
            cy.get(`.item a:contains(${stories.hits[1].title})`)
            .should(`have.attr` , `href`, stories.hits[1].url)
          })


          it('orders by author', () => {

            cy.get(`.list-header-button:contains(Author)`).as(`authorHeader`).click()
            cy.get(`.item`).first().should(`be.visible`).and(`contain` , stories.hits[0].author)
            cy.get(`@authorHeader`).click()
            cy.get(`.item`).first().should(`be.visible`).and(`contain` , stories.hits[1].author)

          })


          it('orders by comments', () => {

            cy.get(`.list-header-button:contains(Comments)`).as(`commentsHeader`).click()
            cy.get(`.item`).first().should(`be.visible`).and(`contain` , stories.hits[1].num_comments)
            cy.get(`@commentsHeader`).click()
            cy.get(`.item`).first().should(`be.visible`).and(`contain` , stories.hits[0].num_comments)

          })


          it('orders by points', () => {
            cy.get(`.list-header-button:contains(Points)`).click().as(`pointsHeader`)

            cy.get(`.item`).first().should(`be.visible`).and(`contain` , stories.hits[1].points)
            cy.get(`@pointsHeader`).click()

            cy.get(`.item`).first().should(`be.visible`).and(`contain` , stories.hits[0].points)

          })
        })
      })
    })



    context('Search', () => {
      beforeEach(() => {
        // refatoraçaõ para ele interceptar cy.assertLoadingIsShownAndHidden()
        cy.intercept('GET', `**/search?query=${initialTerm}&page=0`, { fixture: 'empty' }).as('getEmptyStories')
        cy.intercept('GET', `**/search?query=${newTerm}&page=0`, { fixture: 'stories' }).as('getStories')
        cy.visit('/')
        cy.wait('@getEmptyStories')
        cy.get('#search').clear()
      })

      it('types and hits ENTER', () => {
        cy.get('#search').type(`${newTerm}{enter}`)
        // refatoração daquela função que ta quebrando o código
        cy.wait('@getStories')

        cy.get('.item').should('have.length', 2)
        cy.get(`button:contains(${initialTerm})`).should('be.visible')
      })

      it('types and clicks the submit button', () => {
        cy.get('#search').type(newTerm)
        cy.contains('Submit').click()
        // tu espera o novo termo digitado ser aparecido
        cy.wait('@getStories')

        cy.get('.item').should('have.length', 2)
        //cy.get('.item').first().should('contain', newTerm)
        cy.get(`button:contains(${initialTerm})`).should('be.visible')
      })

      context('Last searches', () => {
        // essa função tu busca palavras aletórias por 6 vezes
        it('shows a max of 5 buttons for the last searched terms', () => {
          const faker = require('faker')
          // como tu não sabe o que vem depois do search pq é aleatório, tu passa search**
          cy.intercept('GET', '**/search**', {fixture : 'stories'}).as('getRandomStories')

          Cypress._.times(6, () => {
            cy.get('#search').clear().type(`${faker.random.word()}{enter}`)
            cy.wait('@getRandomStories')
          })
          cy.get('.last-searches button').should('have.length', 5)
        })
      })
    })
  })
})

context('Errors', () => {
  it('shows "Something went wrong ..." in case of a server error', () => {
    cy.intercept('GET', '**/search**', { statusCode: 500 }).as('getServerFailure')
    cy.visit('/')
    cy.wait('@getServerFailure')
    cy.get('p:contains(Something went wrong ...)').should('be.visible')
  })

  it('shows "Something went wrong ..." in case of a network error', () => {
    cy.intercept('GET', '**/search**', { forceNetworkError: true }).as('getNetworkFailure')
    cy.visit('/')
    cy.wait('@getNetworkFailure')
    cy.get('p:contains(Something went wrong ...)').should('be.visible')
  })
})
