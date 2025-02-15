import type { GraphPointer } from 'clownface'
import { isBlankNode, isGraphPointer } from 'is-graph-pointer'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import type { BindPattern, Pattern } from 'sparqljs'
import type { ModelFactory } from '../ModelFactory.js'
import type { NodeShape } from '../NodeShape.js'
import type { PropertyShape } from '../PropertyShape.js'
import type { InlineExpressionResult, Parameters, PatternBuilder } from './NodeExpression.js'
import NodeExpressionBase from './NodeExpression.js'
import { getOne, getOneOrZero } from './util.js'

export class ExistsExpression extends NodeExpressionBase {
  static match(pointer: GraphPointer): boolean {
    return isBlankNode(pointer) && isGraphPointer(getOneOrZero(pointer, sh.exists))
  }

  static fromPointer(pointer: GraphPointer, factory: ModelFactory): ExistsExpression {
    const shapePointer = getOne(pointer, sh.exists)
    if (isGraphPointer(shapePointer.out(sh.path))) {
      return new ExistsExpression(factory.propertyShape(shapePointer))
    }

    return new ExistsExpression(factory.nodeShape(shapePointer))
  }

  constructor(private readonly shape: NodeShape | PropertyShape) {
    super()
  }

  public get requiresFullContext(): boolean {
    return false
  }

  public get rootIsFocusNode(): boolean {
    return false
  }

  protected _buildPatterns({ subject, variable, object, rootPatterns }: Required<Parameters>): BindPattern {
    let constraints: Pattern[] = []
    const patterns = this.shape.buildPatterns({
      focusNode: subject,
      variable,
      rootPatterns,
    })

    if ('properties' in this.shape) {
      constraints = this.shape.buildConstraints({
        focusNode: subject,
        variable,
        rootPatterns,
        valueNode: object,
      })
    }

    return {
      type: 'bind',
      variable: object,
      expression: {
        type: 'operation',
        operator: 'exists',
        args: [{
          type: 'group',
          patterns: [
            ...patterns.whereClause,
            ...constraints,
          ],
        }],
      },
    }
  }

  buildInlineExpression(arg: Parameters, builder: PatternBuilder): InlineExpressionResult {
    return {
      inline: [],
    }
  }
}
