import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import { ModelFactory } from '../ModelFactory.js'
import { NodeShape } from '../NodeShape.js'
import ConstraintComponent, { assertTerm, Parameters, PropertyShape } from './ConstraintComponent.js'

export class NodeConstraintComponent extends ConstraintComponent {
  constructor(public readonly shape: NodeShape) {
    super(sh.NodeConstraintComponent)
  }

  static * fromShape(shape: PropertyShape, factory: ModelFactory) {
    const nodes = shape.get(sh.node) || []
    for (const node of nodes) {
      assertTerm(node)
      yield new NodeConstraintComponent(factory.nodeShape(node.pointer))
    }
  }

  buildPropertyShapePatterns({ valueNode, variable, ...arg }: Parameters) {
    const patterns = this.shape.buildConstraints({
      ...arg,
      variable,
      focusNode: valueNode,
      valueNode: variable(),
    })

    if (patterns.toString().trim() === '') {
      return patterns
    }

    return sparql`{ ${patterns} }`
  }
}
