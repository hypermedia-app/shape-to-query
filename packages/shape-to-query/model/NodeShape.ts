import { Variable } from 'rdf-js'
import { isResource } from 'is-graph-pointer'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
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
  buildConstraints(arg: Parameters & { valueNode: Variable }): SparqlTemplateResult
}

export default class implements NodeShape {
  constructor(
    public readonly targets: ReadonlyArray<Target>,
    public readonly properties: ReadonlyArray<PropertyShape>,
    public readonly constraints: ReadonlyArray<ConstraintComponent>,
  ) {
  }

  buildPatterns(arg: Parameters): ShapePatterns {
    let targets: ShapePatterns = emptyPatterns
    if (arg.focusNode.termType === 'Variable') {
      targets = union(...this.targets.flatMap(target => target.buildPatterns(<any>arg)))
    }
    if (this.targets.length === 1 && this.targets[0] instanceof TargetNode) {
      const [target] = this.targets
      if (isResource(target.nodes)) {
        targets = emptyPatterns
      }
    }

    const properties = union(...this.properties.map(p => p.buildPatterns(arg)))

    return flatten(targets, properties)
  }

  buildConstraints(arg: Parameters & { valueNode: Variable }): SparqlTemplateResult {
    return sparql`${this.constraints.map(c => c.buildPatterns(arg))}`
  }
}
