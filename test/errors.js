
const test = require('tape')
const dequal = require('fast-deep-equal')

const imports = require('../')
const errors = imports.rpcErrors
const JsonRpcError = imports.JsonRpcError
const EthJsonRpcError = imports.EthJsonRpcError
const getMessageFromCode = require('../src/utils').getMessageFromCode
const CODES = require('../src/errorCodes.json')
const jsonRpcCodes = CODES.jsonRpc
const ethJsonRpcCodes = CODES.eth
const serverErrorMessage = require('../src/utils').JSON_RPC_SERVER_ERROR_MESSAGE

const jsonRpcCodeValues = Object.values(jsonRpcCodes)

const dummyData = { foo: 'bar' }

const SERVER_ERROR_CODE = -32098
const CUSTOM_ERROR_CODE = 1001
const CUSTOM_ERROR_MESSAGE = 'foo'

// we just iterate over all keys on the errors object and call and check
// each error in turn
test('test exported object for correctness', t => {

  t.comment('Begin: JSON RPC 2.0')
  Object.keys(errors).forEach(k => {
    if (k !== 'eth') {
      if (k === 'server') {
        validateError(t, errors[k](
          SERVER_ERROR_CODE, null, { ...dummyData }), k, dummyData
        )
      } else validateError(t, errors[k](null, { ...dummyData }), k, dummyData)
    }
  })
  t.comment('End: JSON RPC 2.0')

  t.comment('Begin: ETH JSON RPC')
  Object.keys(errors.eth).forEach(k => {
    if (k === 'nonStandard') {
      validateError(t, errors.eth[k](
        CUSTOM_ERROR_CODE, CUSTOM_ERROR_MESSAGE, { ...dummyData }), k, dummyData
      )
    } else {
      validateError(t, errors.eth[k](null, { ...dummyData }), k, dummyData)
    }
  })
  t.comment('End: ETH JSON RPC')
  t.end()
})

function validateError(t, err, key, data) {

  t.comment(`testing: ${key}`)
  t.ok(Number.isInteger(err.code), 'code is an integer')
  t.ok(typeof err.message === 'string', 'message is a string')
  t.ok(dequal(err.data, data), 'data is as provided')

  if (err instanceof EthJsonRpcError) {
    t.ok(err.code >= 1000 && err.code < 5000, 'code has valid value')

    if (key === 'nonStandard') {
      t.ok(
        err.code === CUSTOM_ERROR_CODE &&
        err.message === CUSTOM_ERROR_MESSAGE,
        'code and message values correspond for error type'
      )
    } else {
      t.ok(
        err.code === ethJsonRpcCodes[key] &&
        err.message === getMessageFromCode(ethJsonRpcCodes[key]),
        'code and message values correspond for error type'
      )
    }
  } else if (err instanceof JsonRpcError) {

    t.ok(
      jsonRpcCodeValues.includes(err.code) ||
      err.code <= -32000 && err.code >= -32099,
      'code has valid value'
    )

    if (key === 'server') {
      t.ok(
        err.code <= -32000 && err.code >= -32099 &&
        err.message === serverErrorMessage,
        'code and message values correspond for error type'
      )
    } else {
      t.ok(
        err.code === jsonRpcCodes[key] &&
        err.message === getMessageFromCode(jsonRpcCodes[key]),
        'code and message values correspond for error type'
      )
    }
  }
}