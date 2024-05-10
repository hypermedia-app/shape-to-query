import type { NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { CONSTRUCT, DELETE, WITH } from '@tpluscode/sparql-builder'
import { shapeToPatterns, Options } from './shapeToPatterns.js'

export function constructQuery(shape: GraphPointer, options: Options = {}) {
  const patterns = shapeToPatterns(shape, options)

  return CONSTRUCT`
    ${patterns.constructClause}
  `.WHERE`
    ${patterns.whereClause}
  `
}

interface DeleteOptions extends Options {
  graph?: NamedNode | string
}

export function deleteQuery(shape: GraphPointer, options: DeleteOptions = {}) {
  const patterns = shapeToPatterns(shape, options)

  const query = DELETE`
    ${patterns.constructClause}
  `.WHERE`
    ${patterns.whereClause}
  `

  if (options.graph) {
    return WITH(options.graph, query)
  }

  return query
}
