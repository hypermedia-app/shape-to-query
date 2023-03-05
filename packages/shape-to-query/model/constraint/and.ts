import { GraphPointer } from 'clownface'
import { flatten, ShapePatterns } from '../../lib/shapePatterns'
import { NodeShape } from '../NodeShape'
import { fromNode } from '../fromNode'
import { ConstraintComponent, Parameters } from './ConstraintComponent'

export class AndConstraintComponent implements ConstraintComponent {
  constructor(public readonly inner: ReadonlyArray<NodeShape>) {
  }

  static fromPointer(parameter: GraphPointer) {
    const list = parameter.list()
    if (!list) {
      throw new Error('sh:and must be a list')
    }
    const inner = [...list].map(fromNode)
    return new AndConstraintComponent(inner)
  }

  buildPatterns(arg: Parameters): ShapePatterns {
    return flatten(...this.inner.map(inner => inner.buildPatterns(arg)))
  }
}
