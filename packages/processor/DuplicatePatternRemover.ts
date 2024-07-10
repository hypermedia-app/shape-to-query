import type { DataFactory } from '@rdfjs/types'
import type sparqljs from 'sparqljs'
import { match } from 'ts-pattern'
import type TermSetFactory from '@rdfjs/term-set/Factory.js'
import type { Environment } from '@rdfjs/environment/Environment.js'
import { Processor } from './index.js'

type E = Environment<DataFactory | TermSetFactory>

/**
 * Merges duplicate quad patterns.
 */
export class DuplicatePatternRemover extends Processor<E> {
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
            if (!cleaned.some(hasValuesWithRow(row))) {
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

    return super.processPatterns(cleaned)
  }
}

function bgpHasTriple(triple: sparqljs.Triple) {
  return (pattern: sparqljs.Pattern) => {
    if (pattern.type === 'bgp') {
      return pattern.triples.some(triplesEqual(triple))
    }

    return false
  }
}

function hasValuesWithRow(row: sparqljs.ValuePatternRow) {
  const entries = Object.entries(row)

  return (pattern: sparqljs.Pattern) => {
    if (pattern.type === 'values') {
      return pattern.values.some(other => {
        return entries.every(([key, value]) => {
          return other[key]?.equals(value)
        })
      })
    }

    return false
  }
}

function triplesEqual(triple: sparqljs.Triple) {
  return (other: sparqljs.Triple) => {
    if (!triple.subject.equals(other.subject)) {
      return false
    }
    if (!triple.object.equals(other.object)) {
      return false
    }

    if ('termType' in triple.predicate) {
      if ('termType' in other.predicate) {
        return triple.predicate.equals(other.predicate)
      }
      return false
    }

    if (!('termType' in other.predicate)) {
      return pathsEqual(triple.predicate, other.predicate)
    }

    return false
  }
}

function pathsEqual(left: sparqljs.PropertyPath, right: sparqljs.PropertyPath) {
  return left.pathType === right.pathType &&
    left.items.length === right.items.length &&
    left.items.every((item, index) => {
      const rightItem = right.items[index]
      if ('termType' in item && 'termType' in rightItem) {
        return item.equals(rightItem)
      }

      if ('pathType' in item && 'pathType' in rightItem) {
        return pathsEqual(item, rightItem)
      }

      return false
    })
}
