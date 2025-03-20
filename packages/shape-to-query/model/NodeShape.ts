import type { Variable } from '@rdfjs/types'
import type sparqljs from 'sparqljs'
import type { ShapePatterns } from '../lib/shapePatterns.js'
import { emptyPatterns, flatten, union } from '../lib/shapePatterns.js'
import type { FocusNode } from '../lib/FocusNode.js'
import type { PropertyShape } from './PropertyShape.js'
import type { Target } from './target/index.js'
import type { ConstraintComponent } from './constraint/ConstraintComponent.js'
import type { BuildParameters } from './Shape.js'
import Shape from './Shape.js'
import * as Rule from './rule/Rule.js'

export interface NodeShape {
  properties: ReadonlyArray<PropertyShape>
  buildPatterns(arg: BuildParameters): ShapePatterns
  buildConstraints(arg: BuildParameters & { valueNode: Variable; parentNode?: FocusNode }): sparqljs.Pattern[]
}

export default class extends Shape implements NodeShape {
  constructor(
    public readonly targets: ReadonlyArray<Target>,
    public readonly properties: ReadonlyArray<PropertyShape>,
    constraints: ReadonlyArray<ConstraintComponent>,
    public readonly rules: ReadonlyArray<Rule.Rule>,
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

    const rootPatterns: sparqljs.Pattern[] = [...arg.rootPatterns, ...targets.whereClause]
    let properties: ShapePatterns = emptyPatterns
    if (this.properties.length) {
      properties = this.properties.reduce(Rule.union({ ...arg, focusNode, rootPatterns }), emptyPatterns)
    }
    let rules = emptyPatterns
    if (this.rules.length) {
      rules = this.rules.reduce(Rule.union({ ...arg, focusNode, rootPatterns }), emptyPatterns)
    }

    const logical = this.buildLogicalConstraints({ ...arg, focusNode, rootPatterns })

    return flatten(targets, union(properties, rules), logical)
  }

  buildConstraints(arg: BuildParameters & { valueNode: Variable }): sparqljs.Pattern[] {
    return this.constraints.flatMap(c => c.buildPatterns(arg))
  }
}
