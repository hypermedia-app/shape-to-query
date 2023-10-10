import { SparqlTemplateResult } from '@tpluscode/sparql-builder'
import type { GraphPointer } from 'clownface'
import { FocusNode } from '../../lib/FocusNode.js'
import { VariableSequence } from '../../lib/variableSequence.js'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { ModelFactory } from '../ModelFactory.js'

export interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
  rootPatterns: SparqlTemplateResult
}

export interface Rule {
  buildPatterns({ focusNode, variable, rootPatterns }: Parameters): ShapePatterns
}

export interface RuleStatic {
  matches(pointer: GraphPointer): boolean
  fromPointer(pointer: GraphPointer, factory: ModelFactory): Rule
}
