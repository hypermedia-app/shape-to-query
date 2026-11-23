import type { Literal, NamedNode } from '@rdfjs/types'
import { sh, xsd } from '@tpluscode/rdf-ns-builders'
import { fromRdf } from 'rdf-literal'
import type sparqljs from 'sparqljs'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent from './ConstraintComponent.js'

interface Bound {
  literal: Literal
  count: number
}

export class CardinalityConstraintComponent extends ConstraintComponent {
  static fromShape(shape: PropertyShape): CardinalityConstraintComponent[] {
    const minimum = readBound(shape, sh.minCount)
    const maximum = readBound(shape, sh.maxCount)

    return minimum || maximum ? [new CardinalityConstraintComponent(minimum, maximum)] : []
  }

  private constructor(private readonly minimum?: Bound, private readonly maximum?: Bound) {
    super(minimum ? sh.MinCountConstraintComponent : sh.MaxCountConstraintComponent)
  }

  get allowsZeroValues(): boolean {
    return !this.minimum || this.minimum.count === 0
  }

  buildNodeShapePatterns(): sparqljs.Pattern[] {
    return []
  }

  buildPropertyShapePatterns(args: Parameters): sparqljs.Pattern[] {
    if (this.allowsZeroValues && !this.maximum) {
      return []
    }

    const presenceOnly = this.allowsZeroValues
      ? this.maximum.count === 0
      : this.minimum.count === 1 && !this.maximum
    const { focusNode, propertyPath, variable } = args
    const patterns: sparqljs.Pattern[] = presenceOnly
      ? [{
        type: 'bgp',
        triples: [{ subject: focusNode, predicate: propertyPath, object: variable() }],
      }]
      : [this.countQuery(args)]

    return [{
      type: 'filter',
      expression: {
        type: 'operation',
        operator: this.allowsZeroValues ? 'notexists' : 'exists',
        args: [{ type: 'group', patterns }],
      },
    }]
  }

  private countQuery({ focusNode, propertyPath, variable }: Parameters): sparqljs.SelectQuery {
    const countValue = variable()
    const count: sparqljs.AggregateExpression = {
      type: 'aggregate',
      aggregation: 'count',
      distinct: true,
      expression: countValue,
    }
    const bounds: sparqljs.Expression[] = []
    if (!this.allowsZeroValues) {
      bounds.push({ type: 'operation', operator: '>=', args: [count, this.minimum.literal] })
    }
    if (this.maximum) {
      const operator = this.allowsZeroValues ? '>' : '<='
      bounds.push({ type: 'operation', operator, args: [count, this.maximum.literal] })
    }
    const having: sparqljs.Expression = bounds.length === 2
      ? { type: 'operation', operator: '&&', args: bounds }
      : bounds[0]

    // Share the focus binding while counting values independently of any outer path match.
    return {
      type: 'query',
      queryType: 'SELECT',
      prefixes: {},
      variables: focusNode.termType === 'Variable'
        ? [focusNode]
        : [{ variable: variable(), expression: count }],
      group: focusNode.termType === 'Variable' ? [{ expression: focusNode }] : undefined,
      where: [{
        type: 'bgp',
        triples: [{ subject: focusNode, predicate: propertyPath, object: countValue }],
      }],
      having: [having],
    }
  }
}

function readBound(shape: PropertyShape, parameter: NamedNode): Bound | undefined {
  const values = shape.get(parameter)
  if (!values?.length) {
    return undefined
  }
  if (values.length > 1) {
    throw new Error(`${parameter.value} must have at most one value`)
  }

  const [value] = values
  if ('pointer' in value && value.pointer.term.termType === 'Literal') {
    const literal = value.pointer.term
    if (xsd.integer.equals(literal.datatype) && /^[+-]?\d+$/.test(literal.value)) {
      const count: number = fromRdf(literal)
      if (count >= 0) {
        return { count, literal }
      }
    }
  }
  throw new Error(`${parameter.value} must be a nonnegative xsd:integer literal`)
}
