import { isResource } from 'is-graph-pointer'
import { FocusNode } from '../lib/FocusNode'
import { emptyPatterns, flatten, ShapePatterns, union } from '../lib/shapePatterns'
import { VariableSequence } from '../lib/variableSequence'
import { PropertyShape } from './PropertyShape'
import { Target, TargetNode } from './target'
import { ConstraintComponent } from './constraint/ConstraintComponent'

interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
}

export interface NodeShape {
  buildPatterns(arg: Parameters): ShapePatterns
}

export default class implements NodeShape {
  constructor(
    public readonly targets: ReadonlyArray<Target>,
    public readonly properties: ReadonlyArray<PropertyShape>,
    public readonly constraints: ReadonlyArray<ConstraintComponent>,
  ) {
  }

  buildPatterns(arg: Parameters): ShapePatterns {
    let { focusNode, variable } = arg

    let targets: ShapePatterns = emptyPatterns
    if (focusNode.termType === 'Variable') {
      targets = union(...this.targets.flatMap(target => target.buildPatterns(<any>{ focusNode, variable })))
    }
    if (this.targets.length === 1 && this.targets[0] instanceof TargetNode) {
      const [target] = this.targets
      if (isResource(target.nodes)) {
        targets = emptyPatterns
        focusNode = target.nodes.term
      }
    }

    const constraints = union(...this.constraints.map(c => c.buildPatterns({ focusNode, variable })))
    const properties = union(...this.properties.map(p => p.buildPatterns({ focusNode, variable })))

    return flatten(targets, constraints, properties)
  }
}
