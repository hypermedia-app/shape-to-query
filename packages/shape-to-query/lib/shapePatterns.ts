import { BaseQuad } from 'rdf-js'
import TermSet from '@rdfjs/term-set'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'

export interface ShapePatterns {
  whereClause: string | SparqlTemplateResult
  constructClause: BaseQuad[]
}

export const emptyPatterns: ShapePatterns = {
  whereClause: '',
  constructClause: [],
}

export function merge(left: ShapePatterns, right: ShapePatterns): ShapePatterns {
  return {
    whereClause: sparql`${left.whereClause}\n${right.whereClause}`,
    constructClause: [...left.constructClause, ...right.constructClause],
  }
}

export function unique(...construct: BaseQuad[][]): BaseQuad[] {
  const set = new TermSet<BaseQuad>(construct.flatMap(arr => arr))
  return [...set]
}

export function toUnion(propertyPatterns: ShapePatterns[]): string | SparqlTemplateResult {
  if (propertyPatterns.length > 1) {
    return propertyPatterns.reduce((union, next, index) => {
      if (index === 0) {
        return sparql`{ ${next.whereClause} }`
      }

      return sparql`${union}
      UNION
      { ${next.whereClause} }`
    }, sparql``)
  }

  if (propertyPatterns.length === 0) {
    return ''
  }

  return propertyPatterns[0].whereClause
}
