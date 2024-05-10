import { schema } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { sparql } from '@tpluscode/rdf-string'
import { expect } from 'chai'
import sinon from 'sinon'
import { SELECT } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env/web.js'
import { DistinctExpression } from '../../../model/nodeExpression/DistinctExpression.js'
import { blankNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import { fakeExpression } from './helper.js'

describe('model/nodeExpression/DistinctExpression', () => {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  before(() => import('../../sparql.js'))
  beforeEach(() => {
    factory = sinon.createStubInstance(ModelFactory)
    factory.nodeExpression.returns(<any>{})
  })

  describe('match', () => {
    it('returns true when there is a single sh:distinct', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.distinct, blankNode())

      // then
      expect(DistinctExpression.match(pointer)).to.be.true
    })

    it('returns false when there are multiple sh:distinct', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.distinct, blankNode())
        .addOut(sh.distinct, blankNode())

      // then
      expect(DistinctExpression.match(pointer)).to.be.false
    })

    it('returns false when there is no sh:distinct', () => {
      // given
      const pointer = blankNode()

      // then
      expect(DistinctExpression.match(pointer)).to.be.false
    })
  })

  describe('fromPointer', () => {
    it('return an instance of DistinctExpression', () => {
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

  describe('build', () => {
    it('creates a DISTINCT subselect', () => {
      // given
      const nodes = fakeExpression(({ object }) => sparql`${object} a ${schema.Article} .`)
      const expr = new DistinctExpression($rdf.blankNode(), nodes)

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: sparql``,
      }, new PatternBuilder())

      // then
      expect((patterns as any)._getTemplateResult()).to.equalPatterns(`SELECT DISTINCT ?root ?foo WHERE {
        ?foo a schema:Article .
      }`)
    })

    it('sets DISTINCT on inner subselect', () => {
      // given
      const nodes = fakeExpression(({ subject, object }) => SELECT`${subject} ${object}`.WHERE`${object} a ${schema.Article} .`)
      const expr = new DistinctExpression($rdf.blankNode(), nodes)

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object: variable(),
        variable,
        rootPatterns: sparql``,
      }, new PatternBuilder())

      // then
      expect((patterns as any)._getTemplateResult()).to.equalPatterns(`SELECT DISTINCT ?root ?foo WHERE {
        ?foo a schema:Article .
      }`)
    })
  })
})
