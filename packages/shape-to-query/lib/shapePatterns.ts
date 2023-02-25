import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'

export interface ShapePatterns {
  whereClause: string | SparqlTemplateResult
  constructClause: string | SparqlTemplateResult
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
