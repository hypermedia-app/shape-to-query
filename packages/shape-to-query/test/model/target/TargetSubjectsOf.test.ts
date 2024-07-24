import { schema } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env/web.js'
import { expect } from 'chai'
import { sparql } from '@tpluscode/sparql-builder'
import { createVariableSequence } from '../../../lib/variableSequence.js'
import { TargetSubjectsOf } from '../../../model/target/index.js'

describe('model/TargetSubjectsOf', () => {
  before(() => import('../../sparql.js'))

  const variable = createVariableSequence('t')

  it('matches single target using pattern', () => {
    // given
    const props = $rdf.clownface({ dataset: $rdf.dataset() }).node(
      [schema.children],
    )
    const target = new TargetSubjectsOf(props)

    // when
    const focusNode = $rdf.variable('foo')
    const { whereClause, constructClause } = target.buildPatterns({ focusNode, variable })

    // then
    expect(whereClause).to.equalPatterns(sparql`?foo ${schema.children} ?value .`)
    expect(sparql`${constructClause}`).to.equalPatterns(sparql`?foo ${schema.children} ?value .`)
    expect(constructClause[0].subject).to.equal(focusNode)
  })

  it('matches multiple targets using VALUES', () => {
    // given
    const props = $rdf.clownface({ dataset: $rdf.dataset() }).node(
      [schema.children, schema.parent],
    )
    const target = new TargetSubjectsOf(props)

    // when
    const focusNode = $rdf.variable('foo')
    const { whereClause, constructClause } = target.buildPatterns({ focusNode, variable })

    // then
    expect(whereClause).to.equalPatterns(sparql`
      ?foo ?prop ?value .
      VALUES ?prop { ${schema.children} ${schema.parent} } 
    `)
    expect(sparql`${constructClause}`).to.equalPatterns(sparql`?foo ?prop ?value .`)
    expect(constructClause[0].subject).to.equal(focusNode)
  })
})
