import type { MultiPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'
import { isNamedNode } from 'is-graph-pointer'
import type { ShapePatterns } from '../../lib/shapePatterns.js'
import type { FocusNode } from '../../lib/FocusNode.js'
import type { Target, Parameters } from './Target.js'

export class TargetNode implements Target {
  static readonly property = sh.targetNode

  constructor(public readonly nodes: MultiPointer<FocusNode>) {
  }

  buildPatterns({ focusNode: { value } }: Parameters): ShapePatterns {
    const targetNodes = this.nodes
      .filter(isNamedNode)
      .map(({ term }) => ({ ['?' + value]: term }))
    return {
      constructClause: [],
      whereClause: [{
        type: 'values',
        values: targetNodes,
      }],
    }
  }
}
