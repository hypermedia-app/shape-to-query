import { Variable } from 'rdf-js'
import { VariableSequence } from '../../lib/variableSequence'
import { ShapePatterns } from '../../lib/shapePatterns'

export interface Parameters {
  focusNode: Variable
  variable: VariableSequence
}

export abstract class Target {
  abstract buildPatterns(arg: Parameters): ShapePatterns
}
