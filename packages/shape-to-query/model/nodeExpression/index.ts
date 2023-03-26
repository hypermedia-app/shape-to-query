import { AnyPointer, GraphPointer } from 'clownface'
import { NodeExpression } from './NodeExpression.js'

export interface NodeExpressionFactory {
  (pointer: AnyPointer): NodeExpression
}

export interface NodeExpressionStatic {
  match(pointer: GraphPointer): boolean
  fromPointer(pointer: GraphPointer, factory: NodeExpressionFactory): NodeExpression
}
