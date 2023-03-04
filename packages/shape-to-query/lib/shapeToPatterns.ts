import { NamedNode } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { fromNode } from '../model/fromNode'
import { ShapePatterns } from './shapePatterns'
import { createVariableSequence } from './variableSequence'

export interface Options {
  focusNode?: NamedNode
  subjectVariable?: string
  objectVariablePrefix?: string
}

export function shapeToPatterns(shape: GraphPointer, options: Options = {}): ShapePatterns {
  const nodeShape = fromNode(shape)
  const variable = createVariableSequence(options.objectVariablePrefix || 'resource')

  return nodeShape.buildPatterns({
    focusNode: options.focusNode || variable(),
    variable,
  })
}
