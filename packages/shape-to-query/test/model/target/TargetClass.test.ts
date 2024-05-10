import $rdf from '@zazuko/env/web.js'
import { foaf, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import { sparql } from '@tpluscode/sparql-builder'
import { TargetClass } from '../../../model/target/index.js'
import { createVariableSequence } from '../../../lib/variableSequence.js'

describe('model/TargetClass', () => {
  before(() => import('../../sparql.js'))

  const variable = createVariableSequence('c')

  it("matches focus node's single rdf:type using pattern", () => {
    // given
    const classes = $rdf.clownface({ dataset: $rdf.dataset() }).node(
      [schema.Person],
    )
    const target = new TargetClass(classes)
    const focusNode = $rdf.variable('foo')

    // when
    const { whereClause, constructClause } = target.buildPatterns({ focusNode, variable })

    // then
    expect(whereClause).to.equalPatternsVerbatim(sparql`?foo ${rdf.type} ${schema.Person} .`)
    expect(sparql`${constructClause}`).to.equalPatternsVerbatim(sparql`?foo ${rdf.type} ${schema.Person} .`)
  })

  it("matches focus node's single rdf:type using VALUES", () => {
    // given
    const classes = $rdf.clownface({ dataset: $rdf.dataset() }).node(
      [schema.Person, foaf.Person],
    )
    const target = new TargetClass(classes)
    const focusNode = $rdf.variable('foo')

    // when
    const { whereClause, constructClause } = target.buildPatterns({ focusNode, variable })

    // then
    expect(whereClause).to.equalPatterns(sparql`
      ?foo ${rdf.type} ?targetClass .
      VALUES ( ?targetClass ) { ( ${schema.Person} ) ( ${foaf.Person} ) } 
    `)
    expect(sparql`${constructClause}`).to.equalPatterns(sparql`?foo ${rdf.type} ?targetClass .`)
  })
})
