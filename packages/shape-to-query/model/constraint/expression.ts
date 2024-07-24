import { sh } from '@tpluscode/rdf-ns-builders'
import type sparqljs from 'sparqljs'
import type { NodeExpression } from '../nodeExpression/NodeExpression.js'
import { PatternBuilder } from '../nodeExpression/NodeExpression.js'
import type { ModelFactory } from '../ModelFactory.js'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent, { assertTerm } from './ConstraintComponent.js'

export class ExpressionConstraintComponent extends ConstraintComponent {
  static * fromShape(shape: PropertyShape, factory: ModelFactory) {
    const constraints = shape.get(sh.expression) || []

    for (const expression of constraints) {
      assertTerm(expression)
      yield new ExpressionConstraintComponent(factory.nodeExpression(expression.pointer))
    }
  }

  constructor(public readonly expression: NodeExpression) {
    super(sh.ExpressionConstraintComponent)
  }

  buildPropertyShapePatterns({ focusNode: subject, valueNode: object, rootPatterns, variable }: Parameters): sparqljs.Pattern[] {
    let patterns: sparqljs.Pattern[]
    let filter: sparqljs.Expression

    if ('buildInlineExpression' in this.expression) {
      ({ patterns, inline: filter } = this.expression.buildInlineExpression({ subject, object, rootPatterns, variable }, new PatternBuilder()))
      return [
        ...(Array.isArray(patterns) ? patterns : [patterns]),
        {
          type: 'filter',
          expression: filter,
        },
      ]
    }

    ({ patterns, object: filter } = this.expression.build({ subject, object, rootPatterns, variable }, new PatternBuilder()))

    if (subject.equals(object)) {
      return patterns
    }
    return [
      ...(Array.isArray(patterns) ? patterns : [patterns]),
      {
        type: 'filter',
        expression: filter,
      },
    ]
  }
}
