import { AnyPointer, GraphPointer } from 'clownface'
import { ModelFactory } from '../ModelFactory.js'
import { NodeExpression } from './NodeExpression.js'

export interface NodeExpressionFactory {
  (pointer: AnyPointer): NodeExpression
}

export interface NodeExpressionStatic {
  match(pointer: GraphPointer): boolean
  fromPointer(pointer: GraphPointer, factory: ModelFactory): NodeExpression
}
