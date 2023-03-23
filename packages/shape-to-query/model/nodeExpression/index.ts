import { Variable } from 'rdf-js'
import { SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { FocusNode } from '../../lib/FocusNode.js'
import { VariableSequence } from '../../lib/variableSequence.js'
import { ConstantTermExpression } from './ConstantTermExpression.js'
import { FocusNodeExpression } from './FocusNodeExpression.js'
import { PathExpression } from './PathExpression.js'
import { FilterShapeExpression } from './FilterShapeExpression.js'

export interface Parameters {
  subject: FocusNode
  object: Variable
  variable: VariableSequence
}

export interface NodeExpression {
  buildPatterns(arg: Parameters): SparqlTemplateResult
}

export interface NodeExpressionFactory {
  (pointer: GraphPointer): NodeExpression
}

interface NodeExpressionStatic {
  match(pointer: GraphPointer): boolean
  fromPointer(pointer: GraphPointer, factory: NodeExpressionFactory): NodeExpression
}

export const nodeExpressions: NodeExpressionStatic[] = [
  ConstantTermExpression,
  FocusNodeExpression,
  PathExpression,
  FilterShapeExpression,
]

export const fromNode: NodeExpressionFactory = (pointer: GraphPointer): NodeExpression => {
  const match = nodeExpressions.filter(Class => Class.match(pointer)).shift()
  if (match) {
    return match.fromPointer(pointer, fromNode)
  }

  throw new Error('Unsupported node expression')
}
