/* eslint-disable import/no-extraneous-dependencies */
import { writeFile } from 'fs/promises'
import * as url from 'url'
import * as path from 'path'
import * as shapeTo from '@hydrofoil/shape-to-query/index.js'
import { nodeExpressions } from '@hydrofoil/shape-to-query/nodeExpressions.js'
import $rdf from '@zazuko/env-node'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { globby } from 'globby'
import { HydraCollectionMemberExpression } from './expressions/HydraCollectionMembers.js'
import { ShorthandSubselectExpression } from './expressions/ShorthandSubselect.js'

import './public/how-tos/example/palindrome/index.js'

const cwd = url.fileURLToPath(new URL('.', import.meta.url))
const toAbsolutePath = (arg) => path.resolve(cwd, arg)

nodeExpressions.push(
  HydraCollectionMemberExpression,
  ShorthandSubselectExpression,
)

;(async function () {
  const shapeGraphs = await globby(process.argv[2] || '**/example/**/*.ttl', { cwd })

  await Promise.all(shapeGraphs.map(toAbsolutePath).map(async shapeGraphPath => {
    let query
    try {
      const dataset = await $rdf.dataset().import($rdf.fromFile(shapeGraphPath))
      const shapePointer = $rdf.clownface({ dataset })
        .has(rdf.type, sh.NodeShape)
        .toArray().shift()
      query = shapeTo.constructQuery(shapePointer)

      await writeFile(`${shapeGraphPath}.rq`, query)
    } catch (e) {
      await writeFile(`${shapeGraphPath}.rq`, `${query}

${e.message}
at
${e.stack}`)
    }
  }))
})()
