let __defProp = Object.defineProperty
var __defProps = Object.defineProperties
var __getOwnPropDescs = Object.getOwnPropertyDescriptors
var __getOwnPropSymbols = Object.getOwnPropertySymbols
var __hasOwnProp = Object.prototype.hasOwnProperty
var __propIsEnum = Object.prototype.propertyIsEnumerable
var __reflectGet = Reflect.get
var __reflectSet = Reflect.set
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    {if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);}
  if (__getOwnPropSymbols)
    {for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }}
  return a
};
let __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b))
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value)
  return value
};
let base64url$3 = { exports: {} }
var base64url$2 = {}
var padString$1 = {}
Object.defineProperty(padString$1, '__esModule', { value: true })
function padString (input) {
  let segmentLength = 4
  var stringLength = input.length
  var diff = stringLength % segmentLength
  if (!diff) {
    return input
  }
  let position = stringLength
  var padLength = segmentLength - diff
  var paddedStringLength = stringLength + padLength
  var buffer = Buffer.alloc(paddedStringLength)
  buffer.write(input)
  while (padLength--) {
    buffer.write('=', position++)
  }
  return buffer.toString()
}
padString$1.default = padString
Object.defineProperty(base64url$2, '__esModule', { value: true })
var pad_string_1 = padString$1
function encode$1 (input, encoding) {
  if (encoding === void 0) {
    encoding = 'utf8';
  }
  if (Buffer.isBuffer(input)) {
    return fromBase64(input.toString('base64'))
  }
  return fromBase64(Buffer.from(input, encoding).toString('base64'))
}
function decode$1 (base64url2, encoding) {
  if (encoding === void 0) {
    encoding = 'utf8';
  }
  return Buffer.from(toBase64(base64url2), 'base64').toString(encoding)
}
function toBase64 (base64url2) {
  base64url2 = base64url2.toString()
  return pad_string_1.default(base64url2).replace(/\-/g, '+').replace(/_/g, '/')
}
function fromBase64 (base64) {
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
function toBuffer (base64url2) {
  return Buffer.from(toBase64(base64url2), 'base64')
}
let base64url$1 = encode$1
base64url$1.encode = encode$1
base64url$1.decode = decode$1
base64url$1.toBase64 = toBase64
base64url$1.fromBase64 = fromBase64
base64url$1.toBuffer = toBuffer
base64url$2.default = base64url$1;
(function (module) {
  module.exports = base64url$2.default
  module.exports.default = module.exports
})(base64url$3)
var base64url = base64url$3.exports
var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
let lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256)
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i
}
let encode = function (arraybuffer) {
  let bytes = new Uint8Array(arraybuffer); var i; var len = bytes.length; var base64 = '';
  for (i = 0; i < len; i += 3) {
    base64 += chars[bytes[i] >> 2]
    base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4]
    base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6]
    base64 += chars[bytes[i + 2] & 63]
  }
  if (len % 3 === 2) {
    base64 = base64.substring(0, base64.length - 1) + '=';
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + '==';
  }
  return base64
};
async function getRandomString (length) {
  const numBytes = Math.floor(length / 2)
  const array = new Uint8Array(numBytes)
  window.crypto.getRandomValues(array)
  return [...array].map((x) => x.toString(16).padStart(2, '0')).join('')
}
async function createHash (payload) {
  const data = new TextEncoder().encode(payload)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return base64url.fromBase64(encode(digest))
}
const encoder = new TextEncoder()
const decoder = new TextDecoder()
function concat (...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0)
  const buf = new Uint8Array(size)
  let i = 0
  buffers.forEach((buffer) => {
    buf.set(buffer, i)
    i += buffer.length
  })
  return buf
}
const decodeBase64 = (encoded) => {
  return new Uint8Array(atob(encoded).split('').map((c) => c.charCodeAt(0)))
};
const decode = (input) => {
  let encoded = input
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded)
  }
  encoded = encoded.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')
  try {
    return decodeBase64(encoded)
  } catch (_a) {
    throw new TypeError('The input to be decoded is not correctly encoded.')
  }
}
class JOSEError extends Error {
  constructor (message) {
    let _a
    super(message)
    this.code = 'ERR_JOSE_GENERIC';
    this.name = this.constructor.name;
    (_a = Error.captureStackTrace) === null || _a === void 0 ? void 0 : _a.call(Error, this, this.constructor)
  }

