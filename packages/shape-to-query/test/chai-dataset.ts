import { DatasetCore } from 'rdf-js'
import { Assertion } from 'chai'
import { toCanonical } from 'rdf-dataset-ext'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface Assertion {
      equalDataset(expected: DatasetCore): void
    }
  }
}

Assertion.addMethod('equalDataset', function (this: Chai.AssertionStatic, expected: DatasetCore) {
  new Assertion(toCanonical(this._obj)).to.equal(toCanonical(expected))
})
