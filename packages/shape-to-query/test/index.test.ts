import { foaf, rdf, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { SELECT } from '@tpluscode/sparql-builder'
import { expect } from 'chai'
import { sparql } from '@tpluscode/rdf-string'
import type { GraphPointer } from 'clownface'
import { constructQuery, deleteQuery, shapeToPatterns } from '..'
import { ex } from './namespace.js'
import { parse } from './nodeFactory.js'
import './sparql.js'

describe('@hydrofoil/shape-to-query', () => {
  describe('shapeToPatterns', () => {
    context('targets', () => {
      context('class target', () => {
        it('creates an rdf:type pattern', async () => {
          // given
          const shape = await parse`
            <>
              a ${sh.NodeShape} ;
              ${sh.targetClass} ${foaf.Person} .
          `

          // when
          const patterns = shapeToPatterns(shape, { subjectVariable: 'node' })
          const query = SELECT.ALL.WHERE`${patterns.whereClause}`.build()

          // then
          expect(query).to.be.a.query(sparql`SELECT * WHERE {
            ?node ${rdf.type} ${foaf.Person}
          }`)
        })

        it('creates an rdf:type pattern for multiple targets', async () => {
          // given
          const shape = await parse`
            <>
              a ${sh.NodeShape} ;
              ${sh.targetClass} ${foaf.Person}, ${schema.Person} .
          `

          // when
          const patterns = shapeToPatterns(shape, { subjectVariable: 'node' })
          const query = SELECT.ALL.WHERE`${patterns.whereClause}`.build()

          // then
          expect(query).to.be.a.query(sparql`SELECT * WHERE {
            ?node ${rdf.type} ?node_targetClass .
            VALUES (?node_targetClass) { (${foaf.Person}) (${schema.Person}) }
          }`)
        })
      })
    })

    context('property constraints', () => {
      it('creates a simple pattern for predicate path', async () => {
        // given
        const shape = await parse`
          <>
            a ${sh.NodeShape} ;
            ${sh.property}
            [
              ${sh.path} ${foaf.name} ;
            ] ; 
          .
        `

        // when
        const patterns = shapeToPatterns(shape, { subjectVariable: 'node' })
        const query = SELECT.ALL.WHERE`${patterns.whereClause}`.build()

        // then
        expect(query).to.be.a.query(sparql`SELECT * WHERE {
          ?node ${foaf.name} ?node_0 .
        }`)
      })

      it('creates patterns for multiple properties', async () => {
        // given
        const shape = await parse`
          <>
            a ${sh.NodeShape} ;
            ${sh.property}
            [
              ${sh.path} ${foaf.name} ;
            ],
            [
              ${sh.path} ${foaf.lastName} ;
            ] ; 
          .
        `

        // when
        const patterns = shapeToPatterns(shape, { subjectVariable: 'node' })
        const query = SELECT.ALL.WHERE`${patterns.whereClause}`.build()

        // then
        expect(query).to.be.a.query(sparql`SELECT * WHERE {
          {
            ?node ${foaf.name} ?node_0 .
          }
          UNION
          {
            ?node ${foaf.lastName} ?node_1 .
          }
        }`)
      })

      it('skips deactivated properties', async () => {
        // given
        const shape = await parse`
          <>
            a ${sh.NodeShape} ;
            ${sh.property}
            [
              ${sh.path} ${foaf.name} ;
              ${sh.deactivated} true ;
            ],
            [
              ${sh.path} ${foaf.lastName} ;
            ] ; 
          .
        `

        // when
        const patterns = shapeToPatterns(shape, { subjectVariable: 'node' })
        const query = SELECT.ALL.WHERE`${patterns.whereClause}`.build()

        // then
        expect(query).to.be.a.query(sparql`SELECT * WHERE {
          ?node ${foaf.lastName} ?node_0 .
        }`)
      })
    })
  })

  describe('shapeToQuery', () => {
    describe('construct', () => {
      it('generates a query for variable', async () => {
        // given
        const shape = await parse`
          <>
            a ${sh.NodeShape} ;
            ${sh.property}
            [
              ${sh.path} ${foaf.name} ;
            ],
            [
              ${sh.path} ${foaf.lastName} ;
            ] ; 
          .
        `

        // when
        const query = constructQuery(shape, { subjectVariable: 'person' }).build()

        // then
        expect(query).to.be.a.query(sparql`CONSTRUCT {
          ?person ${foaf.name} ?person_0 .
          ?person ${foaf.lastName} ?person_1 .
        } WHERE {
          { ?person ${foaf.name} ?person_0 . }
          union
          { ?person ${foaf.lastName} ?person_1 . }
        }`)
      })

      it('generates a query for IRI node', async () => {
        // given
        const shape = await parse`
          <>
            a ${sh.NodeShape} ;
            ${sh.property}
            [
              ${sh.path} ${foaf.name} ;
            ],
            [
              ${sh.path} ${foaf.lastName} ;
            ] ; 
          .
        `

        // when
        const focusNode = ex.John
        const query = constructQuery(shape, { focusNode }).build()

        // then
        expect(query).to.be.a.query(sparql`CONSTRUCT {
          ${ex.John} ${foaf.name} ?resource_0 .
          ${ex.John} ${foaf.lastName} ?resource_1 .
        } WHERE {
          { ${ex.John} ${foaf.name} ?resource_0 . }
          union
          { ${ex.John} ${foaf.lastName} ?resource_1 . }
        }`)
      })

      it('generates a query with multiple target types', async () => {
        // given
        const shape = await parse`
          <>
            a ${sh.NodeShape} ;
            ${sh.targetClass} ${foaf.Person}, ${schema.Person} ;
            ${sh.property}
            [
              ${sh.path} ${foaf.name} ;
            ] ; 
          .
        `

        // when
        const query = constructQuery(shape).build()

        // then
        expect(query).to.be.a.query(sparql`CONSTRUCT {
          ?resource ${rdf.type} ?resource_targetClass .
          ?resource ${foaf.name} ?resource_0 .
        } WHERE {
            ?resource ${rdf.type} ?resource_targetClass .
            VALUES (?resource_targetClass) { (${foaf.Person}) (${schema.Person}) }
            ?resource ${foaf.name} ?resource_0 .
        }`)
      })

      it('generates a query with multiple targets', async () => {
        // given
        const shape = await parse`
          <>
            a ${sh.NodeShape} ;
            ${sh.targetNode} ${ex.John} ;
            ${sh.targetClass} ${schema.Person} ;
            ${sh.targetSubjectsOf} ${schema.spouse} ;
            ${sh.targetObjectsOf} ${schema.parent} ;
            ${sh.property}
            [
              ${sh.path} ${foaf.name} ;
            ] ; 
          .
        `

        // when
        const query = constructQuery(shape).build()

        // then
        expect(query).to.be.a.query(sparql`CONSTRUCT {
          ?resource ${rdf.type} ${schema.Person} .
          ?resource ${schema.spouse} ?spouse .
          ?parent ${schema.parent} ?resource .
          ?resource ${foaf.name} ?resource_0 .
        } WHERE {
          {
            VALUES (?resource) { (${ex.John}) }
          } UNION {
            ?resource ${rdf.type} ${schema.Person} .
          } UNION {
            ?resource ${schema.spouse} ?spouse .
          } UNION {
            ?parent ${schema.parent} ?resource .
          }
          ?resource ${foaf.name} ?resource_0 .
        }`)
      })

      context('shacl advanced features', () => {
        context('constant term expression', () => {
          it('binds te constant values', async () => {
            // given
            const shape = await parse`
              <>
                a ${sh.NodeShape} ;
                ${sh.property}
                [
                  ${sh.path} ${rdfs.label} ;
                  ${sh.values} "Apple"@en, "Apfel"@de, "Jabłko"@pl ;
                ] ; 
              .
            `

            // when
            const query = constructQuery(shape).build()

            // then
            expect(query).to.be.a.query(sparql`CONSTRUCT {
              ?node ${rdfs.label} ?node_0
            } WHERE {
              { BIND ("Apple"@en as ?node_0) }
              UNION
              { BIND ("Apfel"@de as ?node_0) }
              UNION
              { BIND ("Jabłko"@pl as ?node_0) }
            }`)
          })
        })
      })
    })

    describe('delete', () => {
      it('deletes from default graph', async () => {
        // given
        const shape = await parse`
          <>
            a ${sh.NodeShape} ;
            ${sh.property}
            [
              ${sh.path} ${foaf.name} ;
            ],
            [
              ${sh.path} ${foaf.lastName} ;
            ] ; 
          .
        `

        // when
        const query = deleteQuery(shape)

        // then
        expect(query).to.be.a.query(sparql`
          DELETE {
            ?resource ${foaf.name} ?resource_0 .
            ?resource ${foaf.lastName} ?resource_1 .
          }
          WHERE {
            { ?resource ${foaf.name} ?resource_0 . }
            union
            { ?resource ${foaf.lastName} ?resource_1 . }
          }
        `)
      })

      it('adds a WITH clause when graph is passed', async () => {
        // given
        const shape = await parse`
          <>
            a ${sh.NodeShape} ;
            ${sh.property}
            [
              ${sh.path} ${foaf.name} ;
            ],
            [
              ${sh.path} ${foaf.lastName} ;
            ] ; 
          .
        `

        // when
        const query = deleteQuery(shape, {
          graph: ex.Resource,
        })

        // then
        expect(query).to.be.a.query(sparql`
          WITH ${ex.Resource}
          DELETE {
            ?resource ${foaf.name} ?resource_0 .
            ?resource ${foaf.lastName} ?resource_1 .
          }
          WHERE {
            { ?resource ${foaf.name} ?resource_0 . }
            union
            { ?resource ${foaf.lastName} ?resource_1 . }
          }
        `)
      })
    })
  })

  context('shape with deep sh:node', () => {
    let shape: GraphPointer

    before(async () => {
      shape = await parse`
        <>
          a ${sh.NodeShape} ;
          ${sh.property}
          [
            ${sh.path} ${foaf.knows} ;
            ${sh.node} [
              ${sh.property} [ ${sh.path} ${foaf.name} ] ;
              ${sh.property} [
                ${sh.path} ${schema.address} ;
                ${sh.node} [
                  ${sh.property} [
                    ${sh.path} ${schema.addressLocality} ;
                  ], [
                    ${sh.path} ${schema.addressCountry} ;
                    ${sh.node} [
                      ${sh.property} [
                        ${sh.path} ${schema.name} ;
                      ] ;
                    ] ;
                  ] ;
                ] ;
              ] ;
            ] ;
          ] ; 
        .
      `
    })

    context('shapeToPatterns', () => {
      it.skip('generates union of deep paths', () => {
        // when
        const patterns = shapeToPatterns(shape, {
          subjectVariable: 'node',
        })
        const query = SELECT.ALL.WHERE`${patterns.whereClause}`.build()

        // then
        expect(query).to.be.a.query(sparql`SELECT * WHERE {
          {
            ?node ${foaf.knows} ?node_0 .
          }
          UNION
          { 
            ?node ${foaf.knows} ?node_0 .
            ?node_0 ${foaf.name} ?node_0_0 .
          }
          UNION
          {
            ?node ${foaf.knows} ?node_0 .
            ?node_0 ${schema.address} ?node_0_1 .
          }
          UNION
          {
            ?node ${foaf.knows} ?node_0 .
            ?node_0 ${schema.address} ?node_0_1 .
            ?node_0_1 ${schema.addressLocality} ?node_0_1_0 .
          }
          UNION
          {
            ?node ${foaf.knows} ?node_0 .
            ?node_0 ${schema.address} ?node_0_1 .
            ?node_0_1 ${schema.addressCountry} ?node_0_1_1 .
          }
          UNION
          {
            ?node ${foaf.knows} ?node_0 .
            ?node_0 ${schema.address} ?node_0_1 .
            ?node_0_1 ${schema.addressCountry} ?node_0_1_1 .
            ?node_0_1_1 ${schema.name} ?node_0_1_1_0 .
          }
        }`)
      })
    })

    context('construct', () => {
      it.skip('does not produce duplicate patterns in CONSTRUCT clause', () => {
        // when
        const query = constructQuery(shape, {
          subjectVariable: 'node',
        })

        // then
        expect(query.build()).to.be.a.query(sparql`CONSTRUCT {
          ?node ${foaf.knows} ?node_0 .
          ?node_0 ${foaf.name} ?node_0_0 .
          ?node_0 ${schema.address} ?node_0_1 .
          ?node_0_1 ${schema.addressLocality} ?node_0_1_0 .
          ?node_0_1 ${schema.addressCountry} ?node_0_1_1 .
          ?node_0_1_1 ${schema.name} ?node_0_1_1_0 .
        } WHERE {
          {
            ?node ${foaf.knows} ?node_0 .
          }
          UNION
          {
            ?node ${foaf.knows} ?node_0 .
            ?node_0 ${foaf.name} ?node_0_0 .
          }
          UNION
          {
            ?node ${foaf.knows} ?node_0 .
            ?node_0 ${schema.address} ?node_0_1 .
          }
          UNION
          {
            ?node ${foaf.knows} ?node_0 .
            ?node_0 ${schema.address} ?node_0_1 .
            ?node_0_1 ${schema.addressLocality} ?node_0_1_0 .
          }
          UNION
          {
            ?node ${foaf.knows} ?node_0 .
            ?node_0 ${schema.address} ?node_0_1 .
            ?node_0_1 ${schema.addressCountry} ?node_0_1_1 .
          }
          UNION
          {
            ?node ${foaf.knows} ?node_0 .
            ?node_0 ${schema.address} ?node_0_1 .
            ?node_0_1 ${schema.addressCountry} ?node_0_1_1 .
            ?node_0_1_1 ${schema.name} ?node_0_1_1_0 .
          }
        }`)
      })
    })
  })

  context('shapes with complex paths and sh:node', () => {
    context('sh:zeroOrMorePath', () => {
      it('generates a deep pattern', async () => {
        // given
        const shape = await parse`
          <>
            a ${sh.NodeShape} ;
            ${sh.property}
            [
              ${sh.path} [ ${sh.zeroOrMorePath} ${foaf.knows} ] ;
              ${sh.node}
              [
                ${sh.property}
                [
                  ${sh.path} ${foaf.name} ;
                ] ;
              ] ;
            ] ; 
          .
        `

        // when
        const patterns = shapeToPatterns(shape, { subjectVariable: 'node' })
        const query = SELECT.ALL.WHERE`${patterns.whereClause}`.build()

        // then
        expect(query).to.be.a.query(sparql`
          SELECT * WHERE {
            {
              {
                BIND(?node as ?node_0)
              } UNION {
                ?node ${foaf.knows}* ?node_0_i .
                ?node_0_i ${foaf.knows} ?node_0 .
              }
            }
            UNION
            {
              {
                BIND(?node as ?node_0)
              } UNION {
                ?node ${foaf.knows}* ?node_0_i .
                ?node_0_i ${foaf.knows} ?node_0 .
              }
              ?node_0 ${foaf.name} ?node_0_0 .
            }
          }
        `)
      })

      it.skip('produces correct CONSTRUCT clause', async () => {
        // given
        const shape = await parse`
        <>
          ${sh.property}
            [
              ${sh.path} [ ${sh.zeroOrMorePath} ${ex.nextInHierarchy} ] ;
              ${sh.node}
                [
                  ${sh.property}
                    [
                      ${sh.path} ${schema.name} ;
                    ],
                    [
                      ${sh.path} ${sh.path} ;
                      ${sh.node}
                        [
                          ${sh.property}
                            [
                              ${sh.path} ${sh.inversePath} ;
                            ] ;
                        ] ;
                    ] ;
                ] ;
            ] .
        `

        // when
        const query = constructQuery(shape, { subjectVariable: 'node' })

        // then
        expect(query).to.be.a.query(sparql`
          CONSTRUCT {
            ?node_0_i ${ex.nextInHierarchy} ?node_0 .
            ?node_0 ${schema.name} ?node_0_0 .
            ?node_0 ${sh.path} ?node_0_1 .
            ?node_0_1 ${sh.inversePath} ?node_0_1_0 .
          } WHERE {
            {
              {
                BIND(?node as ?node_0)
              } UNION {
                ?node ${ex.nextInHierarchy}* ?node_0_i .
                ?node_0_i ${ex.nextInHierarchy} ?node_0 .
              }
            }
            UNION 
            {
              {
                BIND(?node as ?node_0)
              } UNION {
                ?node ${ex.nextInHierarchy}* ?node_0_i .
                ?node_0_i ${ex.nextInHierarchy} ?node_0 .
              }
              ?node_0 ${schema.name} ?node_0_0 .
            }
            UNION 
            {
              {
                BIND(?node as ?node_0)
              } UNION {
                ?node ${ex.nextInHierarchy}* ?node_0_i .
                ?node_0_i ${ex.nextInHierarchy} ?node_0 .
              }
              ?node_0 ${sh.path} ?node_0_1 .
            }
            UNION 
            {
              {
                BIND(?node as ?node_0)
              } UNION {
                ?node ${ex.nextInHierarchy}* ?node_0_i .
                ?node_0_i ${ex.nextInHierarchy} ?node_0 .
              }
              ?node_0 ${sh.path} ?node_0_1 .
              ?node_0_1 ${sh.inversePath} ?node_0_1_0 .
            }
          }
        `)
      })
    })

    context('sh:oneOrMorePath', () => {
      it('generates a deep pattern', async () => {
        // given
        const shape = await parse`
          <>
            a ${sh.NodeShape} ;
            ${sh.property}
            [
              ${sh.path} [ ${sh.oneOrMorePath} ${foaf.knows} ] ;
              ${sh.node}
              [
                ${sh.property}
                [
                  ${sh.path} ${foaf.name} ;
                ] ;
              ] ;
            ] ; 
          .
        `

        // when
        const patterns = shapeToPatterns(shape, { subjectVariable: 'node' })
        const query = SELECT.ALL.WHERE`${patterns.whereClause}`.build()

        // then
        expect(query).to.be.a.query(sparql`
          SELECT * WHERE {
            {
              ?node ${foaf.knows}* ?node_0_i .
              ?node_0_i ${foaf.knows} ?node_0 .
            }
            UNION
            {
              ?node ${foaf.knows}* ?node_0_i .
              ?node_0_i ${foaf.knows} ?node_0 .
              ?node_0 ${foaf.name} ?node_0_0 .
            }
          }
        `)
      })
    })
  })
})
