import { sparql } from '@tpluscode/sparql-builder'
import { UNION } from '@tpluscode/sparql-builder/expressions'
import { GraphPointer } from 'clownface'
import { ShapePatterns } from '../../lib/shapePatterns'
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
    const inner = this.inner.map(inner => inner.buildPatterns(arg))

    return {
      constructClause: inner.flatMap(i => i.constructClause),
      whereClause: sparql`${UNION(...inner.map(i => i.whereClause))}`,
    }
  }
}
