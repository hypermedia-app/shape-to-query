/* eslint-disable import/no-extraneous-dependencies */
import { writeFile } from 'fs/promises'
import * as url from 'url'
import * as path from 'path'
import * as shapeTo from '@hydrofoil/shape-to-query/index.js'
import { nodeExpressions } from '@hydrofoil/shape-to-query/nodeExpressions.js'
import { fromFile } from 'rdf-utils-fs'
import $rdf from 'rdf-ext'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import sparql from 'sparqljs'
import { globby } from 'globby'
import { HydraCollectionMemberExpression } from './expressions/HydraCollectionMembers.js'
import { ShorthandSubselectExpression } from './expressions/ShorthandSubselect.js'

const cwd = url.fileURLToPath(new URL('.', import.meta.url))
const toAbsolutePath = (arg) => path.resolve(cwd, arg)

const parser = new sparql.Parser()
const generator = new sparql.Generator()

nodeExpressions.push(
  HydraCollectionMemberExpression,
  ShorthandSubselectExpression,
)

;(async function () {
  const shapeGraphs = await globby('**/example/*.ttl', { cwd })

  await Promise.all(shapeGraphs.map(toAbsolutePath).map(async shapeGraphPath => {
    let generated
    try {
      const dataset = await $rdf.dataset().import(fromFile(shapeGraphPath))
      const shapePointer = $rdf.clownface({ dataset })
        .has(rdf.type, sh.NodeShape)
        .toArray().shift()
      generated = shapeTo.constructQuery(shapePointer).build()
      const query = parser.parse(generated)

      await writeFile(`${shapeGraphPath}.rq`, generator.stringify(query))
    } catch (e) {
      await writeFile(`${shapeGraphPath}.rq`, generated + '\n\n' + e.message)
    }
  }))
})()
