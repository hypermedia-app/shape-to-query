import { expect } from 'chai'
import { dashSparql } from '@tpluscode/rdf-ns-builders/loose'
import { rdf } from '@tpluscode/rdf-ns-builders'
import vocabulary from '../vocabulary.js'

describe('vocabulary', function () {
  const additiveExpressions = [
    dashSparql.and,
    dashSparql.or,
    dashSparql.add,
    dashSparql.subtract,
    dashSparql.divide,
    dashSparql.multiply,
  ]

  for (const func of additiveExpressions) {
    it(`${func.value} is an additive expression`, function () {
      expect(vocabulary.node(func).has(rdf.type, dashSparql.AdditiveExpression).term)
        .to.deep.eq(func)
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
    it(`${func.value} is an relational expression`, function () {
      expect(vocabulary.node(func).has(rdf.type, dashSparql.RelationalExpression).term)
        .to.deep.eq(func)
    })
  }
})
