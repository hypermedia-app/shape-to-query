import sparqljs from 'sparqljs'
import { match, P } from 'ts-pattern'
import $rdf from '@zazuko/env/web.js'
import type { BaseQuad } from '@rdfjs/types'

const parser = new sparqljs.Parser()
const generator = new sparqljs.Generator()

export default function optimize(query: string): string {
  const algebra = parser.parse(query)

  const optimized = new Optimizer().optimize(algebra)

  return generator.stringify(optimized)
}

class Optimizer {
  optimize(query: sparqljs.SparqlQuery): sparqljs.SparqlQuery {
    return match(query)
      .with({ type: 'query' }, query => this.processQuery(query))
      .with({ type: 'update' }, (update) => update)
      .exhaustive()
  }

  processQuery(query: sparqljs.Query): sparqljs.Query {
    return match(query)
      .with({ queryType: 'SELECT' }, select => this.processSelectQuery(select))
      .with({ queryType: 'CONSTRUCT' }, (construct) => this.processConstructQuery(construct))
      .with({ queryType: 'ASK' }, (ask) => ask)
      .with({ queryType: 'DESCRIBE' }, (describe) => describe)
      .exhaustive()
  }

  processSelectQuery(query: sparqljs.SelectQuery): sparqljs.SelectQuery {
    const where = this.processWhere(query.where)

    return {
      ...query,
      where,
    }
  }

  processConstructQuery(query: sparqljs.ConstructQuery): sparqljs.ConstructQuery {
    const where = this.processWhere(query.where)

    return {
      ...query,
      where,
    }
  }

  private processWhere(where: sparqljs.Pattern[]): sparqljs.Pattern[] {
    return where.map((pattern) => match(pattern)
      .with({ type: 'bgp' }, (bgp) => this.processBgp(bgp))
      .otherwise(() => pattern))
      .filter(Boolean)
  }

  private processBgp(bgp: sparqljs.BgpPattern): sparqljs.BgpPattern {
    const previousQuads = $rdf.termSet<BaseQuad>()

    const triples = bgp.triples.reduce<sparqljs.Triple[]>((acc, triple) => {
      match(triple)
        .with({ predicate: { type: 'path' } }, triple => acc.push(triple))
        .with({ predicate: { termType: P.any } }, triple => {
          const quad = $rdf.quad(triple.subject, triple.predicate, triple.object)
          if (previousQuads.has(quad)) return

          previousQuads.add(quad)
          acc.push(triple)
        })
        .exhaustive()

      return acc
    }, [])

    return {
      ...bgp,
      triples,
    }
  }

  private processGroup(group: sparqljs.GroupPattern) {
    return group
  }

  private processUnion(union: sparqljs.UnionPattern) {
    return union
  }

  private processOptional(optional: sparqljs.OptionalPattern) {
    return optional
  }
}
