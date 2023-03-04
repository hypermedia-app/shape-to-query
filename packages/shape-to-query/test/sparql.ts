import { Variable } from 'rdf-js'
import { Assertion, AssertionError } from 'chai'
import { Generator, Parser, SparqlQuery } from 'sparqljs'
import type { SparqlTemplateResult } from '@tpluscode/rdf-string'
import { createVariableSequence } from '../lib/variableSequence'

const sparqlParser = new Parser()
const generator = new Generator()

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface TypeComparison {
      query(expected: string | SparqlTemplateResult | SparqlQuery): void
      equalPatterns(expected: string | SparqlTemplateResult): void
      equalPatternsVerbatim(expected: string | SparqlTemplateResult): void
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

  new Assertion(stringifyAndNormalize(actualQuery)).deep.eq(stringifyAndNormalize(expectedQuery))
})

Assertion.addMethod('equalPatterns', function (this: Chai.AssertionStatic, expected: string | SparqlTemplateResult) {
  const actualPatterns = normalize(this._obj.toString({ prologue: false }))
  const expectedPatterns = normalize(expected.toString({ prologue: false }))

  new Assertion(actualPatterns).to.equalIgnoreSpaces(expectedPatterns)
})

Assertion.addMethod('equalPatternsVerbatim', function (this: Chai.AssertionStatic, expected: string | SparqlTemplateResult) {
  const actualPatterns = this._obj.toString({ prologue: false })
  const expectedPatterns = expected.toString({ prologue: false })

  new Assertion(actualPatterns).to.equalIgnoreSpaces(expectedPatterns)
})

function stringifyAndNormalize(query: SparqlQuery) {
  return normalize(generator.stringify(query))
}

function normalize(query: string): string {
  const nextVariable = createVariableSequence('q')
  const variableMap = new Map<string, Variable>()

  return (() => query.trimStart().trimEnd().replace(/\?\w+/g, (variable) => {
    if (!variableMap.has(variable)) {
      variableMap.set(variable, nextVariable())
    }

    return '?' + variableMap.get(variable).value
  }))()
}
