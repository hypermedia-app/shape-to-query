import { GraphPointer } from 'clownface'
import { ConstantTermExpression } from './model/nodeExpression/ConstantTermExpression.js'
import { FocusNodeExpression } from './model/nodeExpression/FocusNodeExpression.js'
import { PathExpression } from './model/nodeExpression/PathExpression.js'
import { FilterShapeExpression } from './model/nodeExpression/FilterShapeExpression.js'
import { OffsetExpression } from './model/nodeExpression/OffsetExpression.js'
import { OrderByExpression } from './model/nodeExpression/OrderByExpression.js'
import { CountExpression } from './model/nodeExpression/CountExpression.js'
import { LimitExpression } from './model/nodeExpression/LimitExpression.js'
import { NodeExpressionFactory, NodeExpressionStatic } from './model/nodeExpression/index.js'
import { NodeExpression } from './model/nodeExpression/NodeExpression.js'

export type { NodeExpression, Parameters as NodeExpressionParameters } from './model/nodeExpression/NodeExpression.js'
export type { NodeExpressionFactory } from './model/nodeExpression/index.js'

export {
  ConstantTermExpression,
  FocusNodeExpression,
  PathExpression,
  FilterShapeExpression,
  LimitExpression,
  OffsetExpression,
  OrderByExpression,
  CountExpression,
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
