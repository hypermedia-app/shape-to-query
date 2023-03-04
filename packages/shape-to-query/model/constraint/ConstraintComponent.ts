import { ShapePatterns } from '../../lib/shapePatterns'
import { VariableSequence } from '../../lib/variableSequence'
import { FocusNode } from '../../lib/FocusNode'

export interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
}

export interface ConstraintComponent {
  buildPatterns(arg: Parameters): ShapePatterns
}
