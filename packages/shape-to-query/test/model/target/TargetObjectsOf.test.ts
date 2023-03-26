import { schema } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { expect } from 'chai'
import { sparql } from '@tpluscode/sparql-builder'
import clownface from 'clownface'
import { createVariableSequence } from '../../../lib/variableSequence.js'
import { TargetObjectsOf } from '../../../model/target/index.js'

describe('model/TargetSubjectsOf', () => {
  before(() => import('../../sparql'))

  const variable = createVariableSequence('t')

  it('matches single target using pattern', () => {
    // given
    const props = clownface({ dataset: $rdf.dataset() }).node(
      [schema.children],
    )
    const target = new TargetObjectsOf(props)

    // when
    const focusNode = $rdf.variable('foo')
    const { whereClause, constructClause } = target.buildPatterns({ focusNode, variable })

    // then
    expect(whereClause).to.equalPatterns(sparql`?foo ${schema.children} ?value .`)
    expect(sparql`${constructClause}`).to.equalPatterns(sparql`?foo ${schema.children} ?value .`)
    expect(constructClause[0].object).to.equal(focusNode)
  })

  it('matches multiple targets using VALUES', () => {
    // given
    const props = clownface({ dataset: $rdf.dataset() }).node(
      [schema.children, schema.parent],
    )
    const target = new TargetObjectsOf(props)

    // when
    const focusNode = $rdf.variable('foo')
    const { whereClause, constructClause } = target.buildPatterns({ focusNode, variable })

    // then
    expect(whereClause).to.equalPatterns(sparql`
      ?foo ?prop ?value .
      VALUES ( ?prop ) { ( ${schema.children} ) ( ${schema.parent} ) } 
    `)
    expect(sparql`${constructClause}`).to.equalPatterns(sparql`?foo ?prop ?value .`)
    expect(constructClause[0].object).to.equal(focusNode)
  })
})
