import { GraphPointer } from 'clownface'
import { ConstantTermExpression } from './ConstantTermExpression'
import { FocusNodeExpression } from './FocusNodeExpression'
import { PathExpression } from './PathExpression'
import { FilterShapeExpression } from './FilterShapeExpression'
import { LimitExpression } from './LimitExpression'
import { OffsetExpression } from './OffsetExpression'
import { NodeExpression } from './NodeExpression'
import { OrderByExpression } from './OrderByExpression'

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
  LimitExpression,
  OffsetExpression,
  OrderByExpression,
]

export const fromNode: NodeExpressionFactory = (pointer: GraphPointer): NodeExpression => {
  const match = nodeExpressions.filter(Class => Class.match(pointer)).shift()
  if (match) {
    return match.fromPointer(pointer, fromNode)
  }

  throw new Error('Unsupported node expression')
}