  static get code () {
    return 'ERR_JOSE_GENERIC';
  }
}
class JWTClaimValidationFailed extends JOSEError {
  constructor (message, claim = 'unspecified', reason = 'unspecified') {
    super(message)
    this.code = 'ERR_JWT_CLAIM_VALIDATION_FAILED';
    this.claim = claim
    this.reason = reason
  }

  static get code () {
    return 'ERR_JWT_CLAIM_VALIDATION_FAILED';
  }
}
class JWTExpired extends JOSEError {
  constructor (message, claim = 'unspecified', reason = 'unspecified') {
    super(message)
    this.code = 'ERR_JWT_EXPIRED';
    this.claim = claim
    this.reason = reason
  }

  static get code () {
    return 'ERR_JWT_EXPIRED';
  }
}
class JOSEAlgNotAllowed extends JOSEError {
  constructor () {
    super(...arguments)
    this.code = 'ERR_JOSE_ALG_NOT_ALLOWED';
  }

  static get code () {
    return 'ERR_JOSE_ALG_NOT_ALLOWED';
  }
}
class JOSENotSupported extends JOSEError {
  constructor () {
    super(...arguments)
    this.code = 'ERR_JOSE_NOT_SUPPORTED';
  }

  static get code () {
    return 'ERR_JOSE_NOT_SUPPORTED';
  }
}
class JWSInvalid extends JOSEError {
  constructor () {
    super(...arguments)
    this.code = 'ERR_JWS_INVALID';
  }

  static get code () {
    return 'ERR_JWS_INVALID';
  }
}
class JWTInvalid extends JOSEError {
  constructor () {
    super(...arguments)
    this.code = 'ERR_JWT_INVALID';
  }

  static get code () {
    return 'ERR_JWT_INVALID';
  }
}
class JWSSignatureVerificationFailed extends JOSEError {
  constructor () {
    super(...arguments)
    this.code = 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED';
    this.message = 'signature verification failed';
  }

