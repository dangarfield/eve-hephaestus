import { getCurrentUserAccessToken } from './login'
import { Api } from 'eve-esi-swaggerts'

const esi = new Api()

export const getSkills = async () => {
  try {
    const { characterId, accessToken } = await getCurrentUserAccessToken()
    const skillsRes = await esi.characters.getCharactersCharacterIdSkills(characterId, { token: accessToken })
    // console.log('skillsRes', skillsRes)
    return skillsRes.data.skills
  } catch (error) {
    return []
  }
}
export const openEVEContract = async (windowID) => {
  const { accessToken } = await getCurrentUserAccessToken()
  await esi.ui.postUiOpenwindowContract({ contract_id: windowID, token: accessToken })
}
export const openEVEMarket = async (windowID) => {
  const { accessToken } = await getCurrentUserAccessToken()
  await esi.ui.postUiOpenwindowMarketdetails({ type_id: windowID, token: accessToken })
}
export const openEVEInformation = async (windowID) => {
  const { accessToken } = await getCurrentUserAccessToken()
  await esi.ui.postUiOpenwindowInformation({ target_id: windowID, token: accessToken })
}
export const loadESIData = async () => {
  return {
    skills: await getSkills()
  }
}
