import sparqljs from 'sparqljs'
import type { Variable } from '@rdfjs/types'
import $rdf from '@zazuko/env'

export function BIND(what: sparqljs.Expression | string) {
  return {
    as(alias: Variable): sparqljs.BindPattern {
      return {
        type: 'bind',
        expression: typeof what === 'string' ? $rdf.literal(what) : what,
        variable: alias,
      }
    },
  }
}

export function SELECT(where: sparqljs.Pattern[]): sparqljs.SelectQuery {
  return {
    type: 'query',
    queryType: 'SELECT',
    where,
    prefixes: {},
    variables: [new sparqljs.Wildcard()],
  }
}
