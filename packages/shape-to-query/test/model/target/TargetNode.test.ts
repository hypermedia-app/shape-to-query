import { foaf, schema } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { expect } from 'chai'
import clownface from 'clownface'
import { TargetNode } from '../../../model/target'
import { createVariableSequence } from '../../../lib/variableSequence'

describe('model/TargetNode', () => {
  before(() => import('../../sparql'))

  const variable = createVariableSequence('t')

  it('matches focus node variable with VALUES', () => {
    // given
    const nodes = clownface({ dataset: $rdf.dataset() }).node(
      [schema.Person, foaf.Person],
    )
    const target = new TargetNode(nodes)

    // when
    const focusNode = $rdf.variable('foo')
    const { whereClause } = target.buildPatterns({ focusNode, variable })

    // then
    expect(whereClause).to.equalPatternsVerbatim('VALUES ( ?foo ) { ( schema:Person ) ( foaf:Person ) }')
  })
})
