import { expect } from 'chai'
import { sparql } from '@tpluscode/sparql-builder'
import { toRdf } from 'rdf-literal'
import { SPORule } from '../../../model/rule/SPORule.js'
import { variable } from '../../variable.js'
import { fakeExpression } from '../nodeExpression/helper.js'
import { ex } from '../../namespace.js'

describe('model/rule/SPORule', function () {
  before(function () { return import('../../sparql.js') })

  describe('buildPatterns', function () {
    it('works without filters', function () {
      // given
      const filter1 = fakeExpression(args => [{
        type: 'filter',
        expression: {
          type: 'operation',
          operator: '>',
          args: [args.subject, toRdf(1)],
        },
      }])
      const filter2 = fakeExpression(args => [{
        type: 'filter',
        expression: {
          type: 'operation',
          operator: '<',
          args: [args.subject, toRdf(20)],
        },
      }])
      const rule = new SPORule({
        objectFilters: [filter1, filter2],
        predicateFilters: [filter1, filter2],
      })

      // when
      const result = rule.buildPatterns({
        variable,
        rootPatterns: undefined,
        focusNode: ex.this,
      })

      // then
      expect(result.constructClause[0].subject).to.deep.equal(ex.this)
      const { predicate: p, object: o } = result.constructClause[0]
      expect(result.whereClause).to.equalPatterns(sparql`
        ${ex.this} ${p} ${o} .
        FILTER(${p} > 1)
        FILTER(${p} < 20)
        FILTER(${o} > 1)
        FILTER(${o} < 20)
      `)
    })

    it('applies multiple filters', function () {
      // given
      const rule = new SPORule({})

      // when
      const result = rule.buildPatterns({
        variable,
        rootPatterns: undefined,
        focusNode: ex.this,
      })

      // then
      expect(result.constructClause[0].subject).to.deep.equal(ex.this)
      const { predicate: p, object: o } = result.constructClause[0]
      expect(result.whereClause).to.equalPatterns(sparql`
        ${ex.this} ${p} ${o} .
      `)
    })
  })
})
