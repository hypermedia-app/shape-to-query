import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { foaf, rdf } from '@tpluscode/rdf-ns-builders'
import type { Quad } from '@rdfjs/types'
import NodeShape from '../../model/NodeShape.js'
import type { PropertyShape } from '../../model/PropertyShape.js'
import { OrConstraintComponent } from '../../model/constraint/or.js'
import { variable } from '../variable.js'
import { emptyPatterns } from '../../lib/shapePatterns.js'
import { ex } from '../namespace.js'
import type { Rule } from '../../model/rule/Rule.js'
import type { Target } from '../../model/target/index.js'

describe('model/NodeShape', function () {
  const rootPatterns = []

  before(function () { return import('../sparql.js') })

  describe('targets', function () {
    it('unions all targets in where clause', function () {
      // given
      const focusNode = $rdf.variable('s')
      const targets: Target[] = [1, 2, 3].map(i => ({
        buildPatterns: () => ({
          constructClause: [],
          whereClause: [{
            type: 'bgp',
            triples: [$rdf.quad<Quad>(focusNode, rdf.type, ex(`target-${i}`))],
          }],
        }),
      }))
      const shape = new NodeShape(targets, [], [], [])

      // when
      const { whereClause } = shape.buildPatterns({ focusNode, variable, rootPatterns })

      // then
      expect(whereClause).to.deep.eq([{
        type: 'union',
        patterns: [
          {
            type: 'bgp',
            triples: [$rdf.quad(focusNode, rdf.type, ex('target-1'))],
          },
          {
            type: 'bgp',
            triples: [$rdf.quad(focusNode, rdf.type, ex('target-2'))],
          },
          {
            type: 'bgp',
            triples: [$rdf.quad(focusNode, rdf.type, ex('target-3'))],
          },
        ],
      }])
    })

    it('combines targets constructs', function () {
      // given
      const targets = [{
        buildPatterns: ({ focusNode }) => ({
          constructClause: [$rdf.quad(focusNode, rdf.type, foaf.Agent)],
          whereClause: [],
        }),
      }, {
        buildPatterns: ({ focusNode }) => ({
          constructClause: [$rdf.quad(focusNode, rdf.type, foaf.Person)],
          whereClause: [],
        }),
      }]
      const shape = new NodeShape(targets, [], [], [])

      // when
      const focusNode = $rdf.variable('s')
      const construct = shape.buildPatterns({ focusNode, variable, rootPatterns }).constructClause

      // then
      expect(construct).to.deep.equal([
        $rdf.quad(focusNode, rdf.type, foaf.Agent),
        $rdf.quad(focusNode, rdf.type, foaf.Person),
      ])
    })

    it('ignores targets when focus node is named node', function () {
      // given
      const targets = [{
        buildPatterns: ({ focusNode }) => ({
          constructClause: [$rdf.quad(focusNode, rdf.type, foaf.Agent)],
          whereClause: [],
        }),
      }, {
        buildPatterns: ({ focusNode }) => ({
          constructClause: [$rdf.quad(focusNode, rdf.type, foaf.Person)],
          whereClause: [],
        }),
      }]
      const shape = new NodeShape(targets, [], [], [])

      // when
      const focusNode = $rdf.namedNode('foo')
      const { whereClause, constructClause } = shape.buildPatterns({ focusNode, variable, rootPatterns })

      // then
      expect(whereClause).to.be.empty
      expect(constructClause).to.be.empty
    })
  })

  describe('properties', function () {
    it('unions all where properties', function () {
      // given
      const properties: PropertyShape[] = [{
        buildConstraints: () => [],
        buildPatterns: () => ({
          constructClause: [],
          whereClause: [{
            type: 'comment',
            text: 'foo bar baz',
          }],
        }),
        constraints: [],
        buildLogicalConstraints: () => emptyPatterns,
      }, {
        buildConstraints: () => [],
        buildPatterns: () => ({
          constructClause: [],
          whereClause: [{
            type: 'comment',
            text: 'A B C',
          }],
        }),
        constraints: [],
        buildLogicalConstraints: () => emptyPatterns,
      }]
      const shape = new NodeShape([], properties, [], [])

      // when
      const focusNode = $rdf.namedNode('f')
      const { whereClause } = shape.buildPatterns({ focusNode, variable, rootPatterns })

      // then
      expect(whereClause).to.equalPatterns(`{
        # foo bar baz
      } UNION {
        # A B C
      }`)
    })
  })

  describe('constraints', function () {
    describe('sh:or', function () {
      it('skips alternatives with no properties', function () {
        // given
        const or = new OrConstraintComponent([
          new NodeShape([], [], [], []),
          new NodeShape([], [], [], []),
        ])
        const shape = new NodeShape([], [], [or], [])

        // when
        const focusNode = $rdf.namedNode('f')
        const { whereClause } = shape.buildPatterns({ focusNode, variable, rootPatterns })

        // then
        expect(whereClause).to.equalPatterns('')
      })
    })
  })

  describe('rules', function () {
    it('unions them', function () {
      const rules: Rule[] = [{
        buildPatterns: () => ({ constructClause: [], whereClause: [{ type: 'comment', text: 'A' }] }),
      }, {
        buildPatterns: () => ({ constructClause: [], whereClause: [{ type: 'comment', text: 'B' }] }),
      }, {
        buildPatterns: () => ({ constructClause: [], whereClause: [{ type: 'comment', text: 'C' }] }),
      }]
      const shape = new NodeShape([], [], [], rules)

      // when
      const focusNode = $rdf.namedNode('f')
      const result = shape.buildPatterns({ focusNode, variable, rootPatterns })

      // then
      expect(result.whereClause).to.equalPatterns(`{ 
        # A 
      } UNION { 
        # B 
      } UNION { 
        # C 
      }`)
    })
  })
})
