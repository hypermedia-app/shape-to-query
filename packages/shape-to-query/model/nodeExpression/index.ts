import { GraphPointer } from 'clownface'
import { NodeExpression } from './NodeExpression'

export interface NodeExpressionFactory {
  (pointer: GraphPointer): NodeExpression
}

export interface NodeExpressionStatic {
  match(pointer: GraphPointer): boolean
  fromPointer(pointer: GraphPointer, factory: NodeExpressionFactory): NodeExpression
}
