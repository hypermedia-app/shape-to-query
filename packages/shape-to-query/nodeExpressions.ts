import { AnyPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
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
import { FunctionExpression } from './model/nodeExpression/FunctionExpression.js'

export type { NodeExpression, Parameters } from './model/nodeExpression/NodeExpression.js'
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
  FunctionExpression,
]

export const fromNode: NodeExpressionFactory = (pointer: AnyPointer): NodeExpression => {
  if (!isGraphPointer(pointer)) {
    throw new Error('Expression must be a single RDF node')
  }

  const match = nodeExpressions.filter(Class => Class.match(pointer)).shift()
  if (match) {
    return match.fromPointer(pointer, fromNode)
  }

  throw new Error('Unsupported node expression')
}
