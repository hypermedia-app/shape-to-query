import { Assertion, AssertionError } from 'chai'
import { Generator, Parser, SparqlQuery } from 'sparqljs'
import type { SparqlTemplateResult } from '@tpluscode/rdf-string'

const sparqlParser = new Parser()
const generator = new Generator()

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface TypeComparison {
      query(expected: string | SparqlTemplateResult | SparqlQuery): void
    }
  }
}

Assertion.addMethod('query', function (this: Chai.AssertionStatic, expected: string | SparqlTemplateResult) {
  let expectedQuery: SparqlQuery
  let actualQuery: SparqlQuery

  try {
    expectedQuery = sparqlParser.parse(expected.toString())
  } catch (e: any) {
    throw new AssertionError(`Failed to parse expected query.
${e.message}.
Query was:
${expected}`)
  }

  try {
    let actualQueryString: string
    if (typeof this._obj === 'string') {
      actualQueryString = this._obj
    } else {
      actualQueryString = this._obj.build()
    }
    actualQuery = sparqlParser.parse(actualQueryString)
  } catch (e: any) {
    throw new AssertionError(`Failed to parse actual query.
${e.message}.
Query was:
${this._obj.toString()}`)
  }

  new Assertion(generator.stringify(actualQuery)).deep.eq(generator.stringify(expectedQuery))
})
