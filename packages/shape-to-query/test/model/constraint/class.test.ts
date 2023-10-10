import { schema } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from '@zazuko/env'
import { sparql } from '@tpluscode/rdf-string'
import { variable } from '../../variable.js'
import { ClassConstraintComponent } from '../../../model/constraint/class.js'

describe('model/constraint/class', () => {
  before(() => import('../../sparql.js'))

  describe('buildPatterns', () => {
    context('node shape', () => {
      it('creates correct pattern', () => {
        // given
        const constraint = new ClassConstraintComponent(schema.DefinedTerm)

        // when
        const whereClause = constraint.buildPatterns({
          focusNode: $rdf.namedNode('this'),
          valueNode: variable(),
          variable,
          rootPatterns: undefined,
        })

        // then
        expect(whereClause).to.equalPatterns('<this> a schema:DefinedTerm .')
      })
    })

    context('property shape', () => {
      it('creates correct pattern', () => {
        // given
        const constraint = new ClassConstraintComponent(schema.DefinedTerm)

        // when
        const whereClause = constraint.buildPatterns({
          focusNode: $rdf.namedNode('this'),
          valueNode: variable(),
          variable,
          rootPatterns: undefined,
          propertyPath: sparql`prop`,
        })

        // then
        expect(whereClause).to.equalPatterns('?valueNode a schema:DefinedTerm .')
      })
    })
  })
})
