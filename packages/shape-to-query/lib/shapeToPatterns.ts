import type { NamedNode, Variable } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import rdf from '@zazuko/env/web.js'
import type sparqljs from 'sparqljs'
import type { Processor } from '@hydrofoil/sparql-processor'
import type { ModelFactoryOptions } from '../model/ModelFactory.js'
import ModelFactory from '../model/ModelFactory.js'
import type { NodeShape } from '../model/NodeShape.js'
import type { ShapePatterns } from './shapePatterns.js'
import { flatten, union } from './shapePatterns.js'
import type { VariableSequence } from './variableSequence.js'
import { createVariableSequence } from './variableSequence.js'
import type { FocusNode } from './FocusNode.js'

export interface Options extends ModelFactoryOptions {
  focusNode?: NamedNode
  subjectVariable?: string
  objectVariablePrefix?: string
  optimizers?: Processor[]
}

export function shapeToPatterns(shape: GraphPointer, options: Options = {}): ShapePatterns {
  const factory = new ModelFactory(options)
  const nodeShape = factory.nodeShape(shape)
  const variable = createVariableSequence(options.objectVariablePrefix || 'resource')
  const focusNode = options.focusNode || variable()

  const { patterns, constraints } = buildNodeShape({ nodeShape, variable, focusNode })

  if (patterns.childPatterns && patterns.childPatterns.length) {
    const subQueries = flattenChildPatterns(patterns)

    return union(toSubquery()(patterns), ...[...subQueries].map(toSubquery(constraints.whereClause)))
  }

  return patterns
}

function * flattenChildPatterns(patterns: ShapePatterns) {
  for (const child of patterns.childPatterns) {
    yield child

    if (child.childPatterns && child.childPatterns.length) {
      yield * flattenChildPatterns(child)
    }
  }
}

function toSubquery(constraints: sparqljs.Pattern[] = []) {
  return (patterns: ShapePatterns) : ShapePatterns => {
    const variables = rdf.termSet(patterns.constructClause
      .flatMap(quad => [quad.subject, quad.predicate, quad.object])
      .filter((term): term is Variable => term.termType === 'Variable'))

    return {
      constructClause: patterns.constructClause,
      whereClause: [{
        type: 'group',
        patterns: [{
          type: 'query',
          queryType: 'SELECT',
          prefixes: {},
          variables: [...variables],
          where: [
            ...patterns.whereClause,
            ...constraints,
          ],
        }],
      }],
    }
  }
}

function buildNodeShape({ nodeShape, variable, focusNode }: { nodeShape: NodeShape; variable: VariableSequence ; focusNode: FocusNode }) {
  const properties = nodeShape.buildPatterns({
    focusNode,
    variable,
    rootPatterns: [],
  })

  const constraints = {
    constructClause: [],
    whereClause: nodeShape.buildConstraints({
      focusNode,
      valueNode: variable(),
      variable,
      rootPatterns: [],
    }),
  }

  return {
    patterns: flatten(properties, constraints),
    constraints,
  }
}
