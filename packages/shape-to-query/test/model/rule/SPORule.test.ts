import { expect } from 'chai'
import $rdf from '@zazuko/env/web.js'
import { sparql } from '@tpluscode/sparql-builder'
import { SPORule } from '../../../model/rule/SPORule.js'
import { variable } from '../../variable.js'
import { fakeExpression } from '../nodeExpression/helper.js'

describe('model/rule/SPORule', () => {
  before(() => import('../../sparql.js'))

  describe('buildPatterns', () => {
    it('works without filters', () => {
      // given
      const filter1 = fakeExpression(args => sparql`${args.subject} filter1 .`)
      const filter2 = fakeExpression(args => sparql`${args.subject} filter2 .`)
      const rule = new SPORule({
        objectFilters: [filter1, filter2],
        predicateFilters: [filter1, filter2],
      })

      // when
      const result = rule.buildPatterns({
        variable,
        rootPatterns: undefined,
        focusNode: $rdf.namedNode('this'),
      })

      // then
      expect(sparql`${result.constructClause}\n${result.whereClause}`).to.equalPatterns(`
        <this> ?p ?o .
        
        <this> ?p ?o .
        ?p filter1 .
        ?p filter2 .
        ?o filter1 .
        ?o filter2 .
      `)
    })

    it('applies multiple filters', () => {
      // given
      const rule = new SPORule({})

      // when
      const result = rule.buildPatterns({
        variable,
        rootPatterns: undefined,
        focusNode: $rdf.namedNode('this'),
      })

      // then
      expect(sparql`${result.constructClause}\n${result.whereClause}`).to.equalPatterns(`
        <this> ?p ?o .
        <this> ?p ?o .
      `)
    })
  })
})
