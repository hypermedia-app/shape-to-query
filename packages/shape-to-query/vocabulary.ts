import { DatasetCore } from 'rdf-js'
import loadShacl from '@vocabulary/sh'
import loadDash from '@vocabulary/dash'
import loadDashSparql from '@vocabulary/dash-sparql'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { dashSparql } from '@tpluscode/rdf-ns-builders/loose'

export { rdf, sh, dashSparql as sparql } from '@tpluscode/rdf-ns-builders/loose'

const dataset: DatasetCore = $rdf.dataset()
  .addAll(loadShacl({ factory: $rdf }))
  .addAll(loadDash({ factory: $rdf }))
  .addAll(loadDashSparql({ factory: $rdf }))

const vocabulary = clownface({ dataset })

vocabulary.node([
  dashSparql.and,
  dashSparql.or,
  dashSparql.add,
  dashSparql.subtract,
  dashSparql.multiply,
  dashSparql.divide,
]).addOut(rdf.type, dashSparql.AdditiveExpression)

vocabulary.node([
  dashSparql.eq,
  dashSparql.ne,
  dashSparql.ge,
  dashSparql.gt,
  dashSparql.le,
  dashSparql.lt,
]).addOut(rdf.type, dashSparql.RelationalExpression)

export default vocabulary
