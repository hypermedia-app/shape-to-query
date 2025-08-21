import { schema } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { sparql } from '@tpluscode/sparql-builder'
import type sparqljs from 'sparqljs'
import PropertyShape from '../../model/PropertyShape.js'
import { namedNode } from '../nodeFactory.js'
import { variable } from '../variable.js'
import type { PropertyValueRule } from '../../model/rule/PropertyValueRule.js'
import { ex } from '../namespace.js'
import { BIND } from '../pattern.js'

describe('model/PropertyShape', function () {
  before(function () { return import('../sparql.js') })

  describe('buildPatterns', function () {
    it('creates path patterns', function () {
      // given
      const path = namedNode(schema.knows)
      const shape = new PropertyShape(path)

      // when
      const focusNode = $rdf.namedNode('foo')
      const { whereClause, constructClause } = shape.buildPatterns({ focusNode, variable, rootPatterns: undefined })

      // then
      const { object: objectNode } = constructClause[0]
      expect(whereClause).to.deep.eq(
        // '<foo> schema:knows ?resource .'
        [{
          type: 'bgp',
          triples: [{
            subject: focusNode,
            predicate: schema.knows,
            object: objectNode,
          }],
        }],
      )
      expect(constructClause).to.deep.equal([$rdf.quad(focusNode, schema.knows, objectNode)])
    })

    it('binds rule patterns, unioned', function () {
      // given
      const path = namedNode(schema.knows)
      const rules: PropertyValueRule[] = [{
        buildPatterns: ({ focusNode, objectNode }) => ({
          constructClause: [$rdf.quad(focusNode, schema.knows, objectNode)],
          whereClause: [{
            type: 'query',
            queryType: 'SELECT',
            variables: [objectNode],
            where: [],
            prefixes: {},
          }],
        }),
      }, {
        buildPatterns: ({ focusNode, objectNode }) => ({
          constructClause: [$rdf.quad(focusNode, schema.knows, objectNode)],
          whereClause: [BIND(ex.bar).as(objectNode)],
        }),
      }]
      const shape = new PropertyShape(path, { rules })

      // when
      const focusNode = $rdf.variable('this')
      const { whereClause, constructClause } = shape.buildPatterns({ focusNode, variable, rootPatterns: undefined })

      // then
      const query: sparqljs.ConstructQuery = {
        type: 'query',
        queryType: 'CONSTRUCT',
        template: constructClause,
        where: whereClause,
        prefixes: {},
      }
      expect(query).to.be.query(sparql`CONSTRUCT {
        ?this ${schema.knows} ?foo .
      } WHERE {
        {
          SELECT ?foo { }
        }
        UNION
        {
          BIND (${ex.bar} as ?foo)
        }
      }`)
    })
  })

  describe('buildConstraints', function () {
    it('returns empty string when property has no constraints', function () {
      // given
      const path = namedNode(schema.knows)
      const shape = new PropertyShape(path)

      // when
      const focusNode = $rdf.variable('this')
      const constraints = shape.buildConstraints({ focusNode, variable, rootPatterns: undefined })

      // then
      expect(constraints).to.be.empty
    })
  })
})
