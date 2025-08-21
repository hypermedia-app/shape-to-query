import $rdf from '@zazuko/env/web.js'
import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders'
import Shape from '../../model/Shape.js'
import { emptyPatterns } from '../../lib/shapePatterns.js'
import type { ConstraintComponent } from '../../model/constraint/ConstraintComponent.js'
import { OrConstraintComponent } from '../../model/constraint/or.js'
import { AndConstraintComponent } from '../../model/constraint/and.js'
import { variable } from '../variable.js'

describe('lib/model/Shape', function () {
  before(function () { return import('../sparql.js') })

  describe('buildLogicalConstraints', function () {
    it('returns empty patterns when there are no constraints', function () {
      // given
      const shape = new Shape([])

      // when
      const focusNode = $rdf.namedNode('this')
      const constraints = shape.buildLogicalConstraints({ focusNode, variable, rootPatterns: undefined })

      // then
      expect(constraints).to.eq(emptyPatterns)
    })

    it('returns empty when all inner shapes return empty', function () {
      // given
      const inner: ConstraintComponent[] = [{
        type: sh.NodeConstraintComponent,
        buildPatterns: () => [],
      }, {
        type: sh.NodeConstraintComponent,
        buildPatterns: () => [],
      }]
      const shape = new Shape(inner)

      // when
      const focusNode = $rdf.namedNode('this')
      const constraints = shape.buildLogicalConstraints({ focusNode, variable, rootPatterns: undefined })

      // then
      expect(constraints).to.eq(emptyPatterns)
    })

    it('creates a UNION of sh:or-ed shapes', function () {
      // given
      const shape = new Shape([
        new OrConstraintComponent([{
          buildConstraints: () => [],
          buildPatterns: () => ({
            whereClause: [{
              type: 'comment',
              text: 'foo shape',
            }],
            constructClause: [],
          }),
          properties: [],
        }, {
          buildConstraints: () => [],
          buildPatterns: () => ({
            whereClause: [{
              type: 'comment',
              text: 'bar shape',
            }],
            constructClause: [],
          }),
          properties: [],
        }]),
      ])

      // when
      const focusNode = $rdf.namedNode('this')
      const { whereClause } = shape.buildLogicalConstraints({ focusNode, variable, rootPatterns: undefined })

      // then
      expect(whereClause).to.equalPatterns(`{
        # foo shape
      } UNION {
        # bar shape
      }`)
    })

    it('creates a sum of sh:and-ed shapes', function () {
      // given
      const shape = new Shape([
        new AndConstraintComponent([{
          buildConstraints: () => [],
          buildPatterns: () => ({
            whereClause: [{
              type: 'comment',
              text: 'foo shape',
            }],
            constructClause: [],
          }),
          properties: [],
        }, {
          buildConstraints: () => [],
          buildPatterns: () => ({
            whereClause: [{
              type: 'comment',
              text: 'bar shape',
            }],
            constructClause: [],
          }),
          properties: [],
        }]),
      ])

      // when
      const focusNode = $rdf.namedNode('this')
      const { whereClause } = shape.buildLogicalConstraints({ focusNode, variable, rootPatterns: undefined })

      // then
      expect(whereClause).to.equalPatterns(`
        # foo shape
        # bar shape
      `)
    })
  })
})
