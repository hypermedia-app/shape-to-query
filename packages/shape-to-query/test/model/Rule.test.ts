import { schema } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import PropertyValueRule from '../../model/rule/PropertyValueRule.js'
import TripleRule from '../../model/rule/TripleRule.js'
import { variable } from '../variable.js'
import { PatternBuilder } from '../../model/nodeExpression/NodeExpression.js'
import { BIND } from '../pattern.js'
import { fakeExpression } from './nodeExpression/helper.js'

describe('model/Rule', function () {
  before(function () { return import('../sparql.js') })

  describe('PropertyValueRule', function () {
    it('bind path to construct', function () {
      // given
      const expr = fakeExpression(() => [])
      const rule = new PropertyValueRule(schema.knows, expr)

      // when
      const { constructClause } = rule.buildPatterns({
        variable,
        rootPatterns: [],
        focusNode: $rdf.namedNode('foo'),
        objectNode: variable(),
        builder: new PatternBuilder(),
      })

      // then
      expect(sparql`${constructClause}`).to.equalPatterns(sparql`<foo> ${schema.knows} ?bar .`)
    })

    it('constructs inverse property path', function () {
      // given
      const expr = fakeExpression(() => [])
      const rule = new PropertyValueRule(schema.knows, expr, {
        inverse: true,
      })

      // when
      const { constructClause } = rule.buildPatterns({
        variable,
        rootPatterns: [],
        focusNode: $rdf.namedNode('foo'),
        objectNode: variable(),
        builder: new PatternBuilder(),
      })

      // then
      expect(sparql`${constructClause}`).to.equalPatterns(sparql`?bar ${schema.knows} <foo> .`)
    })
  })

  describe('TripleRule', function () {
    describe('buildPatterns', function () {
      it('constructs the result of subject/predicate/object', function () {
        // given
        const subject = fakeExpression(({ object }) => [BIND('S').as(object)])
        const predicate = fakeExpression(({ object }) => [BIND('P').as(object)])
        const object = fakeExpression(({ object }) => [BIND('O').as(object)])
        const rule = new TripleRule(subject, predicate, object)

        // when
        const patterns = rule.buildPatterns({
          variable,
          rootPatterns: [],
          focusNode: $rdf.namedNode('foo'),
        })

        // then
        const { subject: s, predicate: p, object: o } = patterns.constructClause[0]
        expect(patterns.whereClause)
          .to.equalPatterns(sparql`
            BIND("S" AS ${s})
            BIND("P" AS ${p})
            BIND("O" AS ${o})
          `)
      })
    })
  })
})
