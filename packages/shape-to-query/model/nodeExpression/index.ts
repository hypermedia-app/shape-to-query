import { Variable } from 'rdf-js'
import { SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { GraphPointer } from 'clownface'
import { FocusNode } from '../../lib/FocusNode'
import { ConstantTermExpression } from './ConstantTermExpression'
import { FocusNodeExpression } from './FocusNodeExpression'

export interface Parameters {
  subject: FocusNode
  object: Variable
}

export interface NodeExpression {
  buildPatterns(arg: Parameters): SparqlTemplateResult
}

interface NodeExpressionStatic {
  match(pointer: GraphPointer): boolean
  new(pointer: GraphPointer): NodeExpression
}

export const nodeExpressions: NodeExpressionStatic[] = [
  ConstantTermExpression,
  FocusNodeExpression,
]

export function fromNode(pointer: GraphPointer): NodeExpression {
  const Match = nodeExpressions.filter(Class => Class.match(pointer)).shift()
  if (Match) {
    return new Match(pointer)
  }

  throw new Error('Unsupported node expression')
}
