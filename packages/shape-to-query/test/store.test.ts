import * as path from 'path'
import * as compose from 'docker-compose'
import waitOn from 'wait-on'
import StreamClient from 'sparql-http-client'
import { fromFile } from 'rdf-utils-fs'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { schema, sh } from '@tpluscode/rdf-ns-builders'
import namespace from '@rdfjs/namespace'
import { constructQuery } from '../lib/shapeToQuery'
import { parse, raw } from './nodeFactory'

const tbbt = namespace('http://localhost:8080/data/person/')

const client = new StreamClient({
  endpointUrl: 'http://localhost:3030/s2q/query',
  updateUrl: 'http://localhost:3030/s2q/update',
  storeUrl: 'http://localhost:3030/s2q/data',
})

describe('@hydrofoil/shape-to-query', () => {
  before(async function () {
    this.timeout(100000)
    await compose.upAll({
      cwd: path.resolve(__dirname, '../..'),
    })
    await waitOn({
      resources: ['http://localhost:3030'],
    })

    const tbbt = require.resolve('tbbt-ld/dist/tbbt.nq')
    await client.store.put(fromFile(tbbt))
  })

  context('executing queries', () => {
    it('sh:zeroOrMorePath includes self node', async () => {
      // given
      const shape = await parse`<>
        ${sh.property} [
          ${sh.path} (
            [ ${sh.zeroOrMorePath} ${schema.parent} ]
            ${schema.givenName}
          );
        ] .
      `

      // when
      const result = await $rdf.dataset().import(await constructQuery(shape, {
        focusNode: tbbt('sheldon-cooper'),
      }).execute(client.query))

      // then
      const expected = await raw`
        ${tbbt('sheldon-cooper')} ${schema.givenName} "Sheldon" .
        ${tbbt('sheldon-cooper')} ${schema.parent} ${tbbt('mary-cooper')} .
        ${tbbt('mary-cooper')} ${schema.givenName} "Mary" .
      `
      expect(result.toCanonical()).to.eq(expected.toCanonical())
    })

    it('sh:oneOrMore returns "second level" properties', async () => {
      // given
      const shape = await parse`<>
        ${sh.property} [
          ${sh.path} (
            [ ${sh.oneOrMorePath} ${schema.parent} ]
            ${schema.givenName}
          );
        ] .
      `

      // when
      const result = await $rdf.dataset().import(await constructQuery(shape, {
        focusNode: tbbt('sheldon-cooper'),
      }).execute(client.query))

      // then
      const expected = await raw`
        ${tbbt('sheldon-cooper')} ${schema.parent} ${tbbt('mary-cooper')} .
        ${tbbt('mary-cooper')} ${schema.givenName} "Mary" .
      `
      expect(result.toCanonical()).to.eq(expected.toCanonical())
    })

    it('sh:zeroOrOne returns self and child properties', async () => {
      // given
      const shape = await parse`<>
        ${sh.property} [
          ${sh.path} (
            [ ${sh.zeroOrOnePath} ${schema.spouse} ]
            ${schema.givenName}
          );
        ] .
      `

      // when
      const result = await $rdf.dataset().import(await constructQuery(shape, {
        focusNode: tbbt('howard-wolowitz'),
      }).execute(client.query))

      // then
      const expected = await raw`
        ${tbbt('howard-wolowitz')} ${schema.spouse} ${tbbt('bernadette-rostenkowski')} .
        ${tbbt('howard-wolowitz')} ${schema.givenName} "Howard" .
        ${tbbt('bernadette-rostenkowski')} ${schema.givenName} "Bernadette" .
      `
      expect(result.toCanonical()).to.eq(expected.toCanonical())
    })

    it('sh:alternativePath chained last in a sequence', async () => {
      // given
      const shape = await parse`<>
        ${sh.property} [
          ${sh.path} (
            ${schema.address}
            [ 
              ${sh.alternativePath} (
                ${schema.addressCountry}
                ${schema.addressLocality}
                ${schema.addressRegion}
                ${schema.postalCode}
                ${schema.streetAddress}
              )
            ]
          );
        ] .
      `

      // when
      const result = await $rdf.dataset().import(await constructQuery(shape, {
        focusNode: tbbt('penny'),
      }).execute(client.query))

      // then
      const expected = await raw`
        ${tbbt('penny')} ${schema.address} [
          ${schema.addressCountry} "US";
          ${schema.addressLocality} "Pasadena";
          ${schema.addressRegion} "CA";
          ${schema.postalCode} "91104";
          ${schema.streetAddress} "2311 North Los Robles Avenue, Aparment 4B" ;
        ] .
      `
      expect(result.toCanonical()).to.eq(expected.toCanonical())
    })

    it('sh:alternativePath chained first in a sequence', async () => {
      // given
      const shape = await parse`<> 
        ${sh.property} [
          ${sh.path} (
            [ ${sh.alternativePath} ( ${schema.children} ${schema.knows} ) ]
            ${schema.givenName}
          ) ;
        ] .
      `

      // when
      const result = await $rdf.dataset().import(await constructQuery(shape, {
        focusNode: tbbt('mary-cooper'),
      }).execute(client.query))

      // then
      const expected = await raw`
        ${tbbt('mary-cooper')} ${schema.children} ${tbbt('sheldon-cooper')} .
        ${tbbt('mary-cooper')} ${schema.knows} 
          ${tbbt('howard-wolowitz')} ,
          ${tbbt('penny')} ,
          ${tbbt('rajesh-koothrappali')} ,
          ${tbbt('sheldon-cooper')} 
        .
        ${tbbt('howard-wolowitz')} ${schema.givenName} "Howard" .
        ${tbbt('penny')} ${schema.givenName} "Penny" .
        ${tbbt('rajesh-koothrappali')} ${schema.givenName} "Rajesh" .
        ${tbbt('sheldon-cooper')} ${schema.givenName} "Sheldon" .
      `
      expect(result.toCanonical()).to.eq(expected.toCanonical())
    })

    it('two sh:alternativePath in a sequence', async () => {
      // given
      const shape = await parse`<> 
        ${sh.property} [
          ${sh.path} (
            [ ${sh.alternativePath} ( ${schema.children} ${schema.knows} ) ]
            [ ${sh.alternativePath} ( ${schema.givenName} ${schema.familyName} ) ]
          ) ;
        ] .
      `

      // when
      const result = await $rdf.dataset().import(await constructQuery(shape, {
        focusNode: tbbt('mary-cooper'),
      }).execute(client.query))

      // then
      const expected = await raw`
        ${tbbt('mary-cooper')} ${schema.children} ${tbbt('sheldon-cooper')} .
        ${tbbt('mary-cooper')} ${schema.knows} 
          ${tbbt('howard-wolowitz')} ,
          ${tbbt('penny')} ,
          ${tbbt('rajesh-koothrappali')} ,
          ${tbbt('sheldon-cooper')} 
        .
        ${tbbt('howard-wolowitz')} ${schema.givenName} "Howard" .
        ${tbbt('howard-wolowitz')} ${schema.familyName} "Wolowitz" .
        ${tbbt('penny')} ${schema.givenName} "Penny" .
        ${tbbt('rajesh-koothrappali')} ${schema.givenName} "Rajesh" .
        ${tbbt('rajesh-koothrappali')} ${schema.familyName} "Koothrappali" .
        ${tbbt('sheldon-cooper')} ${schema.givenName} "Sheldon" .
        ${tbbt('sheldon-cooper')} ${schema.familyName} "Cooper" .
      `
      expect(result.toCanonical()).to.eq(expected.toCanonical())
    })
  })
})