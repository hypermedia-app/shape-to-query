import { expect } from 'chai'
import { sparql } from '@tpluscode/sparql-builder'
import $rdf from 'rdf-ext'
import { foaf, rdf } from '@tpluscode/rdf-ns-builders'
import NodeShape from '../../model/NodeShape'
import { createVariableSequence } from '../../lib/variableSequence'
import { PropertyShape } from '../../model/PropertyShape'
import { OrConstraintComponent } from '../../model/constraint/or'

describe('model/NodeShape', () => {
  before(() => import('../sparql'))

  const variable = createVariableSequence('n')

  describe('targets', () => {
    it('unions all targets in where clause', () => {
      // given
      const targets = [1, 2, 3].map(i => ({
        buildPatterns: () => ({
          constructClause: [],
          whereClause: sparql`target ${i}`,
        }),
      }))
      const shape = new NodeShape(targets, [], [])

      // when
      const focusNode = $rdf.variable('s')
      const { whereClause } = shape.buildPatterns({ focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns(`{
        target 1
      } UNION {
        target 2
      } UNION {
        target 3
      }`)
    })

    it('combines targets constructs', () => {
      // given
      const targets = [{
        buildPatterns: ({ focusNode }) => ({
          constructClause: [$rdf.quad(focusNode, rdf.type, foaf.Agent)],
          whereClause: sparql``,
        }),
      }, {
        buildPatterns: ({ focusNode }) => ({
          constructClause: [$rdf.quad(focusNode, rdf.type, foaf.Person)],
          whereClause: sparql``,
        }),
      }]
      const shape = new NodeShape(targets, [], [])

      // when
      const focusNode = $rdf.variable('s')
      const construct = sparql`${shape.buildPatterns({ focusNode, variable }).constructClause}`

      // then
      expect(construct).to.equalPatterns(`
        ?s rdf:type foaf:Agent .
        ?s rdf:type foaf:Person .
      `)
    })

    it('ignores targets when focus node is named node', () => {
      // given
      const targets = [{
        buildPatterns: ({ focusNode }) => ({
          constructClause: [$rdf.quad(focusNode, rdf.type, foaf.Agent)],
          whereClause: sparql``,
        }),
      }, {
        buildPatterns: ({ focusNode }) => ({
          constructClause: [$rdf.quad(focusNode, rdf.type, foaf.Person)],
          whereClause: sparql``,
        }),
      }]
      const shape = new NodeShape(targets, [], [])

      // when
      const focusNode = $rdf.namedNode('foo')
      const { whereClause, constructClause } = shape.buildPatterns({ focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns('')
      expect(constructClause).to.be.empty
    })
  })

  describe('properties', () => {
    it('unions all where properties', () => {
      // given
      const properties: PropertyShape[] = [{
        buildConstraints: () => '',
        buildPatterns: () => ({
          constructClause: [],
          whereClause: 'foo bar baz',
        }),
      }, {
        buildConstraints: () => '',
        buildPatterns: () => ({
          constructClause: [],
          whereClause: 'A B C',
        }),
      }]
      const shape = new NodeShape([], properties, [])

      // when
      const focusNode = $rdf.namedNode('f')
      const { whereClause } = shape.buildPatterns({ focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns(`{
        foo bar baz
      } UNION {
        A B C
      }`)
    })
  })

  describe('constraints', () => {
    describe('sh:or', () => {
      it('skips alternatives with no properties', () => {
        // given
        const or = new OrConstraintComponent([
          new NodeShape([], [], []),
          new NodeShape([], [], []),
        ])
        const shape = new NodeShape([], [], [or])

        // when
        const focusNode = $rdf.namedNode('f')
        const { whereClause } = shape.buildPatterns({ focusNode, variable })

        // then
        expect(whereClause).to.equalPatterns('')
      })
    })
  })
})
