import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { ex } from '../../namespace'
import { HasValueConstraintComponent } from '../../../model/constraint/hasValue'
import { createVariableSequence } from '../../../lib/variableSequence'

describe('model/constraint/hasValue', () => {
  const variable = createVariableSequence('hv')

  it('returns empty patterns when used in the root shape', () => {
    // given
    const constraint = new HasValueConstraintComponent([ex.foo, ex.bar])

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
