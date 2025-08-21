import { expect } from 'chai'
import { xsd, sh } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env/web.js'
import { variable } from '../../variable.js'
import { RangeConstraintComponent } from '../../../model/constraint/RangeConstraintComponent.js'
import { ex } from '../../namespace.js'

describe('model/constraint/ranges', function () {
  before(function () { return import('../../sparql.js') })

  describe('fromShape', function () {
    it('does not create a constraint when there is no range', function () {
      // given
      const shape = $rdf.termMap()

      // when
      const constrains = [...RangeConstraintComponent.fromShape(shape)]

      // then
      expect(constrains).to.be.empty
    })
  })

  describe('buildPatterns', function () {
    context('node shape', function () {
      const five = $rdf.literal('5', xsd.integer)
      const components = [
        { constraint: new RangeConstraintComponent(sh.MinInclusiveConstraintComponent, five), operator: '>=' },
        { constraint: new RangeConstraintComponent(sh.MaxInclusiveConstraintComponent, five), operator: '<=' },
        { constraint: new RangeConstraintComponent(sh.MinExclusiveConstraintComponent, five), operator: '>' },
        { constraint: new RangeConstraintComponent(sh.MaxExclusiveConstraintComponent, five), operator: '<' },
      ]
      for (const { constraint, operator } of components) {
        it(`creates correct pattern for ${operator}`, function () {
          // given
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
                operator,
                args: [valueNode, five],
              },
            }],
          )
        })
      }
    })

    context('property shape', function () {
      const five = $rdf.literal('5', xsd.integer)
      const components = [
        { constraint: new RangeConstraintComponent(sh.MinInclusiveConstraintComponent, five), operator: '>=' },
        { constraint: new RangeConstraintComponent(sh.MaxInclusiveConstraintComponent, five), operator: '<=' },
        { constraint: new RangeConstraintComponent(sh.MinExclusiveConstraintComponent, five), operator: '>' },
        { constraint: new RangeConstraintComponent(sh.MaxExclusiveConstraintComponent, five), operator: '<' },
      ]
      for (const { constraint, operator } of components) {
        it(`creates correct pattern for ${operator}`, function () {
          // given
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
                operator,
                args: [valueNode, five],
              },
            }],
          )
        })
      }
    })
  })
})
