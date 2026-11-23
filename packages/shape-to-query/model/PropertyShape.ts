import type { Variable } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import type { ShaclPropertyPath } from 'clownface-shacl-path'
import { fromNode, toAlgebra } from 'clownface-shacl-path'
import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import type { ShapePatterns } from '../lib/shapePatterns.js'
import { flatten, union } from '../lib/shapePatterns.js'
import PathVisitor from '../lib/PathVisitor.js'
import type { PropertyValueRule } from './rule/PropertyValueRule.js'
import type { ConstraintComponent, Parameters } from './constraint/ConstraintComponent.js'
import type { NodeConstraintComponent } from './constraint/node.js'
import type { BuildParameters } from './Shape.js'
import Shape from './Shape.js'
import { PatternBuilder } from './nodeExpression/NodeExpression.js'

interface Components {
  rules?: PropertyValueRule[]

  constraints?: ConstraintComponent[]
}

export interface PropertyShape extends Shape {
  readonly allowsMissingValues?: boolean
  buildPatterns(arg: BuildParameters): ShapePatterns
  buildConstraints(arg: BuildParameters): sparqljs.Pattern[]
}

export default class extends Shape implements PropertyShape {
  public readonly rules: ReadonlyArray<PropertyValueRule>
  public readonly path: ShaclPropertyPath

  constructor(private readonly _path: GraphPointer, { rules = [], constraints = [] }: Components = {}) {
    super(constraints)
    this.rules = rules
    this.path = fromNode(_path)
  }

  get allowsMissingValues(): boolean {
    return this.constraints.some(constraint => constraint.allowsZeroValues === true)
      && this.constraints.every(constraint => constraint.allowsZeroValues !== false)
  }

  buildPatterns({ focusNode, variable, rootPatterns }: BuildParameters): ShapePatterns {
    let pathEnd: Variable
    const visitor = new PathVisitor(variable)
    let patterns: ShapePatterns
    if (this.rules.length) {
      pathEnd = variable()
      const rulePatterns = this.rules.map(r => r.buildPatterns({
        focusNode,
        objectNode: pathEnd,
        variable,
        rootPatterns,
        builder: new PatternBuilder(),
      }))
      patterns = union(...rulePatterns)
    }
    else {
      pathEnd = variable.for(focusNode, this._path)
      patterns = visitor.visit(this.path, {
        pathStart: focusNode,
        pathEnd,
      })
    }

    const logical = this.buildLogicalConstraints({ focusNode, variable, rootPatterns })
    patterns = flatten(patterns, logical)

    const nodeContstrains = this.constraints
      .filter((c): c is NodeConstraintComponent => c.type.equals(sh.NodeConstraintComponent))
      .map((nodeConstraint) => {
        const result = nodeConstraint.shape.buildPatterns({
          focusNode: pathEnd,
          variable,
          rootPatterns: [...rootPatterns, ...patterns.whereClause],
        })

        const childConstraints = nodeConstraint.shape.buildConstraints({
          focusNode: pathEnd,
          variable,
          rootPatterns: [...rootPatterns, ...patterns.whereClause],
          valueNode: variable(),
        })

        return {
          childPatterns: {
            ...result,
            whereClause: [
              ...rootPatterns,
              ...patterns.whereClause,
              ...result.whereClause,
            ],
          },
          childConstraints,
        }
      })

    const childPatterns = nodeContstrains.map(c => c.childPatterns)
    return { ...patterns, childPatterns }
  }

  buildConstraints({ focusNode, variable, rootPatterns }: BuildParameters): sparqljs.Pattern[] {
    if (!this.constraints.length) {
      return []
    }

    const propertyPath = toAlgebra(this._path)
    const args = {
      focusNode,
      propertyPath,
      variable,
      rootPatterns,
    }
    if (this.constraints.some(constraint => constraint.allowsZeroValues !== undefined)) {
      return this.buildCardinalityConstraints({ ...args, valueNode: variable() })
    }

    const valueArgs = { ...args, valueNode: variable.for(focusNode, this._path) }
    const constraints = this.constraints.flatMap(c => c.buildPatterns(valueArgs))

    if (constraints.length === 0) {
      return []
    }

    return [pathPattern(valueArgs), ...constraints]
  }

  private buildCardinalityConstraints(args: Parameters): sparqljs.Pattern[] {
    const focusConstraints: sparqljs.Pattern[] = []
    const valueConstraints: sparqljs.Pattern[] = []
    for (const constraint of this.constraints) {
      const patterns = constraint.buildPatterns(args)
      if (constraint.allowsZeroValues !== undefined) {
        focusConstraints.push(...patterns)
      }
      else if (constraint.type.equals(sh.HasValueConstraintComponent)) {
        focusConstraints.push(existenceFilter('exists', [pathPattern(args), ...patterns]))
      }
      else {
        valueConstraints.push(...patterns)
      }
    }

    if (valueConstraints.length) {
      // A focus node conforms when every value passes, including when the path has no values.
      focusConstraints.push(existenceFilter('notexists', [
        pathPattern(args),
        existenceFilter('notexists', valueConstraints),
      ]))
    }

    return focusConstraints
  }
}

function pathPattern({ focusNode, propertyPath, valueNode }: Parameters): sparqljs.BgpPattern {
  return {
    type: 'bgp',
    triples: [{ subject: focusNode, predicate: propertyPath, object: valueNode }],
  }
}

function existenceFilter(operator: 'exists' | 'notexists', patterns: sparqljs.Pattern[]): sparqljs.FilterPattern {
  return {
    type: 'filter',
    expression: { type: 'operation', operator, args: [{ type: 'group', patterns }] },
  }
}
