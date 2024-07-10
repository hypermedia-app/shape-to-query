import type { AnyPointer, GraphPointer } from 'clownface'
import type { ModelFactory } from '../ModelFactory.js'
import type { NodeExpression } from './NodeExpression.js'

export interface NodeExpressionFactory {
  (pointer: AnyPointer): NodeExpression
}

export interface NodeExpressionStatic {
  match(pointer: GraphPointer): boolean
  fromPointer(pointer: GraphPointer, factory: ModelFactory): NodeExpression
}
