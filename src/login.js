import { loadData, saveData, clearData } from './utils'
// import { createSSO } from 'eve-sso-pkce'
import { createSSO } from './sso/eve-sso-pkce.es.js'

const ssoConfig = {
  clientId: 'bf4553abe30247158f4a5d0afbf4f920',
  redirectUri: 'http://localhost:3000/',
  scopes: 'esi-skills.read_skills.v1 esi-ui.open_window.v1'.split(' ')
}

// console.log('ssoConfig', ssoConfig)
const sso = createSSO(ssoConfig)

export const triggerLoginFlow = async () => {
  console.log('triggerLoginFlow')
  clearData('codeVerifier')

  const ssoUri = await sso.getUri(ssoConfig.scopes)
  saveData('codeVerifier', ssoUri.codeVerifier)
  console.log('ssoUri', ssoUri)
  window.location.assign(ssoUri.uri)
}
export const triggerLoginReturnFlow = async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')

  console.log('triggerLoginReturnFlow', code, state)
  if (code && state) {
    const data = loadData()
    console.log('code', code, 'state', state, 'codeVerifier', data.codeVerifier)
    const token = await sso.getAccessToken(code, data.codeVerifier)
    token.character_id = token.payload.sub.replace('CHARACTER:EVE:', '')
    console.log('token', token)
    saveData('selectedCharacter', token.character_id)
    saveData(`token-${token.character_id}`, token)
    clearData('codeVerifier')
    window.location.assign('/')
  } else {
    // TODO - More robust version of handling failures
    clearData('codeVerifier')
    window.alert('login failed')
  }
}

export const getCurrentUserDetails = () => {
  const data = loadData()
  //   console.log('data', data)
  const characterId = data.selectedCharacter
  if (characterId === undefined) return false
  const tokenData = data[`token-${characterId}`]
  const characterName = tokenData.payload.name
  return { characterId, characterName }
}
export const getCurrentUserAccessToken = async () => {
  let data = loadData()

  const characterId = data.selectedCharacter

  if ((new Date().getTime() / 1000) > data[`token-${characterId}`].payload.exp) {
    console.log('Need to refresh')
    await refreshTokenAndGetNewUserAccessToken()
    data = loadData()
  }

  const accessToken = data[`token-${characterId}`].access_token
  const jwt = data[`token-${characterId}`].payload
  // console.log('getCurrentUserAccessToken', accessToken)
  return { characterId, accessToken, jwt }
}
const refreshTokenAndGetNewUserAccessToken = async () => {
  const data = loadData()
  console.log('refreshTokenAndGetNewUserAccessToken')
  const characterId = data.selectedCharacter
  const refreshToken = data[`token-${characterId}`].refresh_token
  const newToken = await sso.refreshToken(refreshToken)
  newToken.character_id = newToken.payload.sub.replace('CHARACTER:EVE:', '')
  console.log('newToken', newToken)
  saveData(`token-${characterId}`, newToken)
  // TODO alert('refresh')
}
