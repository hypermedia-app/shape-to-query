import { DatasetCore } from 'rdf-js'
import loadShacl from '@vocabulary/sh'
import loadDash from '@vocabulary/dash'
import loadDashSparql from '@vocabulary/dash-sparql'
import $rdf from 'rdf-ext'
import clownface from 'clownface'

const dataset: DatasetCore = $rdf.dataset()
  .addAll(loadShacl({ factory: $rdf }))
  .addAll(loadDash({ factory: $rdf }))
  .addAll(loadDashSparql({ factory: $rdf }))

export default clownface({ dataset })
