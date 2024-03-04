import { NamedNode } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { SELECT, sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import rdf from '@zazuko/env'
import ModelFactory, { ModelFactoryOptions } from '../model/ModelFactory.js'
import { NodeShape } from '../model/NodeShape.js'
import { flatten, ShapePatterns, union } from './shapePatterns.js'
import { createVariableSequence, VariableSequence } from './variableSequence.js'
import { FocusNode } from './FocusNode.js'

export interface Options extends ModelFactoryOptions {
  focusNode?: NamedNode
  subjectVariable?: string
  objectVariablePrefix?: string
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

function toSubquery(constraints: string | SparqlTemplateResult = '') {
  return (patterns: ShapePatterns) : ShapePatterns => {
    const variables = rdf.termSet(patterns.constructClause
      .flatMap(quad => [quad.subject, quad.predicate, quad.object])
      .filter(term => term.termType === 'Variable'))

    return {
      constructClause: patterns.constructClause,
      whereClause: sparql`${SELECT`${[...variables]}`.WHERE`${patterns.whereClause}`.WHERE`${constraints}`}`,
    }
  }
}

function buildNodeShape({ nodeShape, variable, focusNode }: { nodeShape: NodeShape; variable: VariableSequence ; focusNode: FocusNode }) {
  const properties = nodeShape.buildPatterns({
    focusNode,
    variable,
    rootPatterns: sparql``,
  })

  const constraints = {
    constructClause: [],
    whereClause: nodeShape.buildConstraints({
      focusNode,
      valueNode: variable(),
      variable,
      rootPatterns: sparql``,
    }),
  }

  return {
    patterns: flatten(properties, constraints),
    constraints,
  }
}
