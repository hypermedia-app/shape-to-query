import type { BaseQuad, DataFactory } from '@rdfjs/types'
import type sparqljs from 'sparqljs'
import { match, P } from 'ts-pattern'
import type TermSetFactory from '@rdfjs/term-set/Factory.js'
import type { Environment } from '@rdfjs/environment/Environment.js'
import { Processor } from './index.js'

type E = Environment<DataFactory | TermSetFactory>

/**
 * Merges duplicate quad patterns. Optionally, it can reorder the patterns to place all BGPs first.
 */
export class DuplicatePatternRemover extends Processor<E> {
  constructor(factory: E, private options: { reorder: boolean } = { reorder: true }) {
    super(factory)
  }

  processPatterns(patterns: sparqljs.Pattern[]): sparqljs.Pattern[] {
    if (this.options.reorder) {
      // place BGPs first
      patterns = patterns.sort((a, b) => (a.type === 'bgp' ? -1 : 1) - (b.type === 'bgp' ? -1 : 1))
    }

    // merge consecutive BGPs
    const merged = patterns.reduce<sparqljs.Pattern[]>((acc, pattern) => {
      const last = acc[acc.length - 1]
      if (last?.type === 'bgp' && pattern.type === 'bgp') {
        last.triples.push(...pattern.triples)
      } else {
        acc.push(pattern)
      }

      return acc
    }, [])

    return super.processPatterns(merged)
  }

  processBgp(bgp: sparqljs.BgpPattern): sparqljs.BgpPattern {
    const previousQuads = this.factory.termSet<BaseQuad>()

    const triples = bgp.triples.reduce<sparqljs.Triple[]>((acc, triple) => {
      match(triple)
        .with({ predicate: { type: 'path' } }, triple => acc.push(triple))
        .with({ predicate: { termType: P.any } }, triple => {
          const quad = this.factory.quad(
            this.processTerm(triple.subject),
            this.processTerm(triple.predicate),
            this.processTerm(triple.object),
          )
          if (previousQuads.has(quad)) return

          previousQuads.add(quad)
          acc.push(triple)
        })
        .exhaustive()

      return acc
    }, [])

    return {
      ...bgp,
      triples,
    }
  }
}
