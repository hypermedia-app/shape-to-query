import { Term } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'
import TermMap from '@rdfjs/term-map'
import { ConstraintComponent } from './ConstraintComponent'
import { AndConstraintComponent } from './and'
import { OrConstraintComponent } from './or'
import { NodeConstraintComponent } from './node'

interface ConstraintComponentStatic {
  fromPointer(parameter: GraphPointer): ConstraintComponent
}

export const constraintComponents = new TermMap<Term, ConstraintComponentStatic>([
  [sh.AndConstraintComponent, AndConstraintComponent],
  [sh.OrConstraintComponent, OrConstraintComponent],
  [sh.NodeConstraintComponent, NodeConstraintComponent],
])
