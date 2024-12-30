import type { NamedNode, Variable } from '@rdfjs/types'
import $rdf from '@zazuko/env/web.js'
import type sparqljs from 'sparqljs'
import type { FocusNode } from '../../lib/FocusNode.js'
import type { ShapePatterns } from '../../lib/shapePatterns.js'
import type { VariableSequence } from '../../lib/variableSequence.js'
import type { NodeExpression, PatternBuilder } from '../nodeExpression/NodeExpression.js'

interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
  rootPatterns: sparqljs.Pattern[]
  objectNode: Variable
  builder: PatternBuilder
}

export interface PropertyValueRule {
  buildPatterns({ focusNode, objectNode, variable, rootPatterns }: Parameters): ShapePatterns
}

export default class implements PropertyValueRule {
  constructor(public readonly path: NamedNode, public readonly nodeExpression: NodeExpression, public readonly options: { inverse?: boolean } = {}) {
  }

  buildPatterns({ focusNode, objectNode, variable, rootPatterns, builder }: Parameters): ShapePatterns {
    const { patterns, object, requiresFullContext } = builder.build(this.nodeExpression, { subject: focusNode, object: objectNode, variable, rootPatterns })
    let whereClause: sparqljs.Pattern[]
    if (patterns[0]?.type === 'query') {
      whereClause = [{
        type: 'group',
        patterns: [{
          ...patterns[0],
          where: [
            ...patterns[0].where,
            ...rootPatterns,
          ],
        }],
      }]
    } else {
      whereClause = patterns
      if (requiresFullContext) {
        whereClause = [...rootPatterns, ...patterns]
      }
    }

    const constructClause = !this.options.inverse
      ? [$rdf.quad(focusNode, this.path, object)]
      : [$rdf.quad(object, this.path, focusNode)]

    return {
      constructClause,
      whereClause,
    }
  }
}
