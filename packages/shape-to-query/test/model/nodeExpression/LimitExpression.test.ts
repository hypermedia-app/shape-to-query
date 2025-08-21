import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { expect } from 'chai'
import sinon from 'sinon'
import { SELECT, sparql } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env/web.js'
import { LimitExpression } from '../../../model/nodeExpression/LimitExpression.js'
import { blankNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import { fakeExpression } from './helper.js'

describe('model/nodeExpression/LimitExpression', function () {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  before(function () { return import('../../sparql.js') })

  beforeEach(function () {
    factory = sinon.createStubInstance(ModelFactory)
    factory.nodeExpression.returns(<any>{})
  })

  describe('match', function () {
    it('returns false when sh:limit is missing', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.nodes, blankNode())

      // then
      expect(LimitExpression.match(pointer)).to.be.false
    })

    it('returns false when sh:nodes is missing', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, 10)

      // then
      expect(LimitExpression.match(pointer)).to.be.false
    })

    it('returns false when sh:limit is not an integer', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, '10')
        .addOut(sh.nodes, blankNode())

      // then
      expect(LimitExpression.match(pointer)).to.be.false
    })

    it('returns true when sh:nodes and sh:limit are given', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, 10)
        .addOut(sh.nodes, blankNode())

      // then
      expect(LimitExpression.match(pointer)).to.be.true
    })

    it('returns true when sh:deactivated false', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, 10)
        .addOut(sh.nodes, blankNode())
        .addOut(sh.deactivated, false)

      // then
      expect(LimitExpression.match(pointer)).to.be.true
    })
  })

  describe('fromPointer', function () {
    it('throws when limit is not a number', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, '5')
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        LimitExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when limit is not a literal', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, blankNode())
        .addOut(sh.nodes, blankNode())

      // then
      expect(() => {
        // when
        LimitExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('return an instance of LimitExpression', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.limit, 15)
        .addOut(sh.nodes, blankNode())

      // when
      const expr = LimitExpression.fromPointer(pointer, factory)

      // then
      expect(expr).to.be.instanceof(LimitExpression)
      expect(expr).to.have.property('limit', 15)
      expect(expr).to.have.property('nodes').to.be.ok
    })
  })

  describe('buil', function () {
    it('creates a limited subselect', function () {
      // given
      const limit = 10
      const nodes = fakeExpression(({ object }) => [{
        type: 'bgp',
        triples: [{ subject: object, predicate: rdf.type, object: schema.Article }],
      }])
      const expr = new LimitExpression($rdf.blankNode(), limit, nodes)

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT ?root ?foo WHERE {
        ?foo a ${schema.Article} .
      }
      LIMIT 10`)
    })

    it('sets limit on inner subselect', function () {
      // given
      const limit = 10
      const nodes = fakeExpression(({ subject, object }) => SELECT`${subject} ${object}`.WHERE`${object} a ${schema.Article} .`)
      const expr = new LimitExpression($rdf.blankNode(), limit, nodes)

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT ?root ?foo WHERE {
        ?foo a ${schema.Article} .
      }
      LIMIT 10`)
    })
  })
})
