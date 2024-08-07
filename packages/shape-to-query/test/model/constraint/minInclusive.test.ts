import { expect } from 'chai'
import { xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env/web.js'
import { variable } from '../../variable.js'
import { MinInclusiveConstraintComponent } from '../../../model/constraint/minInclusive.js'
import { ex } from '../../namespace.js'

describe('model/constraint/minInclusive', () => {
  before(() => import('../../sparql.js'))

  describe('fromShape', () => {
    it('does not create a constraint when there is no sh:minInclusive', () => {
      // given
      const shape = $rdf.termMap()

      // when
      const constrains = [...MinInclusiveConstraintComponent.fromShape(shape)]

      // then
      expect(constrains).to.be.empty
    })
  })

  describe('buildPatterns', () => {
    context('node shape', () => {
      it('creates correct pattern', () => {
        // given
        const five = $rdf.literal('5', xsd.string)
        const constraint = new MinInclusiveConstraintComponent(five)
        const focusNode = variable()
        const valueNode = focusNode

        // when
        const patterns = constraint.buildPatterns({
          focusNode,
          valueNode,
          variable,
          rootPatterns: undefined,
        })

        // then

        expect(patterns).to.deep.equal(
          // 'FILTER (?x >= 5)'
          [{
            type: 'filter',
            expression: {
              type: 'operation',
              operator: '>=',
              args: [valueNode, five],
            },
          }],
        )
      })
    })

    context('property shape', () => {
      it('restricts focus node', () => {
        // given
        const five = $rdf.literal('5', xsd.string)
        const constraint = new MinInclusiveConstraintComponent(five)
        const valueNode = variable()

        // when
        const patterns = constraint.buildPatterns({
          focusNode: $rdf.namedNode('this'),
          valueNode,
          variable,
          rootPatterns: undefined,
          propertyPath: ex.path,
        })

        // then
        expect(patterns).to.deep.equal(
          // 'FILTER (?x >= 5)'
          [{
            type: 'filter',
            expression: {
              type: 'operation',
              operator: '>=',
              args: [valueNode, five],
            },
          }],
        )
      })
    })
  })
})
