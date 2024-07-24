import type { Variable } from '@rdfjs/types'
import { Assertion, AssertionError } from 'chai'
import type { SparqlQuery } from 'sparqljs'
import sparqljs from 'sparqljs'
import type { SparqlTemplateResult } from '@tpluscode/rdf-string'
import { sparql } from '@tpluscode/rdf-string'
import $rdf from '@zazuko/env'
import { createVariableSequence } from '../lib/variableSequence.js'
import { SELECT } from './pattern.js'
// eslint-disable-next-line import/no-extraneous-dependencies
import 'mocha-chai-jest-snapshot'

const sparqlParser = new sparqljs.Parser()
const generator = new sparqljs.Generator()

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface TypeComparison {
      query(expected?: string | SparqlTemplateResult | SparqlQuery): void
      equalPatterns(expected: string | SparqlTemplateResult | sparqljs.Pattern[]): void
      equalPatternsVerbatim(expected: string | SparqlTemplateResult | sparqljs.Pattern[]): void
    }
  }
}

Assertion.addMethod('query', function (this: Chai.AssertionStatic, expected?: string | SparqlTemplateResult) {
  let expectedQuery: SparqlQuery | undefined
  let actualQuery: string

  try {
    if (expected) {
      expectedQuery = sparqlParser.parse(expected.toString())
    }
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
      this._obj.prefixes = expectedQuery.prefixes
      actualQueryString = generator.stringify(this._obj)
    }
    actualQuery = stringifyAndNormalize(sparqlParser.parse(actualQueryString))
  } catch (e: any) {
    throw new AssertionError(`Failed to parse actual query.
${e.message}.
Query was:
${this._obj.toString()}`)
  }

  if (expectedQuery) {
    new Assertion(actualQuery).deep.eq(stringifyAndNormalize(expectedQuery))
  } else {
    new Assertion(actualQuery).toMatchSnapshot()
  }
})

Assertion.addMethod('equalPatterns', function (this: Chai.AssertionStatic, expected: string | SparqlTemplateResult | sparqljs.Pattern[]) {
  const obj: sparqljs.Pattern[] | SparqlTemplateResult = this._obj

  const actualPatterns = normalize(
    Array.isArray(obj) ? generator.stringify(SELECT(obj)) : sparql`SELECT * WHERE { ${obj} }`._toPartialString({ env: $rdf, prologue: false, noPrefixedNames: true }).value)
  const expectedPatterns = normalize(
    Array.isArray(expected)
      ? generator.stringify(SELECT(expected))
      : sparql`SELECT * WHERE { ${expected} }`._toPartialString({ env: $rdf, prologue: false, noPrefixedNames: true }).value,
  )

  new Assertion(actualPatterns).to.equalIgnoreSpaces(expectedPatterns)
})

Assertion.addMethod('equalPatternsVerbatim', function (this: Chai.AssertionStatic, expected: string | SparqlTemplateResult | sparqljs.Pattern[]) {
  const obj: sparqljs.Pattern[] | SparqlTemplateResult = this._obj

  const actualPatterns = normalize(
    Array.isArray(obj) ? generator.stringify(SELECT(obj)) : sparql`SELECT * WHERE { ${obj} }`._toPartialString({ env: $rdf, prologue: false, noPrefixedNames: true }).value)
  const expectedPatterns = normalize(
    Array.isArray(expected)
      ? generator.stringify(SELECT(expected))
      : sparql`SELECT * WHERE { ${expected} }`._toPartialString({ env: $rdf, prologue: false, noPrefixedNames: true }).value,
  )

  new Assertion(actualPatterns).to.equalIgnoreSpaces(expectedPatterns)
})

function stringifyAndNormalize(query: SparqlQuery) {
  const normalized = normalize(generator.stringify(query))

  // remove PREFIX lines
  return normalized.split('\n').filter(line => !line.startsWith('PREFIX')).join('\n')
}

function normalize(query: string): string {
  const nextVariable = createVariableSequence('q')
  const variableMap = new Map<string, Variable>()

  return (() => query.trimStart().trimEnd().replace(/\?\w+/g, (variable) => {
    if (!variableMap.has(variable)) {
      variableMap.set(variable, nextVariable())
    }

    return '?' + variableMap.get(variable)?.value
  }))()
}
