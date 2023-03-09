import $rdf from 'rdf-ext'
import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders'
import Shape from '../../model/Shape'
import { emptyPatterns } from '../../lib/shapePatterns'
import { createVariableSequence } from '../../lib/variableSequence'
import { ConstraintComponent } from '../../model/constraint/ConstraintComponent'
import { OrConstraintComponent } from '../../model/constraint/or'
import { AndConstraintComponent } from '../../model/constraint/and'

describe('lib/model/Shape', () => {
  before(() => import('../sparql'))

  const variable = createVariableSequence('s')

  describe('buildLogicalConstraints', () => {
    it('returns empty patterns when there are no constraints', () => {
      // given
      const shape = new Shape([])

      // when
      const focusNode = $rdf.namedNode('this')
      const constraints = shape.buildLogicalConstraints({ focusNode, variable })

      // then
      expect(constraints).to.eq(emptyPatterns)
    })

    it('returns empty when all inner shapes return empty', () => {
      // given
      const inner: ConstraintComponent[] = [{
        type: sh.NodeConstraintComponent,
        buildPatterns: () => '',
      }, {
        type: sh.NodeConstraintComponent,
        buildPatterns: () => '',
      }]
      const shape = new Shape(inner)

      // when
      const focusNode = $rdf.namedNode('this')
      const constraints = shape.buildLogicalConstraints({ focusNode, variable })

      // then
      expect(constraints).to.eq(emptyPatterns)
    })

    it('creates a UNION of sh:or-ed shapes', () => {
      // given
      const shape = new Shape([
        new OrConstraintComponent([{
          buildConstraints: () => '',
          buildPatterns: () => ({
            whereClause: 'foo shape',
            constructClause: [],
          }),
        }, {
          buildConstraints: () => '',
          buildPatterns: () => ({
            whereClause: 'bar shape',
            constructClause: [],
          }),
        }]),
      ])

      // when
      const focusNode = $rdf.namedNode('this')
      const { whereClause } = shape.buildLogicalConstraints({ focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns(`{
        foo shape
      } UNION {
        bar shape
      }`)
    })

    it('creates a sum of sh:and-ed shapes', () => {
      // given
      const shape = new Shape([
        new AndConstraintComponent([{
          buildConstraints: () => '',
          buildPatterns: () => ({
            whereClause: 'foo shape',
            constructClause: [],
          }),
        }, {
          buildConstraints: () => '',
          buildPatterns: () => ({
            whereClause: 'bar shape',
            constructClause: [],
          }),
        }]),
      ])

      // when
      const focusNode = $rdf.namedNode('this')
      const { whereClause } = shape.buildLogicalConstraints({ focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns(`
        foo shape
        bar shape
      `)
    })
  })
})
