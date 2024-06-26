import type { Variable } from '@rdfjs/types'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { emptyPatterns, flatten, ShapePatterns, union } from '../lib/shapePatterns.js'
import { PropertyShape } from './PropertyShape.js'
import { Target } from './target/index.js'
import { ConstraintComponent } from './constraint/ConstraintComponent.js'
import Shape, { BuildParameters } from './Shape.js'
import { Rule } from './rule/Rule.js'

export interface NodeShape {
  properties: ReadonlyArray<PropertyShape>
  buildPatterns(arg: BuildParameters): ShapePatterns
  buildConstraints(arg: BuildParameters & { valueNode: Variable }): string | SparqlTemplateResult
}

export default class extends Shape implements NodeShape {
  constructor(
    public readonly targets: ReadonlyArray<Target>,
    public readonly properties: ReadonlyArray<PropertyShape>,
    constraints: ReadonlyArray<ConstraintComponent>,
    public readonly rules: ReadonlyArray<Rule>,
  ) {
    super(constraints)
  }

  buildPatterns({ focusNode, ...arg }: BuildParameters): ShapePatterns {
    let targets: ShapePatterns = emptyPatterns
    if (focusNode.termType === 'Variable') {
      targets = union(...this.targets.flatMap(target => target.buildPatterns({
        ...arg,
        focusNode,
      })))
    }

    const rootPatterns = sparql`${arg.rootPatterns}\n${targets.whereClause}`
    let properties: ShapePatterns = emptyPatterns
    if (this.properties.length) {
      properties = union(...this.properties.map(p => p.buildPatterns({
        ...arg,
        focusNode,
        rootPatterns,
      })))
    }
    let rules = emptyPatterns
    if (this.rules.length) {
      rules = union(...this.rules.map(r => r.buildPatterns({ ...arg, focusNode, rootPatterns })))
    }

    const logical = this.buildLogicalConstraints({ ...arg, focusNode, rootPatterns })

    return flatten(targets, union(properties, rules), logical)
  }

  buildConstraints(arg: BuildParameters & { valueNode: Variable }): string | SparqlTemplateResult {
    const constraints = this.constraints.map(c => c.buildPatterns(arg)).filter(Boolean)
    if (constraints.length === 0) {
      return ''
    }

    return sparql`${constraints}`
  }
}
