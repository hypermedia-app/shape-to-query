import { Variable } from 'rdf-js'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { emptyPatterns, flatten, ShapePatterns, union } from '../lib/shapePatterns.js'
import { PropertyShape } from './PropertyShape.js'
import { Target } from './target'
import { ConstraintComponent } from './constraint/ConstraintComponent.js'
import Shape, { BuildParameters } from './Shape.js'

export interface NodeShape {
  buildPatterns(arg: BuildParameters): ShapePatterns
  buildConstraints(arg: BuildParameters & { valueNode: Variable }): string | SparqlTemplateResult
}

export default class extends Shape implements NodeShape {
  constructor(
    public readonly targets: ReadonlyArray<Target>,
    public readonly properties: ReadonlyArray<PropertyShape>,
    constraints: ReadonlyArray<ConstraintComponent>,
  ) {
    super(constraints)
  }

  buildPatterns(arg: BuildParameters): ShapePatterns {
    let targets: ShapePatterns = emptyPatterns
    if (arg.focusNode.termType === 'Variable') {
      targets = union(...this.targets.flatMap(target => target.buildPatterns(<any>arg)))
    }

    let properties: ShapePatterns = emptyPatterns
    if (this.properties.length) {
      properties = union(...this.properties.map(p => p.buildPatterns(arg)))
    }

    const logical = this.buildLogicalConstraints(arg)

    return flatten(targets, properties, logical)
  }

  buildConstraints(arg: BuildParameters & { valueNode: Variable }): string | SparqlTemplateResult {
    const constraints = this.constraints.map(c => c.buildPatterns(arg)).filter(Boolean)
    if (constraints.length === 0) {
      return ''
    }

    return sparql`${constraints}`
  }
}
