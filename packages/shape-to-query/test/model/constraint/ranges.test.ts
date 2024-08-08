import { expect } from 'chai'
import { xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env/web.js'
import { variable } from '../../variable.js'
import { MinInclusiveConstraintComponent } from '../../../model/constraint/minInclusive.js'
import { MaxInclusiveConstraintComponent } from '../../../model/constraint/maxInclusive.js'
import { MinExclusiveConstraintComponent } from '../../../model/constraint/minExclusive.js'
import { MaxExclusiveConstraintComponent } from '../../../model/constraint/maxExclusive.js'
import { ex } from '../../namespace.js'

describe('model/constraint/ranges', () => {
  before(() => import('../../sparql.js'))

  describe('fromShape', () => {
    const components = [
      MinInclusiveConstraintComponent,
      MaxInclusiveConstraintComponent,
      MinExclusiveConstraintComponent,
      MaxExclusiveConstraintComponent,
    ]
    for (const component of components) {
      it(`does not create a constraint when there is no ${component.name}`, () => {
        // given
        const shape = $rdf.termMap()

        // when
        const constrains = [...component.fromShape(shape)]

        // then
        expect(constrains).to.be.empty
      })
    }
  })

  describe('buildPatterns', () => {
    context('node shape', () => {
      const five = $rdf.literal('5', xsd.integer)
      const components = [
        { constraint: new MinInclusiveConstraintComponent(five), operator: '>=' },
        { constraint: new MaxInclusiveConstraintComponent(five), operator: '<=' },
        { constraint: new MinExclusiveConstraintComponent(five), operator: '>' },
        { constraint: new MaxExclusiveConstraintComponent(five), operator: '<' },
      ]
      for (const { constraint, operator } of components) {
        it(`creates correct pattern for ${operator}`, () => {
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

    context('property shape', () => {
      const five = $rdf.literal('5', xsd.integer)
      const components = [
        { constraint: new MinInclusiveConstraintComponent(five), operator: '>=' },
        { constraint: new MaxInclusiveConstraintComponent(five), operator: '<=' },
        { constraint: new MinExclusiveConstraintComponent(five), operator: '>' },
        { constraint: new MaxExclusiveConstraintComponent(five), operator: '<' },
      ]
      for (const { constraint, operator } of components) {
        it(`creates correct pattern for ${operator}`, () => {
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
