import $rdf from '@zazuko/env/web.js'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import { sparql } from '@tpluscode/sparql-builder'
import { NodeExpressionTarget } from '../../../model/target/index.js'
import { parse } from '../../nodeFactory.js'
import { s2q } from '../../../index.js'
import { createVariableSequence } from '../../../lib/variableSequence.js'
import ModelFactory from '../../../model/ModelFactory.js'

describe('model/NodeExpressionTarget', () => {
  before(() => import('../../sparql.js'))
  const variable = createVariableSequence('t')

  describe('buildPatterns', () => {
    it('evaluates a simple expression', () => {
      // given
      const listItemTarget = parse.any`
        [] 
          a ${s2q.NodeExpressionTarget} ;
          ${sh.expression} [
            ${sh.path} ( 
              [ ${sh.zeroOrMorePath} ${rdf.rest} ]
              ${rdf.first}
            );
          ] ;
        . 
      `.has(sh.expression) as any
      const target = new NodeExpressionTarget(listItemTarget, new ModelFactory())

      // when
      const focusNode = $rdf.variable('foo')
      const { whereClause, constructClause } = target.buildPatterns({ focusNode, variable })

      // expect
      const wrapped = sparql`SELECT ${focusNode} WHERE { ${whereClause} }`.toString({
        prologue: false,
      })

      expect(wrapped).to.equalPatterns(sparql`SELECT ?focusNode WHERE { { SELECT (?leaf as ?focusNode) WHERE { ?root ${rdf.rest}*/${rdf.first} ?leaf . } } }`)
      expect(constructClause).to.equalPatternsVerbatim('')
    })
  })
})
