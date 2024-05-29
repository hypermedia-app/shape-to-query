import module from 'module'
import oxigraph from 'oxigraph'
import { expect } from 'chai'
import $rdf from '@zazuko/env-node'
import { hydra, rdf, schema, dashSparql } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { Construct } from '@tpluscode/sparql-builder'
import { constructQuery } from '../lib/shapeToQuery.js'
import { s2q } from '../index.js'
import { parse, raw } from './nodeFactory.js'
import { ex } from './namespace.js'
import './chai-dataset.js'

const require = module.createRequire(import.meta.url)

const tbbt = $rdf.namespace('http://localhost:8080/data/person/')

describe('@hydrofoil/shape-to-query', () => {
  let store: oxigraph.Store

  before(async function () {
    const dataset = $rdf.dataset()
    await dataset.import($rdf.fromFile(require.resolve('tbbt-ld/dist/tbbt.nq')))
    await dataset.import($rdf.fromFile(require.resolve('./store-data.trig')))

    store = new oxigraph.Store([...dataset])
  })

  function runQuery(query: Construct) {
    return $rdf.dataset(store.query(query.build(), {
      use_default_graph_as_union: true,
    }))
  }

  context('executing queries', () => {
    it('sh:zeroOrMorePath includes self node', async () => {
      // given
      const shape = parse`<>
        ${sh.property} [
          ${sh.path} (
            [ ${sh.zeroOrMorePath} ${schema.parent} ]
            ${schema.givenName}
          );
        ] .
      `

      // when
      const result = runQuery(constructQuery(shape, {
        focusNode: tbbt('sheldon-cooper'),
      }))

      // then
      const expected = raw`
        ${tbbt('sheldon-cooper')} ${schema.givenName} "Sheldon" .
        ${tbbt('sheldon-cooper')} ${schema.parent} ${tbbt('mary-cooper')} .
        ${tbbt('mary-cooper')} ${schema.givenName} "Mary" .
      `
      expect(result).to.equalDataset(expected)
    })

    it('sh:oneOrMore returns "second level" properties', async () => {
      // given
      const shape = parse`<>
        ${sh.property} [
          ${sh.path} (
            [ ${sh.oneOrMorePath} ${schema.parent} ]
            ${schema.givenName}
          );
        ] .
      `

      // when
      const result = runQuery(constructQuery(shape, {
        focusNode: tbbt('sheldon-cooper'),
      }))

      // then
      const expected = raw`
        ${tbbt('sheldon-cooper')} ${schema.parent} ${tbbt('mary-cooper')} .
        ${tbbt('mary-cooper')} ${schema.givenName} "Mary" .
      `
      expect(result).to.equalDataset(expected)
    })

    it('sh:zeroOrOne returns self and child properties', async () => {
      // given
      const shape = parse`<>
        ${sh.property} [
          ${sh.path} (
            [ ${sh.zeroOrOnePath} ${schema.spouse} ]
            ${schema.givenName}
          );
        ] .
      `

      // when
      const result = runQuery(constructQuery(shape, {
        focusNode: tbbt('howard-wolowitz'),
      }))

      // then
      const expected = raw`
        ${tbbt('howard-wolowitz')} ${schema.spouse} ${tbbt('bernadette-rostenkowski')} .
        ${tbbt('howard-wolowitz')} ${schema.givenName} "Howard" .
        ${tbbt('bernadette-rostenkowski')} ${schema.givenName} "Bernadette" .
      `
      expect(result).to.equalDataset(expected)
    })

    it('sh:alternativePath chained last in a sequence', async () => {
      // given
      const shape = parse`<>
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
      const result = runQuery(constructQuery(shape, {
        focusNode: tbbt('penny'),
      }))

      // then
      const expected = raw`
        ${tbbt('penny')} ${schema.address} [
          ${schema.addressCountry} "US";
          ${schema.addressLocality} "Pasadena";
          ${schema.addressRegion} "CA";
          ${schema.postalCode} "91104";
          ${schema.streetAddress} "2311 North Los Robles Avenue, Aparment 4B" ;
        ] .
      `
      expect(result).to.equalDataset(expected)
    })

    it('sh:hasValues', async () => {
      // given
      const shape = parse`<>
        ${sh.property} [
          ${sh.path} ${schema.knows} ;
          ${sh.hasValue} ${tbbt('mary-cooper')} ;
        ] .
      `

      // when
      const query = constructQuery(shape)
      const dataset = runQuery(query)

      // then
      const subjects = $rdf.clownface({ dataset }).has(schema.knows, tbbt('mary-cooper')).terms
      expect(subjects).to.have.length(1)
      expect(subjects[0].value).to.eq(tbbt('leonard-hofstadter').value)
    })

    it('sh:alternativePath chained first in a sequence', async () => {
      // given
      const shape = parse`<> 
        ${sh.property} [
          ${sh.path} (
            [ ${sh.alternativePath} ( ${schema.children} ${schema.knows} ) ]
            ${schema.givenName}
          ) ;
        ] .
      `

      // when
      const result = runQuery(constructQuery(shape, {
        focusNode: tbbt('mary-cooper'),
      }))

      // then
      const expected = raw`
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
      expect(result).to.equalDataset(expected)
    })

    it('two sh:alternativePath in a sequence', async () => {
      // given
      const shape = parse`<> 
        ${sh.property} [
          ${sh.path} (
            [ ${sh.alternativePath} ( ${schema.children} ${schema.knows} ) ]
            [ ${sh.alternativePath} ( ${schema.givenName} ${schema.familyName} ) ]
          ) ;
        ] .
      `

      // when
      const result = runQuery(constructQuery(shape, {
        focusNode: tbbt('mary-cooper'),
      }))

      // then
      const expected = raw`
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
      expect(result).to.equalDataset(expected)
    })

    it('mix of sh:target', async () => {
      // given
      const shape = parse`
        <>
          a ${sh.NodeShape} ;
          ${sh.targetNode} ${tbbt('stuart-bloom')} ; # match Stuart
          ${sh.targetObjectsOf} ${schema.parent} ;   # match Mee-Maw
          ${sh.targetSubjectsOf} ${schema.address} ; # match Mee-Maw, Leonard, Sheldon and Penny
          ${sh.property} [
            ${sh.path} ${rdf.type}
          ] ;
        .
      `

      // when
      const query = constructQuery(shape)
      const result = runQuery(query)

      // then
      const expected = raw`
        ${tbbt('mary-cooper')} a ${schema.Person} .
        ${tbbt('mary-cooper')} ${schema.address} [] .
        ${tbbt('stuart-bloom')} a ${schema.Person} .
        ${tbbt('penny')} a ${schema.Person} .
        ${tbbt('penny')} ${schema.address} [] .
        ${tbbt('leonard-hofstadter')} a ${schema.Person} .
        ${tbbt('leonard-hofstadter')} ${schema.address} [] .
        ${tbbt('sheldon-cooper')} a ${schema.Person} .
        ${tbbt('sheldon-cooper')} ${schema.address} [] .
        ${tbbt('sheldon-cooper')} ${schema.parent}  ${tbbt('mary-cooper')} .
      `
      expect(result.toCanonical()).to.eq($rdf.dataset.toCanonical(expected))
    })

    it('sh:or merges multiple reused shapes in logical sum', async () => {
      // given
      const shape = parse`
        <> 
          ${sh.or} ( _:blank <named> ) ;
          ${sh.property} [ ${sh.path} ${schema.givenName} ] ;
          ${sh.property}  [ ${sh.path} ${schema.familyName} ] .
        
        <named>
          ${sh.property} [ ${sh.path} ${schema.parent} ] .
        
        _:blank
          ${sh.property} [ ${sh.path} ${schema.children} ] .
      `

      // when
      const result = runQuery(constructQuery(shape))

      // then
      const expected = raw`
        ${tbbt('sheldon-cooper')} ${schema.parent} ${tbbt('mary-cooper')} ;
                                          ${schema.givenName} "Sheldon" ;
                                          ${schema.familyName} "Cooper" .
        ${tbbt('mary-cooper')} ${schema.children} ${tbbt('sheldon-cooper')} ;
                                       ${schema.givenName} "Mary" ;
                                       ${schema.familyName} "Cooper" .
      `
      expect(result).to.equalDataset(expected)
    })

    it('sh:or nested in sh:node', async () => {
      // given
      const shape = parse`
        <> 
          ${sh.property} [ 
            ${sh.path} ${schema.familyName} ;
            ${sh.or} (
              [ 
                ${sh.hasValue} "Cooper" ; 
              ] 
              [ 
                ${sh.hasValue} "Bloom" ; 
              ]
            ) ;
          ] .
      `

      // when
      const result = runQuery(constructQuery(shape))

      // then
      const expected = raw`
        ${tbbt('sheldon-cooper')} ${schema.familyName} "Cooper" .
        ${tbbt('mary-cooper')} ${schema.familyName} "Cooper" .
        ${tbbt('stuart-bloom')} ${schema.familyName} "Bloom" .
      `
      expect(result).to.equalDataset(expected)
    })

    it('sh:hasValue filters entire focus nodes', async () => { // given
      const shape = parse`
        <> 
          ${sh.property} [ 
            ${sh.path} ${schema.givenName} ;
          ], [ 
            ${sh.path} ${schema.familyName} ;
            ${sh.hasValue} "Cooper" ;
          ] .
      `

      // when
      const result = runQuery(constructQuery(shape))

      // then
      const expected = raw`
        ${tbbt('sheldon-cooper')} ${schema.givenName} "Sheldon" ;
                                          ${schema.familyName} "Cooper" .
        ${tbbt('mary-cooper')} ${schema.givenName} "Mary" ;
                                       ${schema.familyName} "Cooper" .
      `
      expect(result).to.equalDataset(expected)
    })

    it('filtering property by sh:in', async () => {
      const shape = parse`
        <> 
          ${sh.property} [ 
            ${sh.path} ${schema.givenName} ;
          ], [ 
            ${sh.path} ${schema.jobTitle} ;
            ${sh.in} ( "theoretical physicist" "neurobiologist" "microbiologist" ) ;
          ] .
      `

      // when
      const result = runQuery(constructQuery(shape))

      // then
      const expected = raw`
        ${tbbt('amy-farrah-fowler')} ${schema.givenName} "Amy" ;
                                             ${schema.jobTitle} "neurobiologist" .
        ${tbbt('sheldon-cooper')} ${schema.givenName} "Sheldon" ;
                                          ${schema.jobTitle} "theoretical physicist" .
        ${tbbt('bernadette-rostenkowski')} ${schema.givenName} "Bernadette" ;
                                                   ${schema.jobTitle} "microbiologist" .
      `
      expect(result).to.equalDataset(expected)
    })

    it('filtering deep inside sh:node', async () => {
      const shape = parse`
        <> 
          ${sh.targetClass} ${schema.Person} ;
          ${sh.property}
            [
              ${sh.path} ${schema.givenName} ;
            ],
            [
              ${sh.path} [ 
                ${sh.alternativePath} ( ${schema.knows} ${schema.parent} )
              ] ;
              ${sh.node}
                [
                  ${sh.property}
                    [
                      ${sh.path} ${schema.address} ;
                      ${sh.node}
                        [
                          ${sh.property}
                            [
                              ${sh.path} ${schema.addressRegion} ;
                              ${sh.hasValue} "TX" ;
                            ]
                        ]
                    ]
                ]
            ] .
      `

      // when
      const result = runQuery(constructQuery(shape))
      const filtered = result.match(null, schema.givenName)

      // then
      const expected = raw`
        ${tbbt('leonard-hofstadter')} ${schema.givenName} "Leonard" .
        ${tbbt('sheldon-cooper')} ${schema.givenName} "Sheldon" .
      `
      expect(filtered).to.equalDataset(expected)
    })

    it('chaining properties from a subquery with sh:node', async () => {
      // given
      const shape = parse`
        <> 
          ${sh.targetNode} ${ex.people} ;
          ${sh.property} [
            ${sh.path} ${hydra.member} ;
            ${sh.values} [
              ${sh.filterShape} [
                ${sh.property} [
                  ${sh.path} ${schema.jobTitle} ;
                  ${sh.hasValue} "neurobiologist" ;
                ] ;
              ] ;
              ${sh.nodes} [
                ${sh.path} [ ${sh.inversePath} ${rdf.type} ] ;
                ${sh.nodes} [
                  ${sh.path} ${ex.memberType} ;
                ] ;
              ]
            ] ;
            ${sh.node} [
              ${sh.property} [
                ${sh.path} ${schema.givenName} ;
              ] ;
            ] ;
          ]
        .
      `

      // when
      const result = runQuery(constructQuery(shape))

      // then
      const expected = raw`
        ${ex.people} ${hydra.member} ${tbbt('amy-farrah-fowler')} .
        ${tbbt('amy-farrah-fowler')} ${schema.givenName} "Amy" .
      `
      expect(result).to.equalDataset(expected)
    })

    it('complex sparql functions', async () => {
      // given
      const shape = parse`
        <> 
          ${sh.targetNode} ${ex.people} ;
          ${sh.property} [
            ${sh.path} ${ex.initial} ;
            ${sh.values} [
              ${dashSparql.iri}
                (
                  [
                    ${dashSparql.concat}
                      (
                        [ ${dashSparql.str} (${sh.this}) ]
                        "?i="
                        [
                          ${dashSparql.lcase}
                          (
                            [ 
                              ${dashSparql.substr}
                              (
                                [
                                  ${sh.path} ${schema.givenName} ;
                                  ${sh.nodes} [
                                    ${sh.path} [ ${sh.inversePath} ${rdf.type} ] ;
                                    ${sh.nodes} [
                                      ${sh.path} ${ex.memberType} ;
                                    ] ;
                                  ]
                                ]
                                1
                                1
                              )
                            ]
                          )
                        ]
                      )
                  ]
                )
            ] ;
          ]
        .
      `

      // when
      const result = runQuery(constructQuery(shape))

      // then
      const expected = raw`
        ${ex.people} ${ex.initial} 
          ${ex['people?i=a']} , 
          ${ex['people?i=b']} , 
          ${ex['people?i=h']} , 
          ${ex['people?i=l']} , 
          ${ex['people?i=m']} , 
          ${ex['people?i=p']} , 
          ${ex['people?i=r']} , 
          ${ex['people?i=s']} ;
        .
      `
      expect(result).to.equalDataset(expected)
    })

    it('union of triple rules', async () => {
      // given
      const shape = parse`
        <> 
          ${sh.targetNode} ${ex.people} ;
          ${sh.property} [ ${sh.path} ${rdf.type} ] ;
          ${sh.rule} [
            ${sh.subject} ${sh.this} ;
            ${sh.predicate} ${hydra.view} ;
            ${sh.object} _:alphabeticalViewId ;
          ],
          [
            ${sh.subject} _:alphabeticalViewId ;
            ${sh.predicate} ${rdf.type} ;
            ${sh.object} ${ex.AlphabeticallyPagedView} ;
          ]
        .
        
        _:alphabeticalViewId
          ${dashSparql.iri}
            (
              [ ${dashSparql.concat} ( [ ${dashSparql.str} ( ${sh.this} ) ] "#index" ) ]
            )
        .
      `

      // when
      const result = runQuery(constructQuery(shape))

      // then
      const expected = raw`
        ${ex.people} a ${hydra.Collection} .
        ${ex.people} ${hydra.view} ${ex['people#index']} .
        ${ex['people#index']} a ${ex.AlphabeticallyPagedView} .
      `
      expect(result).to.equalDataset(expected)
    })

    it('union of property value rules', async () => {
      // given
      const shape = parse`
        <> 
          ${sh.targetNode} ${ex.people} ;
          ${sh.property} [ 
            ${sh.path} ${rdf.type} ; 
          ] ;
          ${sh.property} [ 
            ${sh.path} ${hydra.view} ;
            ${sh.values} [
              ${dashSparql.iri}
              (
                [ ${dashSparql.concat} ( [ ${dashSparql.str} ( ${sh.this} ) ] "#index" ) ]
              )
            ];
            ${sh.node} [
              ${sh.property} [
                ${sh.path} ${rdf.type} ;
                ${sh.values} ${ex.AlphabeticallyPagedView} ; 
              ] ;
            ] , [
              ${sh.property} [ 
                ${sh.path} ${rdf.type} ;
                ${sh.values} ${hydra.PartialCollectionView} ;
              ] ;
            ] ;
          ] ;
        .
      `

      // when
      const query = constructQuery(shape)
      const result = runQuery(query)

      // then
      const expected = raw`
        ${ex.people} a ${hydra.Collection} .
        ${ex.people} ${hydra.view} ${ex['people#index']} .
        ${ex['people#index']} a ${ex.AlphabeticallyPagedView}, ${hydra.PartialCollectionView} .
      `
      expect(result).to.equalDataset(expected)
    })

    it('ensure VALUES when sh:this is inside UNION', async () => {
      // given
      const shape = parse`
        <> 
          ${sh.targetNode} ${ex.people} ;
          ${sh.property} [ 
            ${sh.path} ${rdf.type} ; 
          ] ;
          ${sh.property} [ 
            ${sh.path} ${hydra.view} ;
            ${sh.values} [
              ${dashSparql.iri}
              (
                [ ${dashSparql.concat} ( [ ${dashSparql.str} ( ${sh.this} ) ] "#index" ) ]
              )
            ];
          ];
        .
      `

      // when
      const query = constructQuery(shape)
      const result = runQuery(query)

      // then
      const expected = raw`
        ${ex.people} a ${hydra.Collection} .
        ${ex.people} ${hydra.view} ${ex['people#index']} .
      `
      expect(result).to.equalDataset(expected)
    })

    it('node expression target subquery', () => {
      // given
      const shape = parse`
        <> 
          ${sh.target} [
            a ${s2q.NodeExpressionTarget} ;
            ${sh.expression} [
              ${sh.limit} 1 ;
              ${sh.nodes} [
                ${sh.orderBy} [ ${sh.path} ${schema.familyName} ] ;
                ${sh.nodes} [
                  ${sh.filterShape} [
                    ${sh.expression} [
                      ${dashSparql.contains} (
                        [ ${sh.path} ${schema.jobTitle} ]
                        "physicist" 
                      )
                    ] ;
                  ] ;
                ] ;
              ] ;
            ] ;
          ] ;
          ${sh.property} [ 
            ${sh.path} ${schema.givenName} ; 
          ],[ 
            ${sh.path} ${schema.familyName} ; 
          ] ;
        .
      `

      // when
      const query = constructQuery(shape)
      const result = runQuery(query)

      // then
      const expected = raw`
        ${tbbt('sheldon-cooper')} ${schema.givenName} "Sheldon" .
        ${tbbt('sheldon-cooper')} ${schema.familyName} "Cooper" .
      `
      expect(result).to.equalDataset(expected)
    })
  })
})
