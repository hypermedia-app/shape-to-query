import { schema } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import PropertyShape from '../../model/PropertyShape'
import { namedNode } from '../nodeFactory'
import { variable } from '../variable'

describe('model/PropertyShape', () => {
  before(() => import('../sparql'))

  describe('buildPatterns', () => {
    it('creates path patterns', () => {
      // given
      const path = namedNode(schema.knows)
      const shape = new PropertyShape(path)

      // when
      const focusNode = $rdf.namedNode('foo')
      const { whereClause, constructClause } = shape.buildPatterns({ focusNode, variable, rootPatterns: undefined })

      // then
      expect(whereClause).to.equalPatterns('<foo> schema:knows ?resource .')
      expect(sparql`${constructClause}`).to.equalPatterns('<foo> schema:knows ?resource .')
    })

    it('binds rule patterns, unioned', () => {
      // given
      const path = namedNode(schema.knows)
      const rules = [{
        buildPatterns: ({ focusNode, objectNode }) => ({
          constructClause: [$rdf.quad(focusNode, schema.knows, objectNode)],
          whereClause: sparql`SELECT ${objectNode} { ... }`,
        }),
      }, {
        buildPatterns: ({ focusNode, objectNode }) => ({
          constructClause: [$rdf.quad(focusNode, schema.knows, objectNode)],
          whereClause: sparql`BIND (<bar> as ${objectNode})`,
        }),
      }]
      const shape = new PropertyShape(path, { rules })

      // when
      const focusNode = $rdf.variable('this')
      const { whereClause, constructClause } = shape.buildPatterns({ focusNode, variable, rootPatterns: undefined })

      // then
      const query = sparql`CONSTRUCT { ${constructClause} } WHERE { ${whereClause} }`
      expect(query).to.equalPatterns(`CONSTRUCT {
        ?this schema:knows ?foo .
      } WHERE {
        {
          SELECT ?foo { ... }
        }
        UNION
        {
          BIND (<bar> as ?foo)
        }
      }`)
    })
  })

  describe('buildConstraints', () => {
    it('returns empty string when property has no constraints', () => {
      // given
      const path = namedNode(schema.knows)
      const shape = new PropertyShape(path)

      // when
      const focusNode = $rdf.variable('this')
      const constraints = shape.buildConstraints({ focusNode, variable, rootPatterns: undefined })

      // then
      expect(constraints).to.eq('')
    })
  })
})
