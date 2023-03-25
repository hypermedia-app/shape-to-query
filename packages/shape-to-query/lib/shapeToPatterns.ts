import { NamedNode } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { sparql } from '@tpluscode/sparql-builder'
import { fromNode } from '../model/fromNode'
import { flatten, ShapePatterns } from './shapePatterns'
import { createVariableSequence } from './variableSequence'

export interface Options {
  focusNode?: NamedNode
  subjectVariable?: string
  objectVariablePrefix?: string
}

export function shapeToPatterns(shape: GraphPointer, options: Options = {}): ShapePatterns {
  const nodeShape = fromNode(shape)
  const variable = createVariableSequence(options.objectVariablePrefix || 'resource')
  const focusNode = options.focusNode || variable()

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

  return flatten(properties, constraints)
}
