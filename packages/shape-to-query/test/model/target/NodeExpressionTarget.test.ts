import $rdf from '@zazuko/env/web.js'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import { sparql } from '@tpluscode/sparql-builder'
import type sparqljs from 'sparqljs'
import { NodeExpressionTarget } from '../../../model/target/index.js'
import { parse } from '../../nodeFactory.js'
import { s2q } from '../../../index.js'
import { createVariableSequence } from '../../../lib/variableSequence.js'
import ModelFactory from '../../../model/ModelFactory.js'

describe('model/NodeExpressionTarget', function () {
  before(function () { return import('../../sparql.js') })
  const variable = createVariableSequence('t')

  describe('buildPatterns', function () {
    it('evaluates a simple expression', function () {
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
      const wrapped: sparqljs.SelectQuery = {
        type: 'query',
        queryType: 'SELECT',
        variables: [focusNode],
        where: whereClause,
        prefixes: {},
      }

      expect(wrapped).to.be.query(sparql`SELECT ?focusNode WHERE { { SELECT (?leaf as ?focusNode) WHERE { ?root ${rdf.rest}*/${rdf.first} ?leaf . } } }`)
      expect(constructClause).to.equalPatternsVerbatim('')
    })
  })
})
