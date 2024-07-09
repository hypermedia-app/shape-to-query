import type { NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import sparqljs from 'sparqljs'
import rdf from '@zazuko/env/web.js'
import { DuplicatePatternRemover } from '@hydrofoil/sparql-processor/DuplicatePatternRemover.js'
import { PrefixExtractor } from '@hydrofoil/sparql-processor/PrefixExtractor.js'
import type { Processor } from '@hydrofoil/sparql-processor'
import type { Options } from './shapeToPatterns.js'
import { shapeToPatterns } from './shapeToPatterns.js'

const generator = new sparqljs.Generator()

const defaultOptimizers = (): Processor[] => [
  new DuplicatePatternRemover(rdf),
  new PrefixExtractor(rdf),
]

export function constructQuery(shape: GraphPointer, options: Options = { optimizers: [] }) {
  const patterns = shapeToPatterns(shape, options)

  return optimizeAndStringify({
    type: 'query',
    queryType: 'CONSTRUCT',
    where: patterns.whereClause,
    prefixes: {},
    template: patterns.constructClause as sparqljs.Triple[],
  }, options.optimizers)
}

interface DeleteOptions extends Options {
  graph?: NamedNode | string
}

export function deleteQuery(shape: GraphPointer, options: DeleteOptions = { optimizers: [] }) {
  const patterns = shapeToPatterns(shape, options)

  const graph: sparqljs.GraphOrDefault = {
    default: !!options.graph,
    type: 'graph',
  }
  if (options.graph) {
    if (typeof options.graph === 'string') {
      graph.name = rdf.namedNode(options.graph)
    } else {
      graph.name = options.graph
    }
  }

  return optimizeAndStringify({
    type: 'update',
    updates: [{
      updateType: 'insertdelete',
      delete: [{
        type: 'bgp',
        triples: patterns.constructClause as sparqljs.Triple[],
      }],
      where: patterns.whereClause,
      graph,
    }],
    prefixes: {},
  }, options.optimizers)
}

function optimizeAndStringify(query: sparqljs.SparqlQuery, optimizers: Processor[]) {
  return generator.stringify([...optimizers, ...defaultOptimizers()]
    .reduce((query, optimizer) => optimizer.optimize(query), query))
}
