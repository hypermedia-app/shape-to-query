import { NamedNode, Variable } from 'rdf-js'
import $rdf from '@zazuko/env'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { FocusNode } from '../../lib/FocusNode.js'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { VariableSequence } from '../../lib/variableSequence.js'
import { NodeExpression, PatternBuilder } from '../nodeExpression/NodeExpression.js'

interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
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
    const { patterns } = builder.build(this.nodeExpression, { subject: focusNode, object: objectNode, variable, rootPatterns })
    let whereClause: SparqlTemplateResult
    if ('build' in patterns) {
      whereClause = sparql`${patterns.WHERE`${rootPatterns}`}`
    } else {
      whereClause = sparql`{ ${rootPatterns}\n${patterns} }`
    }

    const constructClause = !this.options.inverse
      ? [$rdf.quad(focusNode, this.path, objectNode)]
      : [$rdf.quad(objectNode, this.path, focusNode)]

    return {
      constructClause,
      whereClause,
    }
  }
}
