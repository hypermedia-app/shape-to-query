import { Variable } from 'rdf-js'
import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { isLiteral } from 'is-graph-pointer'
import ConstraintComponent, { assertList, Parameters, PropertyShape } from './ConstraintComponent.js'

export class LanguageInConstraintComponent extends ConstraintComponent {
  static * fromShape(shape: PropertyShape) {
    const languagesIns = shape.get(sh.languageIn) || []
    for (const languagesIn of languagesIns) {
      assertList(languagesIn)
      yield new LanguageInConstraintComponent(languagesIn.list.map((language) => {
        if (!isLiteral(language)) {
          throw new Error('sh:languageIn must be a list of literals')
        }

        return language.value
      }))
    }
  }

  constructor(public readonly languages: string[]) {
    super(sh.LanguageInConstraintComponent)
  }

  buildNodeShapePatterns({ focusNode }: Parameters) {
    if (focusNode.termType === 'NamedNode') {
      return ''
    }

    return this.filter(focusNode)
  }

  buildPropertyShapePatterns({ valueNode }: Parameters) {
    return this.filter(valueNode)
  }

  private filter(node: Variable) {
    const [first, ...rest] = this.languages.map(lang => sparql`"${lang}"`)
    if (rest.length) {
      return sparql`FILTER (lang(${node}) ${IN(first, ...rest)} )`
    }

    return sparql`FILTER (lang(${node}) = ${first} )`
  }
}
