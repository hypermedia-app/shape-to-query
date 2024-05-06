import { DatasetCore } from 'rdf-js'
import { Assertion } from 'chai'
import { Dataset } from '@zazuko/env/lib/Dataset.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface Assertion {
      equalDataset(expected: DatasetCore): void
    }
  }
}

Assertion.addMethod('equalDataset', function (this: Chai.AssertionStatic, expected: Dataset) {
  new Assertion(this._obj.toCanonical()).to.equal(expected.toCanonical())
})
