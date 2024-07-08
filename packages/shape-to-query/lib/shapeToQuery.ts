import type { NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import sparqljs from 'sparqljs'
import prefixes from '@zazuko/prefixes'
import rdf from '@zazuko/env/web.js'
import { shapeToPatterns, Options } from './shapeToPatterns.js'

const generator = new sparqljs.Generator()

export function constructQuery(shape: GraphPointer, options: Options = {}) {
  const patterns = shapeToPatterns(shape, options)

  const query: sparqljs.ConstructQuery = {
    type: 'query',
    queryType: 'CONSTRUCT',
    where: patterns.whereClause,
    prefixes: {
      schema: prefixes.schema,
      rdfs: prefixes.rdfs,
      rdf: prefixes.rdf,
      xsd: prefixes.xsd,
      foaf: prefixes.foaf,
      hydra: prefixes.hydra,
    },
    template: patterns.constructClause as sparqljs.Triple[],
  }

  return generator.stringify(query)
}

interface DeleteOptions extends Options {
  graph?: NamedNode | string
}

export function deleteQuery(shape: GraphPointer, options: DeleteOptions = {}) {
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

  const update: sparqljs.Update = {
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
    prefixes: {
      schema: prefixes.schema,
      rdfs: prefixes.rdfs,
      rdf: prefixes.rdf,
      xsd: prefixes.xsd,
      foaf: prefixes.foaf,
      hydra: prefixes.hydra,
    },
  }

  return generator.stringify(update)
}
