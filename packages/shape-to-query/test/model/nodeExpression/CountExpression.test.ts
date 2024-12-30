import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from '@zazuko/env/web.js'
import type { Quad } from '@rdfjs/types'
import { sparql } from '@tpluscode/sparql-builder'
import { CountExpression } from '../../../model/nodeExpression/CountExpression.js'
import { blankNode, namedNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import { DistinctExpression } from '../../../model/nodeExpression/DistinctExpression.js'
import { fakeExpression } from './helper.js'

describe('model/nodeExpression/CountExpression', () => {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  before(() => import('../../sparql.js'))
  beforeEach(() => {
    factory = sinon.createStubInstance(ModelFactory)
    factory.nodeExpression.returns(<any>{})
  })

  describe('match', () => {
    it('returns false when sh:count is missing', () => {
      // given
      const pointer = blankNode()

      // then
      expect(CountExpression.match(pointer)).to.be.false
    })

    it('returns false it is not a blank node', () => {
      // given
      const pointer = namedNode('foo')
        .addOut(sh.count, blankNode())

      // then
      expect(CountExpression.match(pointer)).to.be.false
    })

    it('returns true when sh:count is a blank node', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.count, blankNode())

      // then
      expect(CountExpression.match(pointer)).to.be.true
    })

    it('returns true when sh:deactivated false', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.count, blankNode())
        .addOut(sh.deactivated, false)

      // then
      expect(CountExpression.match(pointer)).to.be.true
    })
  })

  describe('fromPointer', () => {
    it('throws when sh:count is missing', () => {
      // given
      const pointer = blankNode()

      // then
      expect(() => {
        // when
        CountExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when sh:count has multiple values', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.count, blankNode())
        .addOut(sh.count, blankNode())

      // then
      expect(() => {
        // when
        CountExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('return an instance of CountExpression', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.count, blankNode())

      // when
      const expr = CountExpression.fromPointer(pointer, factory)

      // then
      expect(expr).to.be.instanceof(CountExpression)
      expect(expr).to.have.property('expression').to.be.ok
    })
  })

  describe('buildPatterns', () => {
    it('creates a subselect which wraps inner', () => {
      // given
      const inner = fakeExpression(({ object }) => [{
        type: 'bgp',
        triples: [$rdf.quad<Quad>(object, rdf.type, schema.Article)],
      }])
      const expr = new CountExpression($rdf.blankNode(), inner)

      // when
      const subject = variable()
      const { patterns } = expr.build({
        subject,
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT (COUNT(?inner) as ?count) WHERE {
        ?inner a ${schema.Article} .
      }`)
    })

    it('inlines inner distinct expression', () => {
      // given
      const inner = fakeExpression(({ object }) => [{
        type: 'bgp',
        triples: [$rdf.quad<Quad>(object, rdf.type, schema.Article)],
      }])
      const distinct = new DistinctExpression($rdf.blankNode(), inner)
      const expr = new CountExpression($rdf.blankNode(), distinct)

      // when
      const subject = variable()
      const { patterns } = expr.build({
        subject,
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT (COUNT(DISTINCT ?inner) as ?count) WHERE {
        ?inner a ${schema.Article} .
      }`)
    })
  })
})
