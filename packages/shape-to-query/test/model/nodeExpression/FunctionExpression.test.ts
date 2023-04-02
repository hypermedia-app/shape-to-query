import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { expect } from 'chai'
import { dashSparql, rdf, xsd } from '@tpluscode/rdf-ns-builders'
import sinon from 'sinon'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import { FunctionExpression, FunctionCallExpression, AdditiveExpression } from '../../../model/nodeExpression/FunctionExpression.js'
import { blankNode } from '../../nodeFactory.js'
import vocabulary from '../../../vocabulary.js'
import { ex } from '../../namespace.js'
import { variable } from '../../variable.js'
import { NodeExpression } from '../../../model/nodeExpression/NodeExpression.js'

describe('model/nodeExpression/FunctionExpression', () => {
  let factory: sinon.SinonSpy

  before(() => import('../../sparql.js'))
  beforeEach(() => {
    factory = sinon.stub().returns({})
  })
  before(() => {
    vocabulary.node(ex.function)
      .addOut(rdf.type, sh.Function)
  })

  describe('match', () => {
    it('returns false when expression has multiple predicates', () => {
      // given
      const pointer = blankNode()
        .addOut(dashSparql.and, blankNode())
        .addOut(dashSparql.or, blankNode())

      // when
      expect(FunctionExpression.match(pointer)).to.be.false
    })

    it('returns false when expression has multiple predicates', () => {
      // given
      const pointer = blankNode()
        .addOut(dashSparql.and, blankNode())
        .addOut(dashSparql.or, blankNode())

      // when
      expect(FunctionExpression.match(pointer)).to.be.false
    })

    it('returns true when expression has a single predicate of known sh:Function', () => {
      // given
      const pointer = blankNode()
        .addList(dashSparql.and, blankNode())

      // when
      expect(FunctionExpression.match(pointer)).to.be.true
    })

    it('returns true when expression has a single predicate of known sh:Function but not a list', () => {
      // given
      const pointer = blankNode()
        .addOut(dashSparql.and, blankNode())

      // when
      expect(FunctionExpression.match(pointer)).to.be.false
    })
  })

  describe('fromPointer', () => {
    it('returns new function with URI symbol', () => {
      // given
      const pointer = blankNode()
        .addList(ex.function, ['A', 'B'])

      // when
      const expr = FunctionExpression.fromPointer(pointer, factory)

      // then
      expect(expr.symbol).to.deep.eq(ex.function)
      expect(expr.args).to.have.length(2)
    })

    it('returns new function with built-in symbol', () => {
      // given
      const pointer = blankNode()
        .addList(dashSparql.substr, ['A', 'B', 'C'])

      // when
      const expr = FunctionExpression.fromPointer(pointer, factory)

      // then
      expect(expr.symbol).to.deep.eq($rdf.literal('SUBSTR'))
      expect(expr.args).to.have.length(3)
    })

    it('returns new function with return type', () => {
      // given
      const pointer = blankNode()
        .addList(dashSparql.struuid, [])

      // when
      const expr = FunctionExpression.fromPointer(pointer, factory)

      // then
      expect(expr.returnType).to.deep.eq(xsd.string)
    })
  })

  describe('FunctionCallExpression', () => {
    describe('constructor', () => {
      it('throws when number of arguments does not match', () => {
        expect(() =>
          new FunctionCallExpression($rdf.literal('foobar'), [{}, {}], undefined, []),
        ).to.throw()
      })
    })

    describe('buildPatterns', () => {
      it('builds patterns with built-in function "call"', () => {
        // given
        const expr = new FunctionCallExpression($rdf.literal('uuid'), [], xsd.string, [])

        // when
        const result = expr.buildPatterns({
          variable,
          subject: variable(),
          object: $rdf.variable('foo'),
          rootPatterns: sparql``,
        })

        // then
        expect(result).to.equalPatternsVerbatim('BIND(uuid() as ?foo)')
      })

      it('builds patterns with custom function "call"', () => {
        // given
        const expr = new FunctionCallExpression(ex.search, [], xsd.string, [])

        // when
        const result = expr.buildPatterns({
          variable,
          subject: variable(),
          object: $rdf.variable('foo'),
          rootPatterns: sparql``,
        })

        // then
        expect(result).to.equalPatternsVerbatim(sparql`BIND(${ex.search}() as ?foo)`)
      })
    })
  })

  describe('AdditiveExpression', () => {
    describe('buildPatterns', () => {
      it('combines any number of arguments', () => {
        // given
        const expressions: NodeExpression[] = [{
          buildPatterns: ({ object }) => sparql`BIND('A' as ${object})`,
        }, {
          buildPatterns: ({ object }) => sparql`BIND('B' as ${object})`,
        }, {
          buildPatterns: ({ object }) => sparql`BIND('C' as ${object})`,
        }]
        const expr = new AdditiveExpression('+', undefined, expressions)

        // when
        const result = expr.buildPatterns({
          variable,
          subject: variable(),
          object: $rdf.variable('foo'),
          rootPatterns: sparql``,
        })

        // then
        expect(result).to.equalPatterns(`
          BIND('A' as ?a)
          BIND('B' as ?b)
          BIND('C' as ?c)
          BIND(?a + ?b + ?c as ?d)
        `)
      })
    })
  })
})
