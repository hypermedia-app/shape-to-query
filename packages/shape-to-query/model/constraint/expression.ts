import { sh } from '@tpluscode/rdf-ns-builders'
import { Select, sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import type { SparqlValue } from '@tpluscode/rdf-string/lib/sparql'
import { NodeExpression, PatternBuilder } from '../nodeExpression/NodeExpression.js'
import { ModelFactory } from '../ModelFactory.js'
import { assertTerm, ConstraintComponent, Parameters, PropertyShape } from './ConstraintComponent.js'

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

  buildPropertyShapePatterns({ focusNode: subject, valueNode: object, rootPatterns, variable }: Parameters) {
    let patterns: Select | SparqlTemplateResult
    let filter: SparqlValue

    if ('buildInlineExpression' in this.expression) {
      ({ patterns, inline: filter } = this.expression.buildInlineExpression({ subject, object, rootPatterns, variable }, new PatternBuilder()))
      return sparql`${patterns}\nFILTER(${filter})`
    }

    ({ patterns, object: filter } = this.expression.build({ subject, object, rootPatterns, variable }, new PatternBuilder()))

    if (subject.equals(object)) {
      return sparql`${patterns}`
    }
    return sparql`${patterns}\nFILTER(${filter})`
  }
}
