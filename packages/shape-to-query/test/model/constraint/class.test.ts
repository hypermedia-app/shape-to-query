import { schema, rdf } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { variable } from '../../variable.js'
import { ClassConstraintComponent } from '../../../model/constraint/class.js'
import { ex } from '../../namespace.js'

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

        expect(whereClause).to.deep.contain.members(
          // <this> a schema:DefinedTerm .'
          [{
            type: 'bgp',
            triples: [{
              subject: $rdf.namedNode('this'),
              predicate: rdf.type,
              object: schema.DefinedTerm,
            }],
          }],
        )
      })
    })

    context('property shape', () => {
      it('creates correct pattern', () => {
        // given
        const constraint = new ClassConstraintComponent(schema.DefinedTerm)
        const valueNode = variable()

        // when
        const whereClause = constraint.buildPatterns({
          focusNode: $rdf.namedNode('this'),
          valueNode,
          variable,
          rootPatterns: undefined,
          propertyPath: ex.prop,
        })

        // then
        expect(whereClause).to.deep.contain.members(
          // ?valueNode a schema:DefinedTerm .
          [{
            type: 'bgp',
            triples: [{
              subject: valueNode,
              predicate: rdf.type,
              object: schema.DefinedTerm,
            }],
          }],
        )
      })
    })
  })
})
