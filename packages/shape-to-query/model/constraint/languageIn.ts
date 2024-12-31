import type { Literal, Variable } from '@rdfjs/types'
import { sh } from '@tpluscode/rdf-ns-builders'
import { isLiteral } from 'is-graph-pointer'
import type sparqljs from 'sparqljs'
import type { Parameters, PropertyShape } from './ConstraintComponent.js'
import ConstraintComponent, { assertList } from './ConstraintComponent.js'

export class LanguageInConstraintComponent extends ConstraintComponent {
  static * fromShape(shape: PropertyShape) {
    const languagesIns = shape.get(sh.languageIn) || []
    for (const languagesIn of languagesIns) {
      assertList(languagesIn)
      yield new LanguageInConstraintComponent(languagesIn.list.map((language) => {
        if (!isLiteral(language)) {
          throw new Error('sh:languageIn must be a list of literals')
        }

        return language.term
      }))
    }
  }

  constructor(public readonly languages: Literal[]) {
    super(sh.LanguageInConstraintComponent)
  }

  buildNodeShapePatterns({ focusNode }: Parameters): sparqljs.Pattern[] {
    if (focusNode.termType === 'NamedNode') {
      return []
    }

    return [this.filter(focusNode)]
  }

  buildPatterns({ valueNode }: Parameters) {
    return [this.filter(valueNode)]
  }

  private filter(node: Variable): sparqljs.Pattern {
    const [first, ...rest] = this.languages
    const lang: sparqljs.OperationExpression = {
      type: 'operation',
      operator: 'lang',
      args: [node],
    }

    if (rest.length) {
      return {
        type: 'filter',
        expression: {
          type: 'operation',
          operator: 'in',
          args: [lang, [...[first, ...rest]]],
        },
      }
    }

    return {
      type: 'filter',
      expression: {
        type: 'operation',
        operator: '=',
        args: [lang, first],
      },
    }
  }
}
