import rdf from '@zazuko/env/web.js'
import { expect } from 'chai'
import { DuplicatePatternRemover } from '../DuplicatePatternRemover.js'
import { loadQuery, stringifyQuery } from './lib/query.js'

describe('DuplicatePatternRemover', function () {
  it('removes equal consecutive OPTIONAL graph patterns', function () {
    // given
    const processor = new DuplicatePatternRemover(rdf)

    // when
    const processed = processor.process(loadQuery('duplicate-optional.rq'))

    // then
    expect(stringifyQuery(processed))
      .to.deep.equal(stringifyQuery(loadQuery('duplicate-optional.expected.rq')))
  })

  it('removes equal non-consecutive OPTIONAL graph patterns', function () {
    // given
    const processor = new DuplicatePatternRemover(rdf)

    // when
    const processed = processor.process(loadQuery('duplicate-optional.not-adjacent.rq'))

    // then
    expect(stringifyQuery(processed))
      .to.deep.equal(stringifyQuery(loadQuery('duplicate-optional.not-adjacent.expected.rq')))
  })

  it('preserves OPTIONAL graph patterns if they are not exactly the same', function () {
    // given
    const processor = new DuplicatePatternRemover(rdf)

    // when
    const processed = processor.process(loadQuery('similar-optional.rq'))

    // then
    expect(stringifyQuery(processed))
      .to.deep.equal(stringifyQuery(loadQuery('similar-optional.rq')))
  })

  it('preserves OPTIONAL graph patterns if they contain non-BGP patterns', function () {
    // given
    const processor = new DuplicatePatternRemover(rdf)

    // when
    const processed = processor.process(loadQuery('non-bgp-optional.rq'))

    // then
    expect(stringifyQuery(processed))
      .to.deep.equal(stringifyQuery(loadQuery('non-bgp-optional.rq')))
  })
})
