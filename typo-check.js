import fs from 'fs'
import { titleCase } from 'title-case'

const startsWithLowerCase = (str) => {
  return /^[a-z]/.test(str)
}
const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const init = () => {
  console.log('init')
  const attributes = JSON.parse(fs.readFileSync('./_data/reference-data/dogma_attributes.json'))
  // console.log('attributes', attributes)
  console.log('| Attribute ID | Existing displayName.en | Suggested displayName.en|')
  console.log('|-----|-----|-----|')
  for (const key in attributes) {
    const att = attributes[key]
    if (att.display_name.en) {
    // if (att.display_name.en) {
      const adjusted = titleCase(att.display_name.en)
      console.log('|', key, '|', att.display_name.en, '|', adjusted === att.display_name.en ? '' : adjusted, '|')
    }
  }
}

init()
