import type sparqljs from 'sparqljs'
import { match, P } from 'ts-pattern'
import type { DataFactory, DefaultGraph, Quad_Predicate } from '@rdfjs/types' // eslint-disable-line camelcase

type Term = sparqljs.IriTerm | sparqljs.BlankTerm | sparqljs.LiteralTerm | sparqljs.Variable | sparqljs.QuadTerm | DefaultGraph

export abstract class Processor<F extends DataFactory = DataFactory> {
  constructor(protected factory: F) {
  }

  optimize<Q extends sparqljs.SparqlQuery>(query: Q): Q {
    return match(query as unknown as sparqljs.SparqlQuery)
      .with({ type: 'query' }, query => this.processQuery(query))
      .with({ type: 'update' }, (update) => this.processUpdate(update))
      .exhaustive() as Q
  }

  processQuery<Q extends sparqljs.SparqlQuery>(query: Q): Q {
    return match(query as unknown as sparqljs.SparqlQuery)
      .with({ queryType: 'SELECT' }, select => this.processSelectQuery(select))
      .with({ queryType: 'CONSTRUCT' }, (construct) => this.processConstructQuery(construct))
      .with({ queryType: 'ASK' }, (ask) => ask)
      .with({ queryType: 'DESCRIBE' }, (describe) => describe)
      .with({ type: 'update' }, update => this.processUpdate(update))
      .exhaustive() as Q
  }

  processUpdate(update: sparqljs.Update): sparqljs.Update {
    return {
      ...update,
      updates: update.updates.map(this.processUpdateOperation.bind(this)),
    }
  }

  processUpdateOperation(operation: sparqljs.UpdateOperation): sparqljs.UpdateOperation {
    return match(operation)
      .with({ updateType: P.any }, insertDelete => this.processInsertDeleteOperation(insertDelete))
      .with(P.union({ type: 'copy' }, { type: 'move' }, { type: 'add' }), copy => this.processCopyMoveAddOperation(copy))
      .with({ type: 'load' }, load => this.processLoadOperation(load))
      .with({ type: 'create' }, create => this.processCreateOperation(create))
      .with(P.union({ type: 'clear' }, { type: 'drop' }), clear => this.processClearDropOperation(clear))
      .exhaustive()
  }

  processCopyMoveAddOperation(operation: sparqljs.CopyMoveAddOperation): sparqljs.CopyMoveAddOperation {
    return {
      ...operation,
      source: this.processGraphOrDefault(operation.source),
      destination: this.processGraphOrDefault(operation.destination),
    }
  }

  processLoadOperation(operation: sparqljs.LoadOperation): sparqljs.LoadOperation {
    return {
      ...operation,
      source: this.processIriTerm(operation.source),
      destination: operation.destination && this.processIriTerm(operation.destination),
    }
  }

  processCreateOperation(operation: sparqljs.CreateOperation): sparqljs.CreateOperation {
    return {
      ...operation,
      graph: this.processGraphOrDefault(operation.graph),
    }
  }

  processClearDropOperation(operation: sparqljs.ClearDropOperation): sparqljs.ClearDropOperation {
    return {
      ...operation,
      graph: this.processGraphOrDefault(operation.graph),
    }
  }

  processInsertDeleteOperation(operation: sparqljs.InsertDeleteOperation): sparqljs.InsertDeleteOperation {
    const { graph } = operation

    const rest = match(operation)
      .with({ updateType: 'insert' }, insert => ({
        insert: insert.insert.map(q => this.processQuads(q)),
      }))
      .with({ updateType: 'delete' }, del => ({
        delete: del.delete.map(q => this.processQuads(q)),
      }))
      .with({ updateType: 'insertdelete' }, insertDel => ({
        insert: insertDel.insert?.map(q => this.processQuads(q)),
        delete: insertDel.delete?.map(q => this.processQuads(q)),
        using: {
          default: insertDel.using?.default.map(term => this.processIriTerm(term)),
          named: insertDel.using?.named.map(term => this.processIriTerm(term)),
        },
        where: this.processPatterns(insertDel.where),
      }))
      .with({ updateType: 'deletewhere' }, delWhere => ({
        delete: delWhere.delete.map(q => this.processQuads(q)),
      }))
      .exhaustive()

    return {
      ...operation,
      graph: this.processGraphOrDefault(graph),
      ...rest,
    }
  }

