import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { expect } from 'chai'
import sinon from 'sinon'
import { SELECT, sparql } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env/web.js'
import type { Quad } from '@rdfjs/types'
import { DistinctExpression } from '../../../model/nodeExpression/DistinctExpression.js'
import { blankNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import { fakeExpression } from './helper.js'

describe('model/nodeExpression/DistinctExpression', function () {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  before(function () { return import('../../sparql.js') })

  beforeEach(function () {
    factory = sinon.createStubInstance(ModelFactory)
    factory.nodeExpression.returns(<any>{})
  })

  describe('match', function () {
    it('returns true when there is a single sh:distinct', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.distinct, blankNode())

      // then
      expect(DistinctExpression.match(pointer)).to.be.true
    })

    it('returns true when sh:deactivated false', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.distinct, blankNode())
        .addOut(sh.deactivated, false)

      // then
      expect(DistinctExpression.match(pointer)).to.be.true
    })

    it('returns false when there are multiple sh:distinct', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.distinct, blankNode())
        .addOut(sh.distinct, blankNode())

      // then
      expect(DistinctExpression.match(pointer)).to.be.false
    })

    it('returns false when there is no sh:distinct', function () {
      // given
      const pointer = blankNode()

      // then
      expect(DistinctExpression.match(pointer)).to.be.false
    })
  })

  describe('fromPointer', function () {
    it('return an instance of DistinctExpression', function () {
      // given
      const pointer = blankNode()
        .addOut(sh.distinct, blankNode())

      // when
      const expr = DistinctExpression.fromPointer(pointer, factory)

      // then
      expect(expr).to.be.instanceof(DistinctExpression)
      expect(expr).to.have.property('nodes').to.be.ok
    })
  })

  describe('build', function () {
    it('creates a DISTINCT subselect', function () {
      // given
      const nodes = fakeExpression(({ object }) => [{
        type: 'bgp',
        triples: [$rdf.quad<Quad>(object, rdf.type, schema.Article)],
      }])
      const expr = new DistinctExpression($rdf.blankNode(), nodes)

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT DISTINCT ?root ?foo WHERE {
        ?foo a ${schema.Article} .
      }`)
    })

    it('sets DISTINCT on inner subselect', function () {
      // given
      const nodes = fakeExpression(({ subject, object }) => SELECT`${subject} ${object}`.WHERE`${object} a ${schema.Article} .`)
      const expr = new DistinctExpression($rdf.blankNode(), nodes)

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns[0]).to.be.query(sparql`SELECT DISTINCT ?root ?foo WHERE {
        ?foo a ${schema.Article} .
      }`)
    })
  })
})
