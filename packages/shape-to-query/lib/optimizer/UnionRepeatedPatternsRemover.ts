import Processor from '@hydrofoil/sparql-processor'
import type {
  BgpPattern, Expression,
  GroupPattern,
  Pattern,
  Triple,
  UnionPattern,
  ValuePatternRow,
  ValuesPattern,
} from 'sparqljs'
import { tripleEquals } from '@hydrofoil/sparql-processor/util/triple.js'
import { valuesHasRow } from '@hydrofoil/sparql-processor/util/values.js'
import { match, P } from 'ts-pattern'
import type { DataFactory, Variable } from '@rdfjs/types'

/**
 * Removes patterns from a union that are already present in the outer scope
 */
export class UnionRepeatedPatternsRemover extends Processor {
  declare patterns: Triple[][]
  declare values: ValuesPattern[][]
  declare union: UnionPattern
  declare group: GroupPattern

  constructor(factory: DataFactory) {
    super(factory)
    this.patterns = []
    this.values = []
  }

  processPatterns(patterns: Pattern[]): Pattern[] {
    if (this.union) {
      const processed = super.processPatterns(patterns)
      return processed.filter(removeEmpty)
    }

    this.patterns.push(patterns.flatMap(pattern => {
      return 'triples' in pattern ? pattern.triples : []
    }))
    this.values.push(patterns.filter((p): p is ValuesPattern => p.type === 'values'))

    const processed = super.processPatterns(patterns).filter(removeEmpty)

    this.values.pop()
    this.patterns.pop()

    return processed
  }

  processUnion(union: UnionPattern): Pattern {
    this.union = union

    const processed = super.processUnion(union)

    this.union = undefined
    if (processed.type !== 'union') {
      return processed
    }

    if (processed.patterns.length === 1) {
      if (processed.patterns[0].type === 'group') {
        return {
          type: 'optional',
          patterns: processed.patterns[0].patterns,
        }
      }

      if (processed.patterns.length === 1 && processed.patterns[0].type === 'union') {
        return processed.patterns[0]
      }

      return {
        type: 'optional',
        patterns: processed.patterns,
      }
    }

    return processed
  }

  processValues(values: ValuesPattern): Pattern {
    if (this.union) {
      values = {
        type: 'values',
        values: values.values.filter(row => {
          return !this.values.some(values => values.some(valuesHasRow(row)) && !this.rowOrTripleUsedInBind(row))
        }),
      }
    }

    return super.processValues(values)
  }

  processGroup(group: GroupPattern): Pattern {
    this.group = group
    const processed = super.processGroup(group)
    this.group = undefined
    return processed
  }

  processBgp(bgp: BgpPattern): BgpPattern {
    if (this.union) {
      // remove repeated triples from the bgp
      bgp.triples = bgp.triples.filter(triple => {
        return !this.patterns.some(triples => triples.some(tripleEquals(triple)) && !this.rowOrTripleUsedInBind(triple))
      })
    }

    return super.processBgp(bgp)
  }

  private rowOrTripleUsedInBind(row: ValuePatternRow | Triple): boolean {
    if (!this.group) {
      return false
    }

    const rowValues = Object.values(row)
    const _valuesUsedInExpression = valuesUsedInExpression(row)

    return this.group.patterns.some(pattern => {
      if (pattern.type !== 'bind') {
        return false
      }

      return match(pattern)
        .with({ expression: P.union({ type: 'operation' }, { type: 'functionCall' }) }, ({ expression }) => {
          return expression.args.some(_valuesUsedInExpression)
        })
        .with({ expression: { type: 'aggregate' } }, ({ expression }) => {
          return !('termType' in expression.expression) && _valuesUsedInExpression(expression.expression)
        })
        .with({ expression: P.array() }, ({ expression }) => expression.some(_valuesUsedInExpression))
        .with({ expression: { termType: 'Variable' } }, ({ expression }) => rowValues.some(expression.equals.bind(expression)))
        .with({ expression: { termType: P.any } }, () => false)
        .exhaustive()
    })
  }
}

function valuesUsedInExpression(row: ValuePatternRow | Triple) {
  let variableIsUsed: (variable: Variable) => boolean
  if ('subject' in row) {
    variableIsUsed = variable => variable.equals(row.subject) ||
      ('termType' in row.predicate && variable.equals(row.predicate)) ||
      variable.equals(row.object)
  } else {
    variableIsUsed = variable => row[`?${variable.value}`] !== undefined
  }

  return function matcher(expression: Expression) {
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore TS2589: Type instantiation is excessively deep and possibly infinite.
    return match(expression)
      .with(P.union({ type: 'operation' }, { type: 'functionCall' }), ({ args }) => {
        // @ts-ignore TS2589: Type instantiation is excessively deep and possibly infinite.
        return args.some(matcher)
      })
      .with({ type: 'aggregate' }, ({ expression }) => {
        return !('termType' in expression) && matcher(expression)
      })
      .with(P.array(), (tuple) => tuple.some(matcher))
      .with({ termType: 'Variable' }, variableIsUsed)
      .with({ termType: P.any }, () => false)
      .exhaustive()
  }
}

function removeEmpty(pattern: Pattern): boolean {
  switch (pattern.type) {
    case 'values':
      return pattern.values.length > 0
    case 'group':
      return pattern.patterns.length > 0
    case 'bgp':
      return pattern.triples.length > 0
  }

  return true
}
