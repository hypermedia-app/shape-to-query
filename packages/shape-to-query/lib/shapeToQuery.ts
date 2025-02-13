import type { NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import sparqljs from 'sparqljs'
import rdf from '@zazuko/env/web.js'
import { DuplicatePatternRemover } from '@hydrofoil/sparql-processor/DuplicatePatternRemover.js'
import { PrefixExtractor } from '@hydrofoil/sparql-processor/PrefixExtractor.js'
import type { Processor } from '@hydrofoil/sparql-processor'
import type { Options } from './shapeToPatterns.js'
import { shapeToPatterns } from './shapeToPatterns.js'
import { UnionRepeatedPatternsRemover } from './optimizer/UnionRepeatedPatternsRemover.js'
import { BlankNodeScopeFixer } from './optimizer/BlankNodeScopeFixer.js'

const generator = new sparqljs.Generator()

const defaultOptimizers = (env = rdf): Processor[] => [
  new DuplicatePatternRemover(env),
  new UnionRepeatedPatternsRemover(env),
  new BlankNodeScopeFixer(env),
]

const optimizersWithPrefixes = (env = rdf) => [
  ...defaultOptimizers(env),
  new PrefixExtractor(env),
]

export function constructQuery(shape: GraphPointer, { optimizers = [], extractPrefixes, ...options }: Options = { }) {
  const patterns = shapeToPatterns(shape, options)

  return optimizeAndStringify({
    type: 'query',
    queryType: 'CONSTRUCT',
    where: patterns.whereClause,
    prefixes: {},
    template: patterns.constructClause as sparqljs.Triple[],
  }, optimizers, {
    extractPrefixes,
  })
}

interface DeleteOptions extends Options {
  graph?: NamedNode | string
}

export function deleteQuery(shape: GraphPointer, { optimizers = [], extractPrefixes, ...options }: DeleteOptions = { }) {
  const patterns = shapeToPatterns(shape, options)

  let graph: NamedNode | undefined
  if (options.graph) {
    if (typeof options.graph === 'string') {
      graph = rdf.namedNode(options.graph)
    } else {
      graph = options.graph
    }
  }

  return optimizeAndStringify({
    type: 'update',
    updates: [{
      updateType: 'insertdelete',
      insert: [],
      delete: [{
        type: 'bgp',
        triples: patterns.constructClause as sparqljs.Triple[],
      }],
      where: patterns.whereClause,
      graph,
    }],
    prefixes: {},
  }, optimizers, {
    extractPrefixes,
  })
}

function optimizeAndStringify(query: sparqljs.SparqlQuery, optimizers: Processor[], { extractPrefixes = true }) {
  const allOptimisers: Processor[] = [
    ...optimizers,
    ...(extractPrefixes ? optimizersWithPrefixes() : defaultOptimizers()),
  ]

  return generator.stringify(allOptimisers
    .reduce((query, optimizer) => optimizer.process(query), query))
}
