import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { SELECT, sparql } from '@tpluscode/sparql-builder'
import sinon from 'sinon'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import type { Quad } from '@rdfjs/types'
import { rdf, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { variable } from '../../variable.js'
import { ExpressionConstraintComponent } from '../../../model/constraint/expression.js'
import { fakeExpression } from '../nodeExpression/helper.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { blankNode } from '../../nodeFactory.js'
import { ex } from '../../namespace.js'

describe('model/constraint/expression', () => {
  before(() => import('../../sparql.js'))

  describe('buildPatterns', () => {
    it('returns filter with inline expression', () => {
    // given
      const expr = fakeExpression(undefined, ({ subject, object }) => ({
        inline: [$rdf.quad<Quad>(object, rdfs.subClassOf, schema.Person)],
        patterns: [{
          type: 'bgp',
          triples: [{ subject, predicate: rdf.type, object }],
        }],
      }))
      const constraint = new ExpressionConstraintComponent(expr)
      const valueNode = variable()

      // when
      const whereClause = constraint.buildPatterns({
        focusNode: $rdf.namedNode('foo'),
        valueNode,
        variable,
        rootPatterns: undefined,
      })

      // then
      expect(whereClause).to.deep.eq(
        // '<foo> a ?type . FILTER(?type rdfs:subClassOf schema:Person)'
        [{
          type: 'bgp',
          triples: [
            { subject: $rdf.namedNode('foo'), predicate: rdf.type, object: valueNode },
          ],
        }, {
          type: 'filter',
          expression: [$rdf.quad<Quad>(valueNode, rdfs.subClassOf, schema.Person)],
        }],
      )
    })

    it('returns filter on result variable', () => {
      const expr = fakeExpression(args => SELECT`${args.object}`.WHERE`${args.variable()} a ${ex.Bar}`)
      const constraint = new ExpressionConstraintComponent(expr)
      const valueNode = variable()

      // when
      const whereClause = constraint.buildPatterns({
        focusNode: $rdf.namedNode('foo'),
        valueNode,
        variable,
        rootPatterns: undefined,
      })

      // then
      expect(whereClause[0]).to.be.query(sparql`SELECT ?foo WHERE { ?bar a ${ex.Bar} }`)
      expect(whereClause[1]).to.deep.eq({
        type: 'filter',
        expression: valueNode,
      })
    })
  })

  describe('fromShape', () => {
    let factory: sinon.SinonStubbedInstance<ModelFactory>

    beforeEach(() => {
      factory = sinon.createStubInstance(ModelFactory)
    })

    it('returns constraints for objects of sh:expression', () => {
      // given
      const shape = $rdf.termMap([
        [sh.expression, [
          { pointer: blankNode() },
          { pointer: blankNode() },
          { pointer: blankNode() },
          { pointer: blankNode() },
        ]],
      ])

      // when
      const constraints = [...ExpressionConstraintComponent.fromShape(shape, factory)]

      // then
      expect(constraints).to.have.length(4)
      constraints.every(constraint =>
        expect(constraint).to.be.instanceof(ExpressionConstraintComponent),
      )
    })
  })
})
