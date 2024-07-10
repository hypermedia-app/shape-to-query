import { foaf, schema } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env/web.js'
import { expect } from 'chai'
import { sparql } from '@tpluscode/sparql-builder'
import { TargetNode } from '../../../model/target/index.js'
import { createVariableSequence } from '../../../lib/variableSequence.js'

describe('model/TargetNode', () => {
  before(() => import('../../sparql.js'))

  const variable = createVariableSequence('t')

  it('matches focus node variable with VALUES', () => {
    // given
    const nodes = $rdf.clownface({ dataset: $rdf.dataset() }).node(
      [schema.Person, foaf.Person],
    )
    const target = new TargetNode(nodes)

    // when
    const focusNode = $rdf.variable('foo')
    const { whereClause } = target.buildPatterns({ focusNode, variable })

    // then
    expect(whereClause).to.equalPatternsVerbatim(sparql`VALUES ?foo { ${schema.Person} ${foaf.Person} }`)
  })
})