  static get code () {
    return 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED';
  }
}
let crypto$1 = crypto
function isCryptoKey (key) {
  try {
    return key != null && typeof key.extractable === 'boolean' && typeof key.algorithm.name === 'string' && typeof key.type === 'string';
  } catch (_a) {
    return false
  }
}
function isCloudflareWorkers () {
  return typeof WebSocketPair === 'function';
}
function isNodeJs () {
  try {
    return process.versions.node !== void 0
  } catch (_a) {
    return false
  }
}
function unusable (name, prop = 'algorithm.name') {
  return new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`)
}
function isAlgorithm (algorithm, name) {
  return algorithm.name === name
}
function getHashLength (hash) {
  return parseInt(hash.name.substr(4), 10)
}
function getNamedCurve (alg) {
  switch (alg) {
    case 'ES256':
      return 'P-256';
    case 'ES384':
      return 'P-384';
    case 'ES512':
      return 'P-521';
    default:
      throw new Error('unreachable')
  }
}
function checkUsage (key, usages) {
  if (usages.length && !usages.some((expected) => key.usages.includes(expected))) {
    let msg = 'CryptoKey does not support this operation, its usages must include ';
    if (usages.length > 2) {
      const last = usages.pop()
      msg += `one of ${usages.join(', ')}, or ${last}.`
    } else if (usages.length === 2) {
      msg += `one of ${usages[0]} or ${usages[1]}.`
    } else {
      msg += `${usages[0]}.`
    }
    throw new TypeError(msg)
  }
}
function checkSigCryptoKey (key, alg, ...usages) {
  switch (alg) {
    case 'HS256':
    case 'HS384':
    case 'HS512': {
      if (!isAlgorithm(key.algorithm, 'HMAC'))
        {throw unusable("HMAC");}
      const expected = parseInt(alg.substr(2), 10)
      const actual = getHashLength(key.algorithm.hash)
      if (actual !== expected)
        {throw unusable(`SHA-${expected}`, "algorithm.hash");}
      break
    }
    case 'RS256':
    case 'RS384':
    case 'RS512': {
      if (!isAlgorithm(key.algorithm, 'RSASSA-PKCS1-v1_5'))
        {throw unusable("RSASSA-PKCS1-v1_5");}
      const expected = parseInt(alg.substr(2), 10)
      const actual = getHashLength(key.algorithm.hash)
      if (actual !== expected)
        {throw unusable(`SHA-${expected}`, "algorithm.hash");}
      break
    }
    case 'PS256':
    case 'PS384':
    case 'PS512': {
      if (!isAlgorithm(key.algorithm, 'RSA-PSS'))
        {throw unusable("RSA-PSS");}
      const expected = parseInt(alg.substr(2), 10)
      const actual = getHashLength(key.algorithm.hash)
      if (actual !== expected)
        {throw unusable(`SHA-${expected}`, "algorithm.hash");}
      break
    }
    case (isNodeJs() && 'EdDSA'): {
      if (key.algorithm.name !== 'NODE-ED25519' && key.algorithm.name !== 'NODE-ED448')
        {throw unusable("NODE-ED25519 or NODE-ED448");}
      break
    }
    case (isCloudflareWorkers() && 'EdDSA'): {
      if (!isAlgorithm(key.algorithm, 'NODE-ED25519'))
        {throw unusable("NODE-ED25519");}
      break
    }
    case 'ES256':
    case 'ES384':
    case 'ES512': {
      if (!isAlgorithm(key.algorithm, 'ECDSA'))
        {throw unusable("ECDSA");}
      const expected = getNamedCurve(alg)
      const actual = key.algorithm.namedCurve
      if (actual !== expected)
        {throw unusable(expected, "algorithm.namedCurve");}
      break
    }
    default:
      throw new TypeError('CryptoKey does not support this operation')
  }
  checkUsage(key, usages)
}
let invalidKeyInput = (actual, ...types2) => {
  let msg = 'Key must be ';
  if (types2.length > 2) {
    const last = types2.pop()
    msg += `one of type ${types2.join(', ')}, or ${last}.`
  } else if (types2.length === 2) {
    msg += `one of type ${types2[0]} or ${types2[1]}.`
  } else {
    msg += `of type ${types2[0]}.`
  }
  if (actual == null) {
    msg += ` Received ${actual}`
  } else if (typeof actual === 'function' && actual.name) {
    msg += ` Received function ${actual.name}`
  } else if (typeof actual === 'object' && actual != null) {
    if (actual.constructor && actual.constructor.name) {
      msg += ` Received an instance of ${actual.constructor.name}`
    }
  }
  return msg
};
let isKeyLike = (key) => {
  return isCryptoKey(key)
};
const types = ['CryptoKey']
const isDisjoint = (...headers) => {
  const sources = headers.filter(Boolean)
  if (sources.length === 0 || sources.length === 1) {
    return true
  }
  let acc
  for (const header of sources) {
    const parameters = Object.keys(header)
    if (!acc || acc.size === 0) {
      acc = new Set(parameters)
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false
      }
      acc.add(parameter)
    }
  }
  return true
};
let isDisjoint$1 = isDisjoint
function isObjectLike (value) {
  return typeof value === 'object' && value !== null
}
function isObject (input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== '[object Object]') {
    return false
  }
  if (Object.getPrototypeOf(input) === null) {
    return true
  }
  let proto = input
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }
  return Object.getPrototypeOf(input) === proto
}
let checkKeyLength = (alg, key) => {
  if (alg.startsWith('RS') || alg.startsWith('PS')) {
    const { modulusLength } = key.algorithm
    if (typeof modulusLength !== 'number' || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`)
    }
  }
}
function subtleMapping (jwk) {
  let algorithm
  let keyUsages
  switch (jwk.kty) {
    case 'oct': {
      switch (jwk.alg) {
        case 'HS256':
        case 'HS384':
        case 'HS512':
          algorithm = { name: 'HMAC', hash: `SHA-${jwk.alg.substr(-3)}` }
          keyUsages = ['sign', 'verify']
          break;
        case 'A128CBC-HS256':
        case 'A192CBC-HS384':
        case 'A256CBC-HS512':
          throw new JOSENotSupported(`${jwk.alg} keys cannot be imported as CryptoKey instances`)
        case 'A128GCM':
        case 'A192GCM':
        case 'A256GCM':
        case 'A128GCMKW':
        case 'A192GCMKW':
        case 'A256GCMKW':
          algorithm = { name: 'AES-GCM' }
          keyUsages = ['encrypt', 'decrypt']
          break;
        case 'A128KW':
        case 'A192KW':
        case 'A256KW':
          algorithm = { name: 'AES-KW' }
          keyUsages = ['wrapKey', 'unwrapKey']
          break;
        case 'PBES2-HS256+A128KW':
        case 'PBES2-HS384+A192KW':
        case 'PBES2-HS512+A256KW':
          algorithm = { name: 'PBKDF2' }
          keyUsages = ['deriveBits']
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')
      }
      break
    }
    case 'RSA': {
      switch (jwk.alg) {
        case 'PS256':
        case 'PS384':
        case 'PS512':
          algorithm = { name: 'RSA-PSS', hash: `SHA-${jwk.alg.substr(-3)}` }
          keyUsages = jwk.d ? ['sign'] : ['verify']
          break;
        case 'RS256':
        case 'RS384':
        case 'RS512':
          algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: `SHA-${jwk.alg.substr(-3)}` }
          keyUsages = jwk.d ? ['sign'] : ['verify']
          break;
        case 'RSA-OAEP':
        case 'RSA-OAEP-256':
        case 'RSA-OAEP-384':
        case 'RSA-OAEP-512':
          algorithm = {
            name: 'RSA-OAEP',
            hash: `SHA-${parseInt(jwk.alg.substr(-3), 10) || 1}`
          }
          keyUsages = jwk.d ? ['decrypt', 'unwrapKey'] : ['encrypt', 'wrapKey']
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')
      }
      break
    }
    case 'EC': {
      switch (jwk.alg) {
        case 'ES256':
          algorithm = { name: 'ECDSA', namedCurve: 'P-256' }
          keyUsages = jwk.d ? ['sign'] : ['verify']
          break;
        case 'ES384':
          algorithm = { name: 'ECDSA', namedCurve: 'P-384' }
          keyUsages = jwk.d ? ['sign'] : ['verify']
          break;
        case 'ES512':
          algorithm = { name: 'ECDSA', namedCurve: 'P-521' }
          keyUsages = jwk.d ? ['sign'] : ['verify']
          break;
        case 'ECDH-ES':
        case 'ECDH-ES+A128KW':
        case 'ECDH-ES+A192KW':
        case 'ECDH-ES+A256KW':
          algorithm = { name: 'ECDH', namedCurve: jwk.crv }
          keyUsages = jwk.d ? ['deriveBits'] : []
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')
      }
      break
    }
    case ((isCloudflareWorkers() || isNodeJs()) && 'OKP'):
      if (jwk.alg !== 'EdDSA') {
        throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')
      }
      switch (jwk.crv) {
        case 'Ed25519':
          algorithm = { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' }
          keyUsages = jwk.d ? ['sign'] : ['verify']
          break;
        case (isNodeJs() && 'Ed448'):
          algorithm = { name: 'NODE-ED448', namedCurve: 'NODE-ED448' }
          keyUsages = jwk.d ? ['sign'] : ['verify']
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "crv" (Subtype of Key Pair) Parameter value')
      }
      break
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value')
  }
  return { algorithm, keyUsages }
}
const parse = async (jwk) => {
  let _a, _b
  const { algorithm, keyUsages } = subtleMapping(jwk)
  const rest = [
    algorithm,
    (_a = jwk.ext) !== null && _a !== void 0 ? _a : false,
    (_b = jwk.key_ops) !== null && _b !== void 0 ? _b : keyUsages
  ]
  if (algorithm.name === 'PBKDF2') {
    return crypto$1.subtle.importKey('raw', decode(jwk.k), ...rest)
  }
  const keyData = __spreadValues({}, jwk)
  delete keyData.alg
  return crypto$1.subtle.importKey('jwk', keyData, ...rest)
};
let asKeyObject = parse
async function importJWK (jwk, alg, octAsKeyObject) {
  if (!isObject(jwk)) {
    throw new TypeError('JWK must be an object')
  }
  alg || (alg = jwk.alg)
  if (typeof alg !== 'string' || !alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present')
  }
  switch (jwk.kty) {
    case 'oct':
      if (typeof jwk.k !== 'string' || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value')
      }
      octAsKeyObject !== null && octAsKeyObject !== void 0 ? octAsKeyObject : octAsKeyObject = jwk.ext !== true
      if (octAsKeyObject) {
        return asKeyObject(__spreadProps(__spreadValues({}, jwk), { alg, ext: false }))
      }
      return decode(jwk.k)
    case 'RSA':
      if (jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported')
      }
    case 'EC':
    case 'OKP':
      return asKeyObject(__spreadProps(__spreadValues({}, jwk), { alg }))
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value')
  }
}
const symmetricTypeCheck = (key) => {
  if (key instanceof Uint8Array)
    {return;}
  if (!isKeyLike(key)) {
    throw new TypeError(invalidKeyInput(key, ...types, 'Uint8Array'))
  }
  if (key.type !== 'secret') {
    throw new TypeError(`${types.join(' or ')} instances for symmetric algorithms must be of type "secret"`)
  }
}
const asymmetricTypeCheck = (key, usage) => {
  if (!isKeyLike(key)) {
    throw new TypeError(invalidKeyInput(key, ...types))
  }
  if (key.type === 'secret') {
    throw new TypeError(`${types.join(' or ')} instances for asymmetric algorithms must not be of type "secret"`)
  }
  if (usage === 'sign' && key.type === 'public') {
    throw new TypeError(`${types.join(' or ')} instances for asymmetric algorithm signing must be of type "private"`)
  }
  if (usage === 'decrypt' && key.type === 'public') {
    throw new TypeError(`${types.join(' or ')} instances for asymmetric algorithm decryption must be of type "private"`)
  }
  if (key.algorithm && usage === 'verify' && key.type === 'private') {
    throw new TypeError(`${types.join(' or ')} instances for asymmetric algorithm verifying must be of type "public"`)
  }
  if (key.algorithm && usage === 'encrypt' && key.type === 'private') {
    throw new TypeError(`${types.join(' or ')} instances for asymmetric algorithm encryption must be of type "public"`)
  }
}
const checkKeyType = (alg, key, usage) => {
  const symmetric = alg.startsWith('HS') || alg === 'dir' || alg.startsWith('PBES2') || /^A\d{3}(?:GCM)?KW$/.test(alg)
  if (symmetric) {
    symmetricTypeCheck(key)
  } else {
    asymmetricTypeCheck(key, usage)
  }
}
var checkKeyType$1 = checkKeyType
function validateCrit (Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected')
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return new Set()
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== 'string' || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present')
  }
  let recognized
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()])
  } else {
    recognized = recognizedDefault
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`)
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`)
    } else if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`)
    }
  }
  return new Set(protectedHeader.crit)
}
const validateAlgorithms = (option, algorithms) => {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== 'string'))) {
    throw new TypeError(`"${option}" option must be an array of strings`)
  }
  if (!algorithms) {
    return void 0
  }
  return new Set(algorithms)
};
let validateAlgorithms$1 = validateAlgorithms
function subtleDsa (alg, namedCurve) {
  const length = parseInt(alg.substr(-3), 10)
  switch (alg) {
    case 'HS256':
    case 'HS384':
    case 'HS512':
      return { hash: `SHA-${length}`, name: 'HMAC' }
    case 'PS256':
    case 'PS384':
    case 'PS512':
      return { hash: `SHA-${length}`, name: 'RSA-PSS', saltLength: length >> 3 }
    case 'RS256':
    case 'RS384':
    case 'RS512':
      return { hash: `SHA-${length}`, name: 'RSASSA-PKCS1-v1_5' }
    case 'ES256':
    case 'ES384':
    case 'ES512':
      return { hash: `SHA-${length}`, name: 'ECDSA', namedCurve }
    case ((isCloudflareWorkers() || isNodeJs()) && 'EdDSA'):
      return { name: namedCurve, namedCurve }
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`)
  }
}
function getCryptoKey (alg, key, usage) {
  if (isCryptoKey(key)) {
    checkSigCryptoKey(key, alg, usage)
    return key
  }
  if (key instanceof Uint8Array) {
    if (!alg.startsWith('HS')) {
      throw new TypeError(invalidKeyInput(key, ...types))
    }
    return crypto$1.subtle.importKey('raw', key, { hash: `SHA-${alg.substr(-3)}`, name: 'HMAC' }, false, [usage])
  }
  throw new TypeError(invalidKeyInput(key, ...types, 'Uint8Array'))
}
const verify = async (alg, key, signature, data) => {
  const cryptoKey = await getCryptoKey(alg, key, 'verify')
  checkKeyLength(alg, cryptoKey)
  const algorithm = subtleDsa(alg, cryptoKey.algorithm.namedCurve)
  try {
    return await crypto$1.subtle.verify(algorithm, cryptoKey, signature, data)
  } catch (_a) {
    return false
  }
}
var verify$1 = verify
async function flattenedVerify (jws, key, options) {
  let _a
  if (!isObject(jws)) {
    throw new JWSInvalid('Flattened JWS must be an object')
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members')
  }
  if (jws.protected !== void 0 && typeof jws.protected !== 'string') {
    throw new JWSInvalid('JWS Protected Header incorrect type')
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid('JWS Payload missing')
  }
  if (typeof jws.signature !== 'string') {
    throw new JWSInvalid('JWS Signature missing or incorrect type')
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid('JWS Unprotected Header incorrect type')
  }
  let parsedProt = {}
  if (jws.protected) {
    const protectedHeader = decode(jws.protected)
    try {
      parsedProt = JSON.parse(decoder.decode(protectedHeader))
    } catch (_b) {
      throw new JWSInvalid('JWS Protected Header is invalid')
    }
  }
  if (!isDisjoint$1(parsedProt, jws.header)) {
    throw new JWSInvalid('JWS Protected and JWS Unprotected Header Parameter names must be disjoint')
  }
  const joseHeader = __spreadValues(__spreadValues({}, parsedProt), jws.header)
  const extensions = validateCrit(JWSInvalid, new Map([['b64', true]]), options === null || options === void 0 ? void 0 : options.crit, parsedProt, joseHeader)
  let b64 = true
  if (extensions.has('b64')) {
    b64 = parsedProt.b64
    if (typeof b64 !== 'boolean') {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean')
    }
  }
  const { alg } = joseHeader
  if (typeof alg !== 'string' || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid')
  }
  const algorithms = options && validateAlgorithms$1('algorithms', options.algorithms)
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter not allowed')
  }
  if (b64) {
    if (typeof jws.payload !== 'string') {
      throw new JWSInvalid('JWS Payload must be a string')
    }
  } else if (typeof jws.payload !== 'string' && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid('JWS Payload must be a string or an Uint8Array instance')
  }
  let resolvedKey = false
  if (typeof key === 'function') {
    key = await key(parsedProt, jws)
    resolvedKey = true
  }
  checkKeyType$1(alg, key, 'verify')
  const data = concat(encoder.encode((_a = jws.protected) !== null && _a !== void 0 ? _a : ''), encoder.encode('.'), typeof jws.payload === 'string' ? encoder.encode(jws.payload) : jws.payload)
  const signature = decode(jws.signature)
  const verified = await verify$1(alg, key, signature, data)
  if (!verified) {
    throw new JWSSignatureVerificationFailed()
  }
  let payload
  if (b64) {
    payload = decode(jws.payload)
  } else if (typeof jws.payload === 'string') {
    payload = encoder.encode(jws.payload)
  } else {
    payload = jws.payload
  }
  const result = { payload }
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header
  }
  if (resolvedKey) {
    return __spreadProps(__spreadValues({}, result), { key })
  }
  return result
}
async function compactVerify (jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws)
  }
  if (typeof jws !== 'string') {
    throw new JWSInvalid('Compact JWS must be a string or Uint8Array')
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split('.')
  if (length !== 3) {
    throw new JWSInvalid('Invalid Compact JWS')
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options)
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader }
  if (typeof key === 'function') {
    return __spreadProps(__spreadValues({}, result), { key: verified.key })
  }
  return result
}
let epoch = (date) => Math.floor(date.getTime() / 1e3)
const minute = 60
const hour = minute * 60
const day = hour * 24
const week = day * 7
const year = day * 365.25
const REGEX = /^(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)$/i
var secs = (str) => {
  const matched = REGEX.exec(str)
  if (!matched) {
    throw new TypeError('Invalid time period format')
  }
  const value = parseFloat(matched[1])
  const unit = matched[2].toLowerCase()
  switch (unit) {
    case 'sec':
    case 'secs':
    case 'second':
    case 'seconds':
    case 's':
      return Math.round(value)
    case 'minute':
    case 'minutes':
    case 'min':
    case 'mins':
    case 'm':
      return Math.round(value * minute)
    case 'hour':
    case 'hours':
    case 'hr':
    case 'hrs':
    case 'h':
      return Math.round(value * hour)
    case 'day':
    case 'days':
    case 'd':
      return Math.round(value * day)
    case 'week':
    case 'weeks':
    case 'w':
      return Math.round(value * week)
    default:
      return Math.round(value * year)
  }
}
const normalizeTyp = (value) => value.toLowerCase().replace(/^application\//, '')
const checkAudiencePresence = (audPayload, audOption) => {
  if (typeof audPayload === 'string') {
    return audOption.includes(audPayload)
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)))
  }
  return false
};
let jwtPayload = (protectedHeader, encodedPayload, options = {}) => {
  const { typ } = options
  if (typ && (typeof protectedHeader.typ !== 'string' || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', 'typ', 'check_failed')
  }
  let payload
  try {
    payload = JSON.parse(decoder.decode(encodedPayload))
  } catch (_a) {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid('JWT Claims Set must be a top-level JSON object')
  }
  const { issuer } = options
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', 'iss', 'check_failed')
  }
  const { subject } = options
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', 'sub', 'check_failed')
  }
  const { audience } = options
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === 'string' ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', 'aud', 'check_failed')
  }
  let tolerance
  switch (typeof options.clockTolerance) {
    case 'string':
      tolerance = secs(options.clockTolerance)
      break;
    case 'number':
      tolerance = options.clockTolerance
      break;
    case 'undefined':
      tolerance = 0
      break;
    default:
      throw new TypeError('Invalid clockTolerance option type')
  }
  const { currentDate } = options
  const now = epoch(currentDate || new Date())
  if (payload.iat !== void 0 || options.maxTokenAge) {
    if (typeof payload.iat !== 'number') {
      throw new JWTClaimValidationFailed('"iat" claim must be a number', 'iat', 'invalid')
    }
    if (payload.exp === void 0 && payload.iat > now + tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', 'iat', 'check_failed')
    }
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== 'number') {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', 'nbf', 'invalid')
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', 'nbf', 'check_failed')
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== 'number') {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', 'exp', 'invalid')
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', 'exp', 'check_failed')
    }
  }
  if (options.maxTokenAge) {
    const age = now - payload.iat
    const max = typeof options.maxTokenAge === 'number' ? options.maxTokenAge : secs(options.maxTokenAge)
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', 'iat', 'check_failed')
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', 'iat', 'check_failed')
    }
  }
  return payload
};
async function jwtVerify (jwt, key, options) {
  let _a
  const verified = await compactVerify(jwt, key, options)
  if (((_a = verified.protectedHeader.crit) === null || _a === void 0 ? void 0 : _a.includes('b64')) && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid('JWTs MUST NOT use unencoded payload')
  }
  const payload = jwtPayload(verified.protectedHeader, verified.payload, options)
  const result = { payload, protectedHeader: verified.protectedHeader }
  if (typeof key === 'function') {
    return __spreadProps(__spreadValues({}, result), { key: verified.key })
  }
  return result
}
function createSSO (config, fetch2 = window.fetch) {
  return new EveSSOAuth(config, fetch2)
}
const BASE_URI = 'https://login.eveonline.com/';
const AUTHORIZE_PATH = '/v2/oauth/authorize';
const TOKEN_PATH = '/v2/oauth/token';
const REVOKE_PATH = '/v2/oauth/revoke';
const JWKS_URL = 'https://login.eveonline.com/oauth/jwks';
class EveSSOAuth {
  constructor (config, fetchParam = window.fetch) {
    __publicField(this, 'config')
    __publicField(this, 'publicKey')
    __publicField(this, 'fetch')
    this.fetch = fetchParam.bind(window)
    this.config = config
  }