  processIriTerm(term: sparqljs.IriTerm): sparqljs.IriTerm {
    return term
  }

  processQuads(quads: sparqljs.Quads): sparqljs.Quads {
    return match(quads)
      .with({ type: 'bgp' }, bgp => this.processBgp(bgp))
      .with({ type: 'graph' }, (graph): sparqljs.GraphQuads => ({
        type: 'graph',
        name: this.processTerm(graph.name),
        triples: graph.triples.map(triple => this.processTriple(triple)),
      }))
      .exhaustive()
  }

  processSelectQuery(query: sparqljs.SelectQuery): sparqljs.SelectQuery {
    return {
      ...query,
      where: this.processPatterns(query.where),
    }
  }

  processConstructQuery(query: sparqljs.ConstructQuery): sparqljs.ConstructQuery {
    return {
      ...query,
      where: this.processPatterns(query.where),
      template: query.template?.map(triple => this.processTriple(triple)),
    }
  }

  processPatterns(where: sparqljs.Pattern[]): sparqljs.Pattern[] {
    return where.map((pattern) => this.processPattern(pattern)).filter(Boolean)
  }

  processPattern(pattern: sparqljs.Pattern): sparqljs.Pattern {
    return match(pattern)
      .with({ type: 'bgp' }, (bgp) => this.processBgp(bgp))
      .with({ type: 'values' }, values => this.processValues(values))
      .with({ type: 'group' }, group => this.processGroup(group))
      .with({ type: 'union' }, union => this.processUnion(union))
      .with({ type: 'optional' }, optional => this.processOptional(optional))
      .with({ type: 'graph' }, graph => this.processGraph(graph))
      .with({ type: 'service' }, service => this.processService(service))
      .with({ type: 'minus' }, minus => this.processMinus(minus))
      .with({ type: 'filter' }, filter => this.processFilter(filter))
      .with({ type: 'bind' }, bind => this.processBind(bind))
      .with({ type: 'query', queryType: 'SELECT' }, query => this.processQuery(query))
      .exhaustive()
  }

  processBind(bind: sparqljs.BindPattern): sparqljs.BindPattern {
    return {
      ...bind,
      expression: this.processExpression(bind.expression),
    }
  }

  processFilter(filter: sparqljs.FilterPattern): sparqljs.FilterPattern {
    return {
      ...filter,
      expression: this.processExpression(filter.expression),
    }
  }

  processMinus(minus: sparqljs.MinusPattern): sparqljs.MinusPattern {
    return {
      ...minus,
      patterns: this.processPatterns(minus.patterns),
    }
  }

  processService(service: sparqljs.ServicePattern): sparqljs.ServicePattern {
    return {
      ...service,
      name: this.processTerm(service.name),
      patterns: this.processPatterns(service.patterns),
    }
  }

  processGraph(graph: sparqljs.GraphPattern): sparqljs.GraphPattern {
    return {
      ...graph,
      patterns: this.processPatterns(graph.patterns),
    }
  }

  processValues(valuesPattern: sparqljs.ValuesPattern): sparqljs.ValuesPattern {
    const values = valuesPattern.values
      .map((row): sparqljs.ValuePatternRow => {
        const entries = Object.entries(row)
        return Object.fromEntries(entries.map(([key, value]) => [key, this.processTerm(value)]))
      })

    return {
      type: 'values',
      values,
    }
  }

  processTerm<T extends Term>(term: T): T {
    return match(term as unknown as Term)
      .with({ termType: 'NamedNode' }, iri => this.processIriTerm(iri))
      .with({ termType: 'BlankNode' }, blank => this.processBlankNode(blank))
      .with({ termType: 'Literal' }, literal => this.processLiteral(literal))
      .with({ termType: 'Quad' }, quad => this.processQuad(quad))
      .with({ termType: 'Variable' }, variable => this.processVariable(variable))
      .with({ termType: 'DefaultGraph' }, dg => dg)
      .with({ expression: P.any }, expression => ({
        expression: this.processExpression(expression.expression),
        variable: this.processVariable(expression.variable),
      }))
      .exhaustive() as T
  }

