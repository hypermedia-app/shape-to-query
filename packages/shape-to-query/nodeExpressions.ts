import { GraphPointer } from 'clownface'
import { ConstantTermExpression } from './model/nodeExpression/ConstantTermExpression'
import { FocusNodeExpression } from './model/nodeExpression/FocusNodeExpression'
import { PathExpression } from './model/nodeExpression/PathExpression'
import { FilterShapeExpression } from './model/nodeExpression/FilterShapeExpression'
import { OffsetExpression } from './model/nodeExpression/OffsetExpression'
import { OrderByExpression } from './model/nodeExpression/OrderByExpression'
import { CountExpression } from './model/nodeExpression/CountExpression'
import { LimitExpression } from './model/nodeExpression/LimitExpression'
import { NodeExpressionFactory, NodeExpressionStatic } from './model/nodeExpression'
import { NodeExpression } from './model/nodeExpression/NodeExpression'

export { NodeExpression, Parameters as NodeExpressionParameters } from './model/nodeExpression/NodeExpression'
export { NodeExpressionFactory } from './model/nodeExpression/index'

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
