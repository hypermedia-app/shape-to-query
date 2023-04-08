import { SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { FocusNode } from '../../lib/FocusNode.js'
import { VariableSequence } from '../../lib/variableSequence.js'
import { ShapePatterns } from '../../lib/shapePatterns.js'

export interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
}

export interface Rule {
  buildPatterns({ focusNode, variable, rootPatterns }: Parameters): ShapePatterns
}