  processQuad(quad: sparqljs.QuadTerm): sparqljs.QuadTerm {
    return this.factory.quad(
      this.processTerm(quad.subject),
      this.processTerm(quad.predicate),
      this.processTerm(quad.object),
      this.processTerm(quad.graph),
    )
  }

  processVariable(variable: sparqljs.Variable): sparqljs.Variable {
    return variable
  }

  processBlankNode(term: sparqljs.BlankTerm): sparqljs.BlankTerm {
    return term
  }

  processLiteral(literal: sparqljs.LiteralTerm): sparqljs.LiteralTerm {
    const langOrDt = literal.language || this.processIriTerm(literal.datatype)

    return this.factory.literal(literal.value, langOrDt)
  }

  processBgp(bgp: sparqljs.BgpPattern): sparqljs.BgpPattern {
    return {
      ...bgp,
      triples: bgp.triples.map(triple => this.processTriple(triple)),
    }
  }

  processTriple(triple: sparqljs.Triple): sparqljs.Triple {
    return {
      subject: this.processTerm(triple.subject),
      predicate: match(triple.predicate)
        .with({ type: 'path' }, path => this.processPropertyPath(path))
        .otherwise(() => this.processTerm(triple.predicate as Quad_Predicate)), // eslint-disable-line camelcase
      object: this.processTerm(triple.object),
    }
  }

  processPropertyPath(path: sparqljs.PropertyPath): sparqljs.PropertyPath {
    return {
      ...path,
      items: path.items.map(item => match(item)
        .with({ type: 'path' }, path => this.processPropertyPath(path))
        .with({ termType: P.any }, term => this.processIriTerm(term))
        .exhaustive()),
    }
  }

  processGroup(group: sparqljs.GroupPattern) : sparqljs.GroupPattern {
    return {
      ...group,
      patterns: this.processPatterns(group.patterns),
    }
  }

  processUnion(union: sparqljs.UnionPattern): sparqljs.UnionPattern {
    return {
      ...union,
      patterns: union.patterns.map(this.processPattern.bind(this)),
    }
  }

  processOptional(optional: sparqljs.OptionalPattern): sparqljs.OptionalPattern {
    return {
      ...optional,
      patterns: this.processPatterns(optional.patterns),
    }
  }

  processGraphOrDefault(graph: sparqljs.GraphOrDefault): sparqljs.GraphOrDefault {
    return {
      ...graph,
      name: graph.name ?? this.processTerm(graph.name),
    }
  }

  processExpression(expression: sparqljs.Expression): sparqljs.Expression {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return match(expression)
      .with({ type: 'operation' }, operation => this.processOperation(operation))
      .with({ type: 'functionCall' }, functionCall => this.processFunctionCall(functionCall))
      .with({ type: 'aggregate' }, aggregate => aggregate)
      .when(Array.isArray, (tuple: sparqljs.Expression[]) => tuple.map(expression => this.processExpression(expression)))
      .with({ equals: P.instanceOf(Function) }, term => this.processTerm(term))
      .exhaustive()
  }

  processFunctionCall(functionCall: sparqljs.FunctionCallExpression): sparqljs.FunctionCallExpression {
    return {
      ...functionCall,
      function: match(functionCall.function)
        .with({ termType: 'NamedNode' }, iri => this.processIriTerm(iri))
        .otherwise(() => functionCall.function),
      args: functionCall.args.map(arg => this.processExpression(arg)),
    }
  }

  processOperation(operation: sparqljs.OperationExpression): sparqljs.OperationExpression {
    return {
      ...operation,
      args: operation.args.map(arg =>
        match(arg)
          .when(isPattern, operation => this.processPattern(operation))
          .otherwise(() => this.processExpression(arg as sparqljs.Expression)),
      ),
    }
  }
}

function isPattern(arg: sparqljs.Expression | sparqljs.Pattern): arg is sparqljs.Pattern {
  return 'type' in arg && arg.type === 'bgp'
}
