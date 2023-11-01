const STORAGE_KEY = 'hephaestus'

export const loadData = () => {
  const dataString = window.localStorage.getItem(STORAGE_KEY)
  if (dataString) {
    const data = JSON.parse(dataString)
    return data
  }
  return {}
}
export const saveData = (key, value) => {
  const existingData = loadData()
  const newData = { ...existingData, [key]: value }
  const newDataString = JSON.stringify(newData)
  window.localStorage.setItem(STORAGE_KEY, newDataString)
}
export const clearData = (key) => {
  const existingData = loadData()
  delete existingData[key]
  const newDataString = JSON.stringify(existingData)
  window.localStorage.setItem(STORAGE_KEY, newDataString)
}
