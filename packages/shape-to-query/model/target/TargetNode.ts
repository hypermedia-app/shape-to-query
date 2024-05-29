import type { MultiPointer } from 'clownface'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import { sparql } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { FocusNode } from '../../lib/FocusNode.js'
import { Target, Parameters } from './Target.js'

export class TargetNode implements Target {
  static readonly property = sh.targetNode

  constructor(public readonly nodes: MultiPointer<FocusNode>) {
  }

  buildPatterns({ focusNode: { value } }: Parameters): ShapePatterns {
    const targetNodes = this.nodes.map(({ term }) => ({ [value]: term }))
    return {
      constructClause: [],
      whereClause: sparql`${VALUES(...targetNodes)}`,
    }
  }
}
