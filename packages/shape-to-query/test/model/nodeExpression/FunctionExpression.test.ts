import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { expect } from 'chai'
import { dashSparql, rdf, xsd } from '@tpluscode/rdf-ns-builders'
import sinon from 'sinon'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import {
  FunctionExpression,
  FunctionCallExpression,
  AdditiveExpression,
  RelationalExpression,
  InExpression,
} from '../../../model/nodeExpression/FunctionExpression.js'
import { blankNode } from '../../nodeFactory.js'
import vocabulary from '../../../vocabulary.js'
import { ex } from '../../namespace.js'
import { variable } from '../../variable.js'
import { NodeExpression, PatternBuilder } from '../../../model/nodeExpression/NodeExpression.js'
import ModelFactory from '../../../model/ModelFactory.js'
import { combinedNRE, fakeExpression } from './helper.js'

describe('model/nodeExpression/FunctionExpression', () => {
  let factory: sinon.SinonStubbedInstance<ModelFactory>

  before(() => import('../../sparql.js'))
  beforeEach(() => {
    factory = sinon.createStubInstance(ModelFactory)
  })
  before(() => {
    vocabulary.node(ex.function)
      .addOut(rdf.type, sh.Function)

    vocabulary.node(ex.functionWithOptionalArgs)
      .addOut(rdf.type, sh.Function)
      .addOut(sh.parameter, null)
      .addOut(sh.parameter, null)
      .addOut(sh.parameter, third => {
        third.addOut(sh.optional, true)
      })
      .addOut(sh.parameter, fourth => {
        fourth.addOut(sh.optional, true)
      })
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

    it('returns true when expression has a single predicate of known sh:Function', () => {
      // given
      const pointer = blankNode()
        .addList(dashSparql.and, blankNode())

      // when
      expect(FunctionExpression.match(pointer)).to.be.true
    })

    it('returns true when expression has a single predicate of an arbitrary predicate', () => {
      // given
      const pointer = blankNode()
        .addList(xsd.int, blankNode())

      // when
      expect(FunctionExpression.match(pointer)).to.be.true
    })

    it('returns false when expression has a single predicate of known sh:Function but not a list', () => {
      // given
      const pointer = blankNode()
        .addOut(dashSparql.and, blankNode())

      // when
      expect(FunctionExpression.match(pointer)).to.be.false
    })
  })

  describe('fromPointer', () => {
    context('throws when arguments are', () => {
      const cases: Array<[string, GraphPointer]> = [
        ['non-list blank node', blankNode().addOut(ex.function, null)],
        ['a literal', blankNode().addOut(ex.function, 10)],
        ['non-list named node', blankNode().addOut(ex.function, ex.foo)],
      ]

      for (const [name, pointer] of cases) {
        it(name, () => {
          expect(() => FunctionExpression.fromPointer(pointer, factory)).to.throw()
        })
      }
    })

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

    it('returns new function from arbitrary IRI', () => {
      // given
      const pointer = blankNode()
        .addList(xsd.int, [])

      // when
      const expr = FunctionExpression.fromPointer(pointer, factory)

      // then
      expect(expr).to.be.instanceof(FunctionCallExpression)
      expect(expr.symbol).to.deep.eq(xsd.int)
    })

    const additiveExpressions = [
      dashSparql.add,
      dashSparql.subtract,
      dashSparql.divide,
      dashSparql.multiply,
    ]

    for (const func of additiveExpressions) {
      it(`returns additive expression for ${func.value}`, () => {
        // given
        const pointer = blankNode()
          .addList(func, [])

        // when
        const expr = FunctionExpression.fromPointer(pointer, factory)

        // then
        expect(expr).to.be.instanceof(AdditiveExpression)
      })
    }

    const relationalExpressions = [
      dashSparql.eq,
      dashSparql.ne,
      dashSparql.ge,
      dashSparql.gt,
      dashSparql.le,
      dashSparql.lt,
    ]

    for (const func of relationalExpressions) {
      it(`returns relational expression for ${func.value}`, () => {
        // given
        const pointer = blankNode()
          .addList(func, ['A', 'B'])

        // when
        const expr = FunctionExpression.fromPointer(pointer, factory)

        // then
        expect(expr).to.be.instanceof(RelationalExpression)
      })
    }

    it('throws when InExpression has no arguments', () => {
      // given
      const pointer = blankNode()
        .addList(dashSparql.in, [])

      // then
      expect(() => FunctionExpression.fromPointer(pointer, factory)).to.throw()
    })

    it('returns a InExpression', () => {
      // given
      const pointer = blankNode()
        .addList(dashSparql.in, ['A'])

      // when
      const expr = FunctionExpression.fromPointer(pointer, factory)

      // then
      expect(expr).to.be.instanceof(InExpression)
    })

    context('optional arguments', () => {
      it('throws when there are too few arguments', () => {
        // given
        const pointer = blankNode()
          .addList(ex.functionWithOptionalArgs, ['A'])

        // then
        expect(() => FunctionExpression.fromPointer(pointer, factory)).to.throw()
      })

      it('throws when there are too many arguments', () => {
        // given
        const pointer = blankNode()
          .addList(ex.functionWithOptionalArgs, ['A', 'B', 'C', 'D', 'E'])

        // then
        expect(() => FunctionExpression.fromPointer(pointer, factory)).to.throw()
      })

      it('creates an instance with optional argument', () => {
        // given
        const pointer = blankNode()
          .addList(ex.functionWithOptionalArgs, ['A', 'B', 'C'])

        // when
        const expr = FunctionExpression.fromPointer(pointer, factory)

        // then
        expect(expr.args).to.have.length(3)
      })

      it('creates an instance without optional argument', () => {
        // given
        const pointer = blankNode()
          .addList(ex.functionWithOptionalArgs, ['A', 'B'])

        // when
        const expr = FunctionExpression.fromPointer(pointer, factory)

        // then
        expect(expr.args).to.have.length(2)
      })

      it('of BNODE', () => {
        const pointer = blankNode()
          .addList(dashSparql.bnode, [])

        expect(() => {
          FunctionExpression.fromPointer(pointer, factory)
        }).not.to.throw()
      })

      it('of REPLACE', () => {
        const pointer = blankNode()
          .addList(dashSparql.replace, ['arg', 'pattern', 'replacement'])

        expect(() => {
          FunctionExpression.fromPointer(pointer, factory)
        }).not.to.throw()
      })
    })
  })

  describe('FunctionCallExpression', () => {
    describe('constructor', () => {
      it('throws when number of arguments does not match', () => {
        expect(() =>
          new FunctionCallExpression(ex.function, [], {
            parameters: [{ optional: false }, { optional: false }],
          }),
        ).to.throw()
      })
    })

    describe('build', () => {
      it('builds patterns with built-in function "call"', () => {
        // given
        const expr = new FunctionCallExpression(ex.function, [], { symbol: $rdf.literal('uuid'), returnType: xsd.string })

        // when
        const result = expr.build({
          variable,
          subject: variable(),
          rootPatterns: sparql``,
        }, new PatternBuilder())

        // then
        expect(combinedNRE(result)).to.equalPatterns('SELECT ?foo WHERE { BIND(uuid() as ?foo) }')
      })

      it('builds patterns with custom function "call"', () => {
        // given
        const expr = new FunctionCallExpression(ex.search, [], { returnType: xsd.string })

        // when
        const result = expr.build({
          variable,
          subject: variable(),
          rootPatterns: sparql``,
        }, new PatternBuilder())

        // then
        expect(combinedNRE(result)).to.equalPatterns(sparql`SELECT ?foo WHERE { BIND(${ex.search}() as ?foo) }`)
      })
    })
  })

  describe('InExpression', () => {
    describe('build', () => {
      it('generates IN expression', () => {
        // given
        const exprList = [
          fakeExpression(undefined, () => ({ inline: sparql`A`, patterns: sparql`` })),
          fakeExpression(undefined, () => ({ inline: sparql`B`, patterns: sparql`` })),
          fakeExpression(undefined, () => ({ inline: sparql`C`, patterns: sparql`` })),
        ]
        const expr = new InExpression(dashSparql.in, exprList)

        // when
        const result = expr.build({
          variable,
          subject: $rdf.variable('foo'),
          rootPatterns: sparql``,
        }, new PatternBuilder())

        // then
        expect(combinedNRE(result)).to.equalPatterns(sparql`SELECT ?bar WHERE { BIND(?foo IN ( A, B, C ) as ?bar) }`)
      })

      it('generates NOT IN expression', () => {
        // given
        const exprList = [
          fakeExpression(undefined, () => ({ inline: sparql`A`, patterns: sparql`` })),
          fakeExpression(undefined, () => ({ inline: sparql`B`, patterns: sparql`` })),
          fakeExpression(undefined, () => ({ inline: sparql`C`, patterns: sparql`` })),
        ]
        const expr = new InExpression(dashSparql.notin, exprList)

        // when
        const result = expr.build({
          variable,
          subject: $rdf.variable('foo'),
          rootPatterns: sparql``,
        }, new PatternBuilder())

        // then
        expect(combinedNRE(result)).to.equalPatterns(sparql`SELECT ?bar WHERE { BIND(?foo NOT IN ( A, B, C ) as ?bar) }`)
      })
    })
  })

  describe('AdditiveExpression', () => {
    describe('build', () => {
      it('combines any number of arguments', () => {
        // given
        const expressions: NodeExpression[] = [
          fakeExpression(({ object }) => sparql`BIND('A' as ${object})`),
          fakeExpression(({ object }) => sparql`BIND('B' as ${object})`),
          fakeExpression(({ object }) => sparql`BIND('C' as ${object})`),
        ]
        const expr = new AdditiveExpression(dashSparql.and, '+', undefined, expressions)

        // when
        const result = expr.build({
          variable,
          subject: variable(),
          object: $rdf.variable('foo'),
          rootPatterns: sparql``,
        }, new PatternBuilder())

        // then
        expect(combinedNRE(result)).to.equalPatterns(`SELECT ?d WHERE {
          BIND('A' as ?a)
          BIND('B' as ?b)
          BIND('C' as ?c)
          BIND(?a + ?b + ?c as ?d)
        }`)
      })
    })
  })

  describe('RelationalExpression', () => {
    it('generates an operator pattern for its arguments', () => {
      // given
      const args = [
        fakeExpression(({ object }) => sparql`BIND('A' as ${object})`),
        fakeExpression(({ object }) => sparql`BIND('B' as ${object})`),
      ]
      const expr = new RelationalExpression(dashSparql.eq, '*', [{ optional: false }, { optional: false }], args)

      // when
      const result = expr.build({
        variable,
        subject: variable(),
        object: $rdf.variable('foo'),
        rootPatterns: sparql``,
      }, new PatternBuilder())

      // then
      expect(combinedNRE(result)).to.equalPatterns(`SELECT ?foo WHERE {
        BIND('A' as ?a)
        BIND('B' as ?b)
        BIND(?a * ?b as ?foo)
      }`)
    })
  })

  describe('buildInlineExpression', () => {
    it('wraps bound expression in parens', () => {
      // given
      class TestFunction extends FunctionExpression {
        protected boundExpression() {
          return sparql`A = B`
        }
      }

      // when
      const result = new TestFunction(ex.fun).buildInlineExpression({
        variable,
        subject: variable(),
        object: $rdf.variable('foo'),
        rootPatterns: sparql``,
      }, new PatternBuilder())

      // then
      expect(result.inline).to.equalPatterns('(A = B)')
    })
  })
})