  async generateState () {
    return await getRandomString(8)
  }

  async generateCodeVerifier () {
    return await getRandomString(64)
  }

  async generateCodeChallenge (codeVerifier) {
    return await createHash(codeVerifier)
  }

  async _getJWKKeyData () {
    try {
      const response = await fetch(JWKS_URL)
      return await response.json()
    } catch (error) {
      console.log('There was an error retreiving JWK data', error)
    }
  }

  async getPublicKey () {
    if (this.publicKey === void 0) {
      try {
        const jwks = await this._getJWKKeyData()
        if (jwks !== null) {
          const key = jwks.keys.find((x) => x.alg === 'RS256')
          this.publicKey = await importJWK(key)
          return this.publicKey
        } else {
          throw new Error('There was a problem obtaining public key')
        }
      } catch (error) {
        console.log('There was an error retreiving the public key:', error)
      }
    }
    return this.publicKey
  }

  async getUri (scope = []) {
    const state = await this.generateState()
    const codeVerifier = await this.generateCodeVerifier()
    const codeChallenge = await this.generateCodeChallenge(codeVerifier)
    const url = new URL(AUTHORIZE_PATH, BASE_URI)
    url.searchParams.append('response_type', 'code')
    url.searchParams.append('redirect_uri', this.config.redirectUri)
    url.searchParams.append('client_id', this.config.clientId)
    url.searchParams.append('code_challenge', codeChallenge)
    url.searchParams.append('code_challenge_method', 'S256')
    url.searchParams.append('scope', scope.join(' '))
    url.searchParams.append('state', state)
    return {
      uri: url.toString(),
      state,
      codeVerifier
    }
  }

