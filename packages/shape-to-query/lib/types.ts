import { SparqlTemplateResult } from '@tpluscode/sparql-builder'

export interface ShapePatterns {
  whereClause: string | SparqlTemplateResult
  constructClause: string | SparqlTemplateResult
}
