import { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'
import { ModelFactory } from '../ModelFactory.js'
import { NodeShape } from '../NodeShape.js'
import { ConstraintComponent, Parameters } from './ConstraintComponent.js'

export class NodeConstraintComponent extends ConstraintComponent {
  constructor(public readonly shape: NodeShape) {
    super(sh.NodeConstraintComponent)
  }

  static fromShape(shape: GraphPointer, factory: ModelFactory) {
    return shape.out(sh.node)
      .map(node => new NodeConstraintComponent(factory.nodeShape(node)))
  }

  buildPatterns({ valueNode, variable, ...arg }: Parameters) {
    return this.shape.buildConstraints({
      ...arg,
      variable,
      focusNode: valueNode,
      valueNode: variable(),
    })
  }
}
