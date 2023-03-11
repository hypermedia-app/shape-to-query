import { Variable } from 'rdf-js'
import { SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { FocusNode } from '../../lib/FocusNode'
import { VariableSequence } from '../../lib/variableSequence'
import { ConstantTermExpression } from './ConstantTermExpression'
import { FocusNodeExpression } from './FocusNodeExpression'
import { PathExpression } from './PathExpression'

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
]

export const fromNode: NodeExpressionFactory = (pointer: GraphPointer): NodeExpression => {
  const match = nodeExpressions.filter(Class => Class.match(pointer)).shift()
  if (match) {
    return match.fromPointer(pointer, fromNode)
  }

  throw new Error('Unsupported node expression')
}
