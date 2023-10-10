import { schema } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { sparql } from '@tpluscode/rdf-string'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from '@zazuko/env'
import { CountExpression } from '../../../model/nodeExpression/CountExpression.js'
import { blankNode, namedNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
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
      const inner = fakeExpression(({ object }) => sparql`${object} a ${schema.Article} .`)
      const expr = new CountExpression($rdf.blankNode(), inner)

      // when
      const subject = variable()
      const { patterns } = expr.build({
        subject,
        object: variable(),
        variable,
        rootPatterns: sparql`root a ${subject}`,
      }, new PatternBuilder())

      // then
      expect((patterns as any)._getTemplateResult()).to.equalPatterns(`SELECT (COUNT(?inner) as ?count) WHERE {
        ?inner a schema:Article .
      }`)
    })
  })
})
