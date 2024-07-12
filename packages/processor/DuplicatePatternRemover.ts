import type { DataFactory } from '@rdfjs/types'
import type sparqljs from 'sparqljs'
import { match } from 'ts-pattern'
import type TermSetFactory from '@rdfjs/term-set/Factory.js'
import type { Environment } from '@rdfjs/environment/Environment.js'
import { tripleEquals } from './util/triple.js'
import { valuesHasRow } from './util/values.js'
import Processor from './index.js'

type E = Environment<DataFactory | TermSetFactory>

/**
 * Merges duplicate quad patterns.
 */
export class DuplicatePatternRemover extends Processor<E> {
  processUnion(union: sparqljs.UnionPattern): sparqljs.Pattern {
    // processes UNION patterns separately to prevent collapsing them into a single BGP
    return {
      ...union,
      patterns: union.patterns.map(this.processPattern.bind(this)),
    }
  }

  processPatterns(patterns: sparqljs.Pattern[]): sparqljs.Pattern[] {
    const cleaned: sparqljs.Pattern[] = []

    for (const pattern of patterns) {
      match(pattern)
        .with({ type: 'bgp' }, bgp => {
          const triples: sparqljs.Triple[] = []

          for (const triple of bgp.triples) {
            // keep triple if it was not seen before in another BGP
            if (!cleaned.some(bgpHasTriple(triple))) {
              triples.push(triple)
            }
          }

          if (triples.length) {
            cleaned.push({
              type: 'bgp',
              triples,
            })
          }
        })
        .with({ type: 'values' }, values => {
          const rows: sparqljs.ValuePatternRow[] = []

          for (const row of values.values) {
            // keep row if it was not seen before in another VALUES
            if (!cleaned.some(valuesHasRow(row))) {
              rows.push(row)
            }
          }

          if (rows.length) {
            cleaned.push({
              type: 'values',
              values: rows,
            })
          }
        })
        .otherwise(p => cleaned.push(p))
    }

    return super.processPatterns(mergeConsecutiveBGPs(cleaned))
  }
}

function mergeConsecutiveBGPs(patterns: sparqljs.Pattern[]) {
  const merged: sparqljs.Pattern[] = []

  for (const pattern of patterns) {
    if (pattern.type === 'bgp') {
      const last = merged[merged.length - 1]

      if (last?.type === 'bgp') {
        merged[merged.length - 1] = {
          type: 'bgp',
          triples: last.triples.concat(pattern.triples),
        }
      } else {
        merged.push(pattern)
      }
    } else {
      merged.push(pattern)
    }
  }

  return merged
}

function bgpHasTriple(triple: sparqljs.Triple) {
  return (pattern: sparqljs.Pattern) => {
    return pattern.type === 'bgp' && pattern.triples.some(tripleEquals(triple))
  }
}
