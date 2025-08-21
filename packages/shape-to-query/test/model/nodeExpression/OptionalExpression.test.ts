import { rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from '@zazuko/env/web.js'
import { OptionalExpression } from '../../../model/nodeExpression/OptionalExpression.js'
import { blankNode } from '../../nodeFactory.js'
import { variable } from '../../variable.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import { s2q } from '../../../index.js'
import { fakeExpression } from './helper.js'

describe('model/nodeExpression/OptionalExpression', function () {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  before(function () { return import('../../sparql.js') })

  beforeEach(function () {
    factory = sinon.createStubInstance(ModelFactory)
    factory.nodeExpression.returns(<any>{})
  })

  describe('match', function () {
    it('returns true when expression has optional', function () {
      // given
      const pointer = blankNode()
        .addOut(s2q.optional, blankNode())

      // then
      expect(OptionalExpression.match(pointer)).to.be.true
    })

    it('returns true when sh:deactivated false', function () {
      // given
      const pointer = blankNode()
        .addOut(s2q.optional, blankNode())
        .addOut(sh.deactivated, false)

      // then
      expect(OptionalExpression.match(pointer)).to.be.true
    })
  })

  describe('fromPointer', function () {
    it('creates an instance with inner expression', function () {
      // given
      const inner = blankNode()
      const pointer = blankNode()
        .addOut(s2q.optional, inner)

      // when
      const optional = OptionalExpression.fromPointer(pointer, factory)

      // then
      expect(optional.term).to.deep.eq(pointer.term)
      expect(factory.nodeExpression).to.have.been
        .calledWith(sinon.match(actual => actual.term.equals(inner.term)))
    })
  })

  describe('build', function () {
    it('wraps inner patterns in OPTIONAL', function () {
      // given
      const inner = fakeExpression(({ object }) => [{
        type: 'bgp',
        triples: [{
          subject: object,
          predicate: rdf.type,
          object: schema('Article'),
        }],
      }])
      const expr = new OptionalExpression($rdf.blankNode(), inner)
      const object = variable()

      // when
      const { patterns } = expr.build({
        subject: variable(),
        object,
        variable,
        rootPatterns: [],
      }, new PatternBuilder())

      // then
      expect(patterns).to.deep.equal(
        // OPTIONAL { ?foo a schema:Article . }
        [{
          type: 'optional',
          patterns: [{
            type: 'bgp',
            triples: [{
              subject: object,
              predicate: rdf.type,
              object: schema.Article,
            }],
          }],
        }],
      )
    })
  })
})