  async verifyToken (token) {
    const publicKey = await this.getPublicKey()
    const { payload } = await jwtVerify(token.access_token, publicKey, {
      issuer: 'https://login.eveonline.com'
    })
    token.payload = payload
    return token
  }

  async _fetchToken (url, init) {
    return await this.fetch(url, init)
  }

  async getAccessToken (code, codeVerifier) {
    try {
      const form = new URLSearchParams()
      form.append('grant_type', 'authorization_code')
      form.append('code', code)
      form.append('client_id', this.config.clientId)
      form.append('code_verifier', codeVerifier)
      const url = new URL(TOKEN_PATH, BASE_URI).toString()
      const response = await this._fetchToken(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Host: 'login.eveonline.com'
        },
        body: form
      })
      const token = await this.verifyToken(await response.json())
      return token
    } catch (error) {
      console.log('There was an error retreiving the token:', error)
      throw error
    }
  }

  async refreshToken (refreshToken, scopes) {
    try {
      const form = new URLSearchParams()
      form.append('grant_type', 'refresh_token')
      form.append('refresh_token', refreshToken)
      form.append('client_id', this.config.clientId)
      if (scopes !== void 0)
        {form.append("scope", scopes.join(" "));}
      const url = new URL(TOKEN_PATH, BASE_URI).toString()
      const response = await this._fetchToken(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Host: 'login.eveonline.com'
        },
        body: form
      })
      const token = await this.verifyToken(await response.json())
      return token
    } catch (error) {
      console.log('There was an error retreiving the token:', error)
      throw error
    }
  }

  async revokeRefreshToken (refreshToken) {
    try {
      const form = new URLSearchParams()
      form.append('token_type_hint', 'refresh_token')
      form.append('token', refreshToken)
      form.append('client_id', this.config.clientId)
      const url = new URL(REVOKE_PATH, BASE_URI).toString()
      const headers = new Headers()
      headers.set('Content-Type', 'application/x-www-form-urlencoded')
      headers.set('Host', 'login.eveonline.com')
      await this._fetchToken(url, {
        method: 'POST',
        headers,
        body: form
      })
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
export { createSSO }
