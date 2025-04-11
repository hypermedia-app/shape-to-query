import sinon from 'sinon'
import { expect } from 'chai'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import type { BindPattern, SelectQuery } from 'sparqljs'
import rdf from '@zazuko/env/web.js'
import { sparql } from '@tpluscode/rdf-string'
import ModelFactory from '../../../model/ModelFactory.js'
import { blankNode } from '../../nodeFactory.js'
import { IfExpression } from '../../../model/nodeExpression/IfExpression.js'
import { variable } from '../../variable.js'
import type { InlineExpressionResult } from '../../../model/nodeExpression/NodeExpression.js'
import { PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import { fakeExpression } from './helper.js'

describe('model/nodeExpression/IfExpression', () => {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  before(() => import('../../sparql.js'))
  beforeEach(() => {
    factory = sinon.createStubInstance(ModelFactory)
    factory.nodeExpression.callsFake((pointer) => <any>({ term: pointer.term }))
  })

  describe('match', () => {
    it('returns false when sh:if is missing', () => {
      // given
      const pointer = blankNode()

      // then
      expect(IfExpression.match(pointer)).to.be.false
    })

    it('returns false when sh:then is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.if, blankNode())

      // then
      expect(IfExpression.match(pointer)).to.be.false
    })

    it('returns false when sh:else is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.if, blankNode())
        .addOut(sh.then, blankNode())

      // then
      expect(IfExpression.match(pointer)).to.be.false
    })

    it('returns true when has all of if/then/else properties', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.if, blankNode())
        .addOut(sh.then, blankNode())
        .addOut(sh.else, blankNode())

      // then
      expect(IfExpression.match(pointer)).to.be.true
    })
  })

  describe('fromPointer', () => {
    it('throws when sh:if is missing', () => {
      // given
      const pointer = blankNode()

      // then
      expect(() => {
        // when
        IfExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when sh:then is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.if, blankNode())

      // then
      expect(() => {
        // when
        IfExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when sh:else is missing', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.if, blankNode())
        .addOut(sh.then, blankNode())

      // then
      expect(() => {
        // when
        IfExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when sh:if has multiple values', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.if, blankNode())
        .addOut(sh.if, blankNode())
        .addOut(sh.then, blankNode())
        .addOut(sh.else, blankNode())

      // then
      expect(() => {
        // when
        IfExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when sh:then has multiple values', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.if, blankNode())
        .addOut(sh.then, blankNode())
        .addOut(sh.then, blankNode())
        .addOut(sh.else, blankNode())

      // then
      expect(() => {
        // when
        IfExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('throws when sh:else has multiple values', () => {
      // given
      const pointer = blankNode()
        .addOut(sh.if, blankNode())
        .addOut(sh.then, blankNode())
        .addOut(sh.else, blankNode())
        .addOut(sh.else, blankNode())

      // then
      expect(() => {
        // when
        IfExpression.fromPointer(pointer, factory)
      }).to.throw()
    })

    it('returns an instance of IfExpression with child expressions', () => {
      // given
      const ifPointer = blankNode()
      const thenPointer = blankNode()
      const elsePointer = blankNode()
      const pointer = blankNode()
        .addOut(sh.if, ifPointer)
        .addOut(sh.then, thenPointer)
        .addOut(sh.else, elsePointer)

      // when
      const expr = IfExpression.fromPointer(pointer, factory)

      // then
      expect(expr).to.be.instanceof(IfExpression)
      expect(expr).to.have.property('ifExpr').to.deep.eq({ term: ifPointer.term })
      expect(expr).to.have.property('thenExpr').to.deep.eq({ term: thenPointer.term })
      expect(expr).to.have.property('elseExpr').to.deep.eq({ term: elsePointer.term })
    })
  })

  describe('build', () => {
    it('binds an if function call with result of expressions', () => {
      // given
      const ifExpr = fakeExpression(args => [<BindPattern>{
        type: 'bind',
        variable: args.object,
        expression: {
          type: 'operation',
          operator: '=',
          args: [args.subject, rdf.literal('foo')],
        },
      }])
      const thenExpr = fakeExpression(args => [<BindPattern>{
        type: 'bind',
        variable: args.object,
        expression: rdf.literal('bar'),
      }])
      const elseExpr = fakeExpression(args => [<BindPattern>{
        type: 'bind',
        variable: args.object,
        expression: rdf.literal('baz'),
      }])
      const expression = new IfExpression(rdf.blankNode(), ifExpr, thenExpr, elseExpr)

      // when
      const { patterns, object } = expression.build({
        variable,
        rootPatterns: [],
        subject: rdf.variable('this'),
      }, new PatternBuilder())

      // then
      const query: SelectQuery = {
        type: 'query',
        queryType: 'SELECT',
        variables: [object],
        prefixes: {},
        where: patterns,
      }
      expect(query).to.be.query(sparql`SELECT ${object} {
        BIND(?this = "foo" as ?ifFoo)
        BIND("bar" as ?thenBar)
        BIND("baz" as ?elseBaz)
        BIND(IF(?ifFoo, ?thenBar, ?elseBaz) as ${object})
      }`)
    })

    it('binds an if function call with inline expressions', () => {
      // given
      const ifExpr = fakeExpression(undefined, args => (<InlineExpressionResult>{
        inline: {
          type: 'operation',
          operator: '=',
          args: [args.subject, rdf.literal('foo')],
        },
      }))
      const thenExpr = fakeExpression(undefined, () => (<InlineExpressionResult>{
        inline: rdf.literal('bar'),
      }))
      const elseExpr = fakeExpression(undefined, () => (<InlineExpressionResult>{
        inline: rdf.literal('baz'),
      }))
      const expression = new IfExpression(rdf.blankNode(), ifExpr, thenExpr, elseExpr)

      // when
      const { patterns, object } = expression.build({
        variable,
        rootPatterns: [],
        subject: rdf.variable('this'),
      }, new PatternBuilder())

      // then
      const query: SelectQuery = {
        type: 'query',
        queryType: 'SELECT',
        variables: [object],
        prefixes: {},
        where: patterns,
      }
      expect(query).to.be.query(sparql`SELECT ${object} {
        BIND(IF(?this = "foo", "bar", "baz") as ${object})
      }`)
    })
  })
})
