import prefixes, { shrink } from '@zazuko/prefixes'
import type { IriTerm } from 'sparqljs'
import type { DataFactory } from '@rdfjs/types'
import { Processor } from './index.js'

/**
 * Finds all known namespaces used in a query and extracts them into prefix declarations.
 */
export class PrefixExtractor extends Processor {
  private prefixes?: Record<string, string>

  constructor(factory: DataFactory, private knownPrefixes: Record<string, string> = prefixes) {
    super(factory)
  }

  process(query) {
    let root: boolean
    if (!this.prefixes) {
      root = true
      this.prefixes = {}
    }

    const processed = super.processQuery(query)

    if (root) {
      processed.prefixes = this.prefixes
    }

    return processed
  }

  processIriTerm(term: IriTerm): IriTerm {
    const shrunk = shrink(term.value, this.knownPrefixes)
    if (shrunk) {
      const prefix = shrunk.split(':')[0]
      this.prefixes[prefix] = this.knownPrefixes[prefix]
    }

    return super.processIriTerm(term)
  }
}
