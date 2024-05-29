import type { NamedNode, Variable } from '@rdfjs/types'
import type { GraphPointer, MultiPointer } from 'clownface'
import { VariableSequence } from '../../lib/variableSequence.js'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { ModelFactory } from '../ModelFactory.js'

export interface Parameters {
  focusNode: Variable
  variable: VariableSequence
}

export interface Target {
  buildPatterns(arg: Parameters): ShapePatterns
}

export type TargetConstructor =
  ((new (nodes: MultiPointer, factory: ModelFactory) => Target) & { property: NamedNode })
  |
  ((new (nodes: GraphPointer, factory: ModelFactory) => Target) & { type: NamedNode })
