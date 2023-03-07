import { Variable } from 'rdf-js'
import { isResource } from 'is-graph-pointer'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { FocusNode } from '../lib/FocusNode'
import { emptyPatterns, flatten, ShapePatterns, union } from '../lib/shapePatterns'
import { VariableSequence } from '../lib/variableSequence'
import { PropertyShape } from './PropertyShape'
import { Target, TargetNode } from './target'
import { ConstraintComponent } from './constraint/ConstraintComponent'
import { OrConstraintComponent } from './constraint/or'

interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
}

export interface NodeShape {
  buildPatterns(arg: Parameters): ShapePatterns
  buildConstraints(arg: Parameters & { valueNode: Variable }): string | SparqlTemplateResult
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
    if (arg.focusNode.termType === 'Variable') {
      targets = union(...this.targets.flatMap(target => target.buildPatterns(<any>{ focusNode, variable })))
    }
    if (this.targets.length === 1 && this.targets[0] instanceof TargetNode) {
      const [target] = this.targets
      if (isResource(target.nodes)) {
        targets = emptyPatterns
        focusNode = target.nodes.term
      }
    }

    const properties = union(...this.properties.map(p => p.buildPatterns({ focusNode, variable })))
    const logical = union(
      ...this.constraints
        .filter((l): l is OrConstraintComponent => l instanceof OrConstraintComponent)
        .flatMap(l => l.inner.map(i => i.buildPatterns({ focusNode, variable }))),
    )

    return flatten(targets, properties, logical)
  }

  buildConstraints(arg: Parameters & { valueNode: Variable }): string | SparqlTemplateResult {
    const constraints = this.constraints.map(c => c.buildPatterns(arg)).filter(Boolean)
    if (constraints.length === 0) {
      return ''
    }

    return sparql`${constraints}`
  }
}
