import type { GraphPointer } from 'clownface'
import { isBlankNode, isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import type { BindPattern, OperationExpression, Pattern } from 'sparqljs'
import type { Term } from '@rdfjs/types'
import type { ModelFactory } from '../ModelFactory.js'
import type { NodeShape } from '../NodeShape.js'
import type { PropertyShape } from '../PropertyShape.js'
import type { InlineExpressionResult, Parameters } from './NodeExpression.js'
import NodeExpressionBase from './NodeExpression.js'
import { getOne, getOneOrZero } from './util.js'

export class ExistsExpression extends NodeExpressionBase {
  static match(pointer: GraphPointer): boolean {
    return isBlankNode(pointer) && isGraphPointer(getOneOrZero(pointer, sh.exists))
  }

  static fromPointer(pointer: GraphPointer, factory: ModelFactory): ExistsExpression {
    const shapePointer = getOne(pointer, sh.exists)
    if (isGraphPointer(shapePointer.out(sh.path))) {
      return new ExistsExpression(pointer.term, factory.propertyShape(shapePointer))
    }

    return new ExistsExpression(pointer.term, factory.nodeShape(shapePointer))
  }

  constructor(term: Term, private readonly shape: NodeShape | PropertyShape) {
    super(term)
  }

  public get requiresFullContext(): boolean {
    return false
  }

  public get rootIsFocusNode(): boolean {
    return false
  }

  protected _buildPatterns(arg: Required<Parameters>): BindPattern {
    return {
      type: 'bind',
      variable: arg.object,
      expression: this.buildExistsOperation(arg),
    }
  }

  buildInlineExpression(arg: Parameters): InlineExpressionResult {
    return {
      inline: this.buildExistsOperation(arg),
    }
  }

  buildExistsOperation({ subject, variable, object, rootPatterns }: Parameters): OperationExpression {
    let constraints: Pattern[] = []
    const patterns = this.shape.buildPatterns({
      focusNode: subject,
      variable,
      rootPatterns,
    })

    constraints = this.shape.buildConstraints({
      focusNode: subject,
      variable,
      rootPatterns,
      valueNode: object,
    })

    return {
      type: 'operation',
      operator: 'exists',
      args: [{
        type: 'group',
        patterns: [
          ...patterns.whereClause,
          ...constraints,
        ],
      }],
    }
  }
}
