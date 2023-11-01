import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

const yamlToJson = (filePath) => {
  return yaml.load(fs.readFileSync(filePath, 'utf-8'))
}

const init = async () => {
  const metas = ['item_id,item_name,item_group,item_category,market_group,meta_group,related_item_ids']

  // 681,[38]
  // 682,[38]
  // 683,"[34, 35, 36, 37]"
  // 684,"[34, 35, 36, 37]"
  const typeIDs = yamlToJson('./sde/fsd/typeIDs.yaml')
  const blueprints = yamlToJson('./sde/fsd/blueprints.yaml')
  const groups = yamlToJson('./sde/fsd/groupIDs.yaml')
  const categories = yamlToJson('./sde/fsd/categoryIDs.yaml')
  const marketGroups = yamlToJson('./sde/fsd/marketGroups.yaml')
  const metaGroups = yamlToJson('./sde/fsd/metaGroups.yaml')

  console.log('data parsed')
  for (const bpID in blueprints) {
    const bp = blueprints[bpID]
    // console.log('bp', bp)
    if (bp.activities && bp.activities.manufacturing && bp.activities.manufacturing.products && bp.activities.manufacturing.materials) {
      const p = bp.activities.manufacturing.products[0].typeID
      const m = bp.activities.manufacturing.materials.map(m => m.typeID)
      const t = typeIDs[p]
      if (t) {
        const n = t.name.en.replace(/[^\w\s]/g, '').trim()
        // console.log('p', p, 'm', m, 'n', n)
        const s = m.length > 1 ? '"' : ''

        const group = groups[t.groupID]
        const g = group.name.en
        const cat = categories[group.categoryID]
        const c = cat.name.en

        const market = marketGroups[t.marketGroupID]
        if (market) {
          //   console.log('market', market)
          const mg = market.nameID.en
          const meta = metaGroups[t.metaGroupID] ? metaGroups[t.metaGroupID].nameID.en : 'Normal'
          metas.push(`${p},${n},${g},${c},${mg},${meta},${s}[${m.join(', ')}]${s}`)
        }
      }
    }
  }
  const metaString = metas.join('\n')
  //   console.log('metaString', metaString)
  fs.writeFileSync(path.join('..', 'eve-market-predictor', 'metadata.csv'), metaString)

  const names = 'item_id,item_name\n' + Object.keys(typeIDs).map(itemIDString => {
    const t = typeIDs[itemIDString]
    const n = t.name.en.replace(/[^\w\s]/g, '').trim()
    return `${itemIDString},${n}`
  }).join('\n')
  //   console.log('names', names)
  fs.writeFileSync(path.join('..', 'eve-market-predictor', 'names.csv'), names)
}

init()
