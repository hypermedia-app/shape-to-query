import { NamedNode, Variable } from 'rdf-js'
import $rdf from 'rdf-ext'
import { FocusNode } from '../lib/FocusNode'
import { ShapePatterns } from '../lib/shapePatterns'
import { NodeExpression } from './nodeExpression'

interface Parameters {
  focusNode: FocusNode
  objectNode: Variable
}

export interface Rule {
  buildPatterns(arg: Parameters): ShapePatterns
}

export class PropertyValueRule implements Rule {
  constructor(public readonly path: NamedNode, public readonly nodeExpression: NodeExpression) {
  }

  buildPatterns({ focusNode, objectNode }: Parameters): ShapePatterns {
    return {
      constructClause: [$rdf.quad(focusNode, this.path, objectNode)],
      whereClause: this.nodeExpression.buildPatterns({ subject: focusNode, object: objectNode }),
    }
  }
}
