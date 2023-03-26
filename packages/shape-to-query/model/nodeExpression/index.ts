import { GraphPointer } from 'clownface'
import { ConstantTermExpression } from './ConstantTermExpression.js'
import { FocusNodeExpression } from './FocusNodeExpression.js'
import { PathExpression } from './PathExpression.js'
import { FilterShapeExpression } from './FilterShapeExpression.js'
import { LimitExpression } from './LimitExpression.js'
import { OffsetExpression } from './OffsetExpression.js'
import { NodeExpression } from './NodeExpression.js'
import { OrderByExpression } from './OrderByExpression.js'
import { CountExpression } from './CountExpression.js'

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
  CountExpression,
]

export const fromNode: NodeExpressionFactory = (pointer: GraphPointer): NodeExpression => {
  const match = nodeExpressions.filter(Class => Class.match(pointer)).shift()
  if (match) {
    return match.fromPointer(pointer, fromNode)
  }

  throw new Error('Unsupported node expression')
}
