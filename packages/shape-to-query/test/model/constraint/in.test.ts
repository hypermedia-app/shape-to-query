import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { InConstraintComponent } from '../../../model/constraint/in'
import { ex } from '../../namespace'
import { createVariableSequence } from '../../../lib/variableSequence'

describe('model/constraint/in', () => {
  const variable = createVariableSequence('in')

  it('returns empty patterns when used in the root shape', () => {
    // given
    const constraint = new InConstraintComponent([ex.foo, ex.bar])

    // when
    const whereClause = constraint.buildPatterns({
      focusNode: $rdf.namedNode('foo'),
      valueNode: variable(),
      variable,
    })

    // then
    expect(whereClause).to.eq('')
  })
})
