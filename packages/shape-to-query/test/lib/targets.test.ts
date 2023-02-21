import { sh } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import $rdf from '@rdfjs/data-model'
import { sparql } from '@tpluscode/rdf-string'
import { parse } from '../nodeFactory'
import { ex } from '../namespace'
import targets from '../../lib/targets'
import { createVariableSequence } from '../../lib/variableSequence'
import '../sparql'

const variable = createVariableSequence('target')

describe('lib/targets', () => {
  describe('target', () => {
    [...targets].forEach(([target, func]) => {
      describe(target.value, () => {
        it('returns nothing when there is no target', async () => {
          // given
          const shape = await parse`<>
        ${sh.property} [] .
      `
          const focusNode = $rdf.variable('foo')

          // when
          const { whereClause, constructClause } = func({ shape, focusNode, variable })

          // then
          expect(whereClause).to.be.undefined
          expect(constructClause).to.be.undefined
        })
      })
    })
  })

  describe('targetNode', () => {
    it('matches focus node variable with VALUES', async () => {
      // given
      const shape = await parse`<>
        ${sh.targetNode} ${ex.Foo}, ${ex.Bar} .
      `
      const focusNode = $rdf.variable('foo')

      // when
      const { whereClause, constructClause } = targets.get(sh.targetNode)({ shape, focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns(sparql`VALUES ( ?foo ) { ( ${ex.Foo} ) ( ${ex.Bar} ) }`)
      expect(constructClause).to.equalPatterns('')
    })
  })

  describe('targetClass', () => {
    it("matches focus node's single rdf:type using pattern", async () => {
      // given
      const shape = await parse`<>
        ${sh.targetClass} ${ex.Foo} .
      `
      const focusNode = $rdf.variable('foo')

      // when
      const { whereClause, constructClause } = targets.get(sh.targetClass)({ shape, focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns(sparql`?foo a ${ex.Foo} .`)
      expect(constructClause).to.equalPatterns(sparql`?foo a ${ex.Foo} .`)
    })

    it("matches focus node's single rdf:type using VALUES", async () => {
      // given
      const shape = await parse`<>
        ${sh.targetClass} ${ex.Foo}, ${ex.Bar} .
      `
      const focusNode = $rdf.variable('foo')

      // when
      const { whereClause, constructClause } = targets.get(sh.targetClass)({ shape, focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns(sparql`
        ?foo a ?targetClass .
        VALUES ( ?targetClass ) { ( ${ex.Foo} ) ( ${ex.Bar} ) } 
      `)
      expect(constructClause).to.equalPatterns(sparql`?foo a ?targetClass .`)
    })
  })

  describe('targetSubjectsOf', () => {
    it('matches single target using pattern', async () => {
      // given
      const shape = await parse`<>
        ${sh.targetSubjectsOf} ${ex.prop} .
      `
      const focusNode = $rdf.variable('foo')

      // when
      const { whereClause, constructClause } = targets.get(sh.targetSubjectsOf)({ shape, focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns(sparql`?foo ${ex.prop} ?value .`)
      expect(constructClause).to.equalPatterns(sparql`?foo ${ex.prop} ?value .`)
    })

    it('matches multiple targets using VALUES', async () => {
      // given
      const shape = await parse`<>
        ${sh.targetSubjectsOf} ${ex.prop1}, ${ex.prop2} .
      `
      const focusNode = $rdf.variable('foo')

      // when
      const { whereClause, constructClause } = targets.get(sh.targetSubjectsOf)({ shape, focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns(sparql`
        ?foo ?prop ?value .
        VALUES ( ?prop ) { ( ${ex.prop1} ) ( ${ex.prop2} ) } 
      `)
      expect(constructClause).to.equalPatterns(sparql`?foo ?prop ?value .`)
    })
  })

  describe('targetObjectsOf', () => {
    it('matches single target using pattern', async () => {
      // given
      const shape = await parse`<>
        ${sh.targetObjectsOf} ${ex.prop} .
      `
      const focusNode = $rdf.variable('foo')

      // when
      const { whereClause, constructClause } = targets.get(sh.targetObjectsOf)({ shape, focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns(sparql`?value ${ex.prop} ?foo .`)
      expect(constructClause).to.equalPatterns(sparql`?value ${ex.prop} ?foo .`)
    })

    it('matches multiple targets using VALUES', async () => {
      // given
      const shape = await parse`<>
        ${sh.targetObjectsOf} ${ex.prop1}, ${ex.prop2} .
      `
      const focusNode = $rdf.variable('foo')

      // when
      const { whereClause, constructClause } = targets.get(sh.targetObjectsOf)({ shape, focusNode, variable })

      // then
      expect(whereClause).to.equalPatterns(sparql`
        ?value ?prop ?foo .
        VALUES ( ?prop ) { ( ${ex.prop1} ) ( ${ex.prop2} ) } 
      `)
      expect(constructClause).to.equalPatterns(sparql`?value ?prop ?foo .`)
    })
  })
})
