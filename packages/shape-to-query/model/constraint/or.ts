import { GraphPointer } from 'clownface'
import { union, ShapePatterns } from '../../lib/shapePatterns'
import { NodeShape } from '../NodeShape'
import { fromNode } from '../fromNode'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class OrConstraintComponent implements ConstraintComponent {
  constructor(public readonly inner: ReadonlyArray<NodeShape>) {
  }

  static fromPointer(parameter: GraphPointer) {
    const list = parameter.list()
    if (!list) {
      throw new Error('sh:or must be a list')
    }
    const inner = [...list].map(fromNode)
    return new OrConstraintComponent(inner)
  }

  buildPatterns(arg: Parameters): ShapePatterns {
    return union(...this.inner.map(inner => inner.buildPatterns(arg)))
  }
}
