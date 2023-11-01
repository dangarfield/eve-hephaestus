/* eslint-disable camelcase */
import axios from 'axios'
import AdmZip from 'adm-zip'
import yaml from 'js-yaml'

import zlib from 'zlib'
import fs from 'fs'
import path, { parse } from 'path'
import bz2 from 'unbzip2-stream'
import tarfs from 'tar-fs'
import { promisify } from 'util'
import stream from 'stream'
import decompress from 'decompress'
import decompressTarxz from 'decompress-tarxz'
import fastcsv from 'fast-csv'
import { c } from 'tar'

const SDE_URL = 'https://eve-static-data-export.s3-eu-west-1.amazonaws.com/tranquility/sde.zip'
const LATEST_MARKET_ORDERS_URL = 'https://data.everef.net/market-orders/market-orders-latest.v3.csv.bz2'
const LATEST_CONTRACTS_URL = 'https://data.everef.net/public-contracts/public-contracts-latest.v2.tar.bz2'
const ESI_SCRAP_URL = 'https://data.everef.net/esi-scrape/eve-ref-esi-scrape-latest.tar.xz'

const LATEST_MARKET_ORDERS_URL_FUZZ = 'https://market.fuzzwork.co.uk/aggregatecsv.csv.gz'
const ORDER_SET_URL = 'https://market.fuzzwork.co.uk/orderbooks/orderset-124025.csv.gz'
// https://data.everef.net/fuzzwork/ordersets/2023/2023-09-26/fuzzwork-orderset-123992-2023-09-26_01-06-41.csv.gz

const parseCSV = async (csvFilePath) => {
  try {
    const stream = fs.createReadStream(csvFilePath)

    const results = []

    await new Promise((resolve, reject) => {
      stream
        .pipe(fastcsv.parse({ headers: true }))
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject)
    })

    // console.log('CSV parsing complete.')
    return results
  } catch (error) {
    console.error('Error parsing CSV:', error)
    return []
  }
}

const yamlToJson = (filePath) => {
  return yaml.load(fs.readFileSync(filePath, 'utf-8'))
}
const downloadJson = async (url, folder) => {
  const fileName = path.basename(url)
  const filePath = path.join(folder, fileName)
  if (fs.existsSync(filePath)) return
  const data = (await axios.get(url)).data
  console.log('downloadJson', fileName, url, filePath)
  fs.writeFileSync(filePath, JSON.stringify(data))
}
const downloadCSV = async (url, folder, fileName) => {
  const filePath = path.join(folder, fileName)
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
  const data = (await axios.get(url, { responseType: 'arraybuffer' })).data
  console.log('downloadCSV', url, filePath)
  const decodedData = await new Promise((resolve, reject) => {
    zlib.gunzip(data, function (_err, output) {
      // console.log(output)
      resolve(output)
    })
  })

  fs.writeFileSync(filePath, decodedData)
}

const downloadTar = async (url, folder) => {
  try {
    console.log('downloadTarBZ2 - START', url)
    const response = await axios.get(url, { responseType: 'stream' })
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
    const tempPath = path.join(folder, 'temp')
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(tempPath)
      response.data.pipe(writer) // Pipe the HTTP response to the file
      writer.on('finish', resolve) // Wait for the file to finish downloading
      writer.on('error', reject)
    })
    const pipeline = promisify(stream.pipeline)
    if (url.endsWith('.tar.bz2')) {
      await pipeline(fs.createReadStream(tempPath), bz2(), tarfs.extract(folder))
    } else if (url.endsWith('.tar.xz')) {
      await decompress(tempPath, folder, {
        plugins: [
          decompressTarxz()
        ]
      })
    } else {

    }
    fs.unlinkSync(tempPath)
    console.log('downloadTarBZ2 - END')
  } catch (error) {
    console.error('downloadTarBZ2 - ERROR', error.message)
  }
}
const downloadBZ2 = async (url, folder, fileName) => {
  try {
    console.log('downloadBZ2 - START', url)
    const response = await axios.get(url, { responseType: 'stream' })
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
    const tempPath = path.join(folder, 'temp.bz2')
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(tempPath)
      response.data.pipe(writer) // Pipe the HTTP response to the file
      writer.on('finish', resolve) // Wait for the file to finish downloading
      writer.on('error', reject)
    })
    const pipeline = promisify(stream.pipeline)
    await pipeline(fs.createReadStream(tempPath), bz2(), fs.createWriteStream(path.join(folder, fileName)))
    // fs.unlinkSync(tempPath)
    console.log('downloadBZ2 - END')
  } catch (error) {
    console.error('downloadBZ2 - ERROR', error.message)
  }
}

const downloadAndUnzip = async (url, unzipPath, folderName) => {
  try {
    const unzipPathPath = path.join(unzipPath)
    if (!fs.existsSync(unzipPathPath)) fs.mkdirSync(unzipPathPath)
    console.log('downloadAndUnzip', url, unzipPath, folderName)
    if (fs.existsSync(path.join(unzipPath, folderName))) return
    // if (fs.readdirSync(unzipPathPath).length > 0) return
    console.log('downloadAndUnzip execute', url, unzipPath, folderName)
    const response = await axios.get(url, { responseType: 'stream' })
    const zipFileName = path.basename(url)
    const zipFilePath = path.join(unzipPath, zipFileName)

    response.data.pipe(fs.createWriteStream(zipFilePath))

    await new Promise((resolve, reject) => {
      response.data.on('end', resolve)
      response.data.on('error', reject)
    })

    await fs.promises.mkdir(unzipPath, { recursive: true })

    const zip = new AdmZip(zipFilePath)
    zip.extractAllTo(unzipPath, true)

    fs.unlinkSync(zipFilePath) // Remove the downloaded zip file

    console.log('Download and unzip successful!')
    console.log('fs.readdirSync(unzipPathPath)', fs.readdirSync(unzipPathPath))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// const getTypeDetails = async (typeIDs) => {
//   const processBatch = async (batch) => {
//     // console.log('batch', batch)
//     const url = `https://market.fuzzwork.co.uk/aggregates/?region=10000002&types=${batch.map(b => b.typeID).join(',')}`
//     const res = await axios.get(url)
//     const data = res.data
//     // console.log('data', data)
//     for (const item of batch) {
//       item.priceBuy = parseFloat(data[item.typeID].buy.max)
//       item.priceSell = parseFloat(data[item.typeID].sell.min)
//       item.countBuy = parseInt(data[item.typeID].buy.orderCount)
//       item.countSell = parseInt(data[item.typeID].sell.orderCount)
//     }
//   }
//   const processAllItems = async (items, batchSize) => {
//     for (let i = 0; i < items.length; i += batchSize) {
//       const batch = items.slice(i, i + batchSize)
//       await processBatch(batch)
//     }
//   }

//   const items = Object.entries(typeIDs).map(([typeID, data]) => {
//     data.typeID = parseInt(typeID)
//     return data
//   }).filter(t => t.published).map(t => { return { typeID: t.typeID, name: t.name.en } })
//   console.log('typeIDs', items.length)

//   await processAllItems(items, 200)

//   const resultObject = items.reduce((acc, obj) => {
//     acc[obj.typeID] = obj
//     return acc
//   }, {})
//   return resultObject
// }
// const getPrice = async (itemID) => {
//   const response = await axios.get(`https://market.fuzzwork.co.uk/aggregates/?region=10000002&types=${itemID}`)
//   const json = await response.data
//   const price = parseFloat(json[itemID].sell.min)
//   // console.log('json', json, price)
//   return price
// }
const addTypeDetailsAndPriceToBlueprints = async (blueprints, typeDetails, blueprintCosts) => {
  console.log('addTypeDetailsAndPriceToBlueprints: START')
  try {
    for (const bpID in blueprints) {
      const bp = blueprints[bpID]
      bp.price = {
        materials: { priceSell: 0, priceBuy: 0 },
        products: { priceSell: 0, priceBuy: 0 },
        blueprint: blueprintCosts[bp.blueprintTypeID]
        // profit: {priceSell: 0 - blueprintCosts[bp.blueprintTypeID], priceBuy: 0 - blueprintCosts[bp.blueprintTypeID]}
      }
      if (bp.activities.manufacturing) {
        if (bp.activities.manufacturing.materials) {
          for (const item of bp.activities.manufacturing.materials) {
            const type = typeDetails[item.typeID]
            if (typeDetails[item.typeID] !== undefined && type) {
              item.name = type.name
              item.priceSell = type.priceSell
              item.priceBuy = type.priceBuy
              item.countBuy = type.countBuy
              item.countSell = type.countSell
              bp.price.materials.priceSell += item.priceSell * item.quantity
              bp.price.materials.priceBuy += item.priceBuy * item.quantity
              // bp.price.profit.priceSell -= item.priceSell * item.quantity
              // bp.price.profit.priceSell -= item.priceBuy * item.quantity
              // typeDetails[item.typeID] = {typeID:type.typeID, name: type.name, price: type.priceSell}
            } else {
              bp.invalid = true
            }
          }
        }
        if (bp.activities.manufacturing.products) {
          for (const item of bp.activities.manufacturing.products) {
            const type = typeDetails[item.typeID]
            if (typeDetails[item.typeID] !== undefined && type) {
              item.name = type.name
              item.priceSell = type.priceSell
              item.priceBuy = type.priceBuy
              item.countBuy = type.countBuy
              item.countSell = type.countSell
              bp.price.products.priceSell += item.priceSell * item.quantity
              bp.price.products.priceBuy += item.priceBuy * item.quantity
              // bp.price.profit.priceSell += item.priceSell * item.quantity
              // bp.price.profit.priceBuy += item.priceBuy * item.quantity
              bp.name = item.name
              bp.typeID = item.typeID
              bp.countBuy = type.countBuy
              bp.countSell = type.countSell
            } else {
              bp.invalid = true
            }
          }
        }
      }
      bp.price.profit = {
        priceSell: bp.price.products.priceSell - bp.price.materials.priceSell - bp.price.blueprint,
        priceBuy: bp.price.products.priceSell - bp.price.materials.priceBuy - bp.price.blueprint
      }
    }
    blueprints = blueprints.filter(b => b.invalid !== true)
    blueprints = blueprints.filter(b => b.price.blueprint > 0)
    blueprints = blueprints.filter(b => b.name !== undefined)
    blueprints = blueprints.filter(b => b.countBuy >= 10 && b.countSell >= 10)
    blueprints = blueprints.sort((a, b) => b.price.profit.priceBuy - a.price.profit.priceBuy)
  } catch (error) {
    console.log('error', error)
  }

  console.log('addTypeDetailsAndPriceToBlueprints: END', blueprints.length)
  return blueprints
}
const saveFile = (filePath, data) => {
  const folderPath = path.join('data')
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath)
  fs.writeFileSync(filePath, JSON.stringify(data))
}
const getBlueprintCosts = async (blueprints) => {
  const blueprintPricesPath = path.join('data', 'blueprintPrices.json')
  if (fs.existsSync(blueprintPricesPath)) return JSON.parse(fs.readFileSync(blueprintPricesPath))

  const blueprintKeys = blueprints.reduce((acc, obj) => {
    acc[obj.blueprintTypeID] = 999999999999
    return acc
  }, {})

  let page = 1
  let maxPage = 999

  do {
    const res = await fetch(`https://esi.evetech.net/latest/contracts/public/10000002/?datasource=tranquility&page=${page}`)
    const contracts = (await res.json()).filter(c => c.type === 'item_exchange')
    maxPage = parseInt(res.headers.get('x-pages'))

    console.log(`Contracts page ${page} of ${maxPage}: START`)
    // for (let i = 0; i < contracts.length; i++) {
    //   const contract = contracts[i]
    //   try {
    //     console.log(`Contracts page ${page} of ${maxPage} - Item ${i+1} of ${contracts.length}`)
    //     const itemsRes = await fetch(`https://esi.evetech.net/latest/contracts/public/items/${contract.contract_id}/?datasource=tranquility&page=1`)
    //     const items = await itemsRes.json()
    //     if(items.length !== 1 && (items[0] === undefined || items[0].is_included !== true)) continue
    //     const item = items[0]
    //     const isBPO = blueprintKeys.hasOwnProperty(item.type_id)
    //     const isBPC = item.is_blueprint_copy === true
    //     const price = contract.price
    //     // console.log('item', item, isBPO, isBPC, price)
    //     if ((isBPC || isBPO) && price < blueprintKeys[item.type_id]) {
    //       blueprintKeys[item.type_id] = price
    //       // console.log('price updated', blueprintKeys[item.type_id])
    //     }
    //   } catch (error) {
    //     console.log('error loading contract items', contract)
    //   }

    // }

    const batchSize = 10 // Set the batch size

    const processBatch = async (batchContracts, batchNumber) => {
      const promises = batchContracts.map(async (contract, index) => {
        try {
          console.log(`Contracts page ${page} of ${maxPage} - Batch ${batchNumber}, Item ${index + 1} of ${batchContracts.length}`)
          const itemsRes = await fetch(`https://esi.evetech.net/latest/contracts/public/items/${contract.contract_id}/?datasource=tranquility&page=1`)
          const items = await itemsRes.json()

          if (items.length !== 1 && (items[0] === undefined || items[0].is_included !== true)) return null

          const item = items[0]
          const isBPO = blueprintKeys.hasOwnProperty(item.type_id)
          const isBPC = item.is_blueprint_copy === true
          const price = contract.price

          if ((isBPC || isBPO) && price < blueprintKeys[item.type_id]) {
            blueprintKeys[item.type_id] = price
          }
        } catch (error) {
          console.log('error loading contract items', contract)
        }
      })

      await Promise.all(promises)
    }

    for (let batchStart = 0; batchStart < contracts.length; batchStart += batchSize) {
      const batchContracts = contracts.slice(batchStart, batchStart + batchSize)

      // Use Promise.all to process the batch concurrently
      await processBatch(batchContracts, Math.floor(batchStart / batchSize) + 1)
    }
    console.log(`Contracts page ${page} of ${maxPage}: END`)
    page++
  } while (page < maxPage)

  saveFile(blueprintPricesPath, blueprintKeys)
}
const blueprintsWithPrices = async () => {
  const typesPath = path.join('data', 'types.json')
  const blueprintsPath = path.join('data', 'types.json')

  let typeDetails
  if (fs.existsSync(typesPath)) {
    typeDetails = JSON.parse(fs.readFileSync(typesPath))
  } else {
    const typeIDs = yamlToJson('./_data/sde/fsd/typeIDs.yaml')
    typeDetails = await getTypeDetails(typeIDs)
    saveFile(typesPath, typeDetails)
  }
  // console.log('typeDetails', typeDetails)
  let blueprints = Object.values(yamlToJson('./_data/sde/fsd/blueprints.yaml'))

  const blueprintCosts = await getBlueprintCosts(blueprints)

  blueprints = await addTypeDetailsAndPriceToBlueprints(blueprints, typeDetails, blueprintCosts)

  return blueprints
}

const generateItemDetails = async () => {
  // const deletePublishedFalse = (obj) => {
  //   Object.keys(obj).forEach(key => obj[key] && obj[key].published === false && delete obj[key])
  // }

  console.log('generateItemDetails: START')
  const types = JSON.parse(fs.readFileSync('./_data/reference-data/types.json'))
  const groups = JSON.parse(fs.readFileSync('./_data/reference-data/groups.json'))
  const marketGroups = JSON.parse(fs.readFileSync('./_data/reference-data/market_groups.json'))
  const metaGroups = JSON.parse(fs.readFileSync('./_data/reference-data/meta_groups.json'))
  const categories = JSON.parse(fs.readFileSync('./_data/reference-data/categories.json'))

  for (const typeIDString in types) {
    const typeID = parseInt(typeIDString)
    const type = types[typeID]
    // const group_id = type.group_id
    type.groupName = type.group_id === undefined ? '' : groups[parseInt(type.group_id)].name.en
    type.marketGroupName = type.market_group_id === undefined ? '' : marketGroups[parseInt(type.market_group_id)].name.en
    type.metaGroupName = type.meta_group_id === undefined ? '' : metaGroups[parseInt(type.meta_group_id)].name.en
    type.categoryName = type.group_id === undefined ? '' : categories[groups[parseInt(type.group_id)].category_id].name.en
    // market_group_id
    // meta_group_id

    // console.log('typeID', typeID, type)
  }

  // deletePublishedFalse(types)
  const marketOrdersFuzz = await parseCSV('./_data/market-orders-fuzz/latest-market-orders-fuzz.csv')
  let badCount = 0
  for (const marketOrderFuzz of marketOrdersFuzz) {
    const whatSplit = marketOrderFuzz.what.split('|')
    const region = parseInt(whatSplit[0])
    const typeID = parseInt(whatSplit[1])
    const isBuy = whatSplit[2] === 'true'
    if (region !== 10000002) continue

    marketOrderFuzz.fivepercent = parseFloat(marketOrderFuzz.fivepercent)
    marketOrderFuzz.maxval = parseFloat(marketOrderFuzz.maxval)
    marketOrderFuzz.median = parseFloat(marketOrderFuzz.median)
    marketOrderFuzz.minval = parseFloat(marketOrderFuzz.minval)
    marketOrderFuzz.volume = parseInt(marketOrderFuzz.volume)
    marketOrderFuzz.numorders = parseInt(marketOrderFuzz.numorders)
    marketOrderFuzz.stddev = parseFloat(marketOrderFuzz.stddev)
    marketOrderFuzz.weightedaverage = parseFloat(marketOrderFuzz.weightedaverage)

    const type = types[typeID]
    if (type === undefined) {
      console.log('unknown type', type, typeID) // Mostly likely because it is not published
      badCount++
      continue
    }
    type[isBuy ? 'buy' : 'sell'] = marketOrderFuzz
  }

  // Get EIV prices
  const pricesRes = await fetch('https://esi.evetech.net/latest/markets/prices/?datasource=tranquility')
  const prices = await pricesRes.json()
  // console.log('prices', prices)
  for (const price of prices) {
    types[price.type_id].eiv = (price.average_price || 0) - (price.adjusted_price || 0)
    types[price.type_id].average_price = (price.average_price || 0)
    types[price.type_id].adjusted_price = (price.adjusted_price || 0)
    if (price.type_id === 45653) {
      console.log('eiv', price.type_id, '-', price.average_price, price.adjusted_price, '=', types[price.type_id].eiv)
    }
  }
  fs.writeFileSync('./_static/data/generated-types.json', JSON.stringify(types))
  console.log('generateItemDetails: END', 'badCount', badCount)
}
const deleteNonManufacturable = (blueprints, types) => {
  Object.keys(blueprints).forEach((key) => {
    const blueprint = blueprints[key]
    if (
      blueprint &&
      blueprint.activities.manufacturing !== undefined &&
      blueprint.activities.manufacturing.products !== undefined &&
      types[blueprint.blueprint_type_id].published !== false
    ) {
      return
    }
    delete blueprints[key]
  })
}

const generateBlueprintDetails = async () => {
  console.log('generateBlueprintDetails: START')
  const blueprints = JSON.parse(fs.readFileSync('./_data/reference-data/blueprints.json'))
  const types = JSON.parse(fs.readFileSync('./_static/data/generated-types.json'))

  deleteNonManufacturable(blueprints, types)

  for (const bpID of Object.keys(blueprints)) {
    const bp = blueprints[bpID]
    // console.log('bp', bp)
  }
  fs.writeFileSync('./_static/data/generated-blueprints.json', JSON.stringify(blueprints))
  console.log('generateBlueprintDetails: END')
}
const generateContractPrices = async () => {
  console.log('generateContractPrices: START')
  const bpIDs = Object.keys(JSON.parse(fs.readFileSync('./_static/data/generated-blueprints.json'))).map(v => parseInt(v))
  const bpPriceData = Object.fromEntries(bpIDs.map((bpID) => [bpID, { contracts: [] }]))

  const contractItems = await parseCSV('./_data/contracts/contract_items.csv')
  const relevantItemsForContracts = {}
  for (const contractItem of contractItems) { // Add contract items in one go to object
    const typeID = parseInt(contractItem.type_id)
    // if (bpIDs.includes(typeID) && contractItem.is_included === 'true') { // TODO - make sure that this is for sell orders only
    const contractID = parseInt(contractItem.contract_id)
    // console.log('bp', typeID)
    if (!relevantItemsForContracts[contractID]) {
      relevantItemsForContracts[contractID] = []
    }
    relevantItemsForContracts[contractID].push(contractItem)
    // }
  }
  // Filter out contracts with multiple items. TODO - Should probably apportion these another time
  Object.keys(relevantItemsForContracts).forEach((key) => relevantItemsForContracts[key].length !== 1 && delete relevantItemsForContracts[key])

  const contracts = await parseCSV('./_data/contracts/contracts.csv')
  for (const contract of contracts) {
    const contractID = parseInt(contract.contract_id)
    if (contract.type !== 'item_exchange') continue
    if (contract.region_id !== '10000002') continue
    const items = relevantItemsForContracts[contractID]

    if (items === undefined) continue
    if (items.length !== 1) continue
    const item = items[0]
    if (item.is_included !== 'true') continue
    const price = parseInt(contract.price)
    const bpID = parseInt(item.type_id)
    if (!bpIDs.includes(bpID)) continue
    const isBPC = item.is_blueprint_copy === 'true'
    const quantity = parseInt(item.quantity)
    const matEff = parseInt(item.material_efficiency)
    const timeEff = parseInt(item.time_efficiency)
    const runs = parseInt(item.runs) || 1

    const pricePerRun = parseInt(price / quantity / runs)
    const blueprintContractData = { contractID, price, pricePerRun, isBPC, quantity, matEff, timeEff, runs }
    // console.log('contract', contract, item, blueprintContractData)
    bpPriceData[bpID].contracts.push(blueprintContractData)
  }
  for (const bpID in bpPriceData) {
    const bp = bpPriceData[bpID]
    bp.contracts.sort((a, b) => a.pricePerRun - b.pricePerRun)
  }
  // console.log('bpIDs', bpIDs, bpPriceData)
  fs.writeFileSync('./_static/data/generated-blueprints-contracts.json', JSON.stringify(bpPriceData))
  console.log('generateContractPrices: END')
}
const generateSystemDetails = async () => {
  console.log('generateSystemDetails: START')
  const res = await fetch('https://esi.evetech.net/latest/industry/systems/')
  const systemCostsRaw = await res.json()

  const systems = yamlToJson('./_data/eve-ref-esi-scrape/data/tranquility/universe/systems.en-us.yaml')
  const constellations = yamlToJson('./_data/eve-ref-esi-scrape/data/tranquility/universe/constellations.en-us.yaml')
  const regions = yamlToJson('./_data/eve-ref-esi-scrape/data/tranquility/universe/regions.en-us.yaml')

  const systemCosts = {}
  for (const systemCostRaw of systemCostsRaw) {
    const solarSystemID = systemCostRaw.solar_system_id
    const solarSystem = systems[solarSystemID]
    const solarSystemName = solarSystem.name

    const constellationID = solarSystem.constellation_id
    const constellation = constellations[constellationID]
    const constellationName = constellation.name

    const regionID = constellation.region_id
    const region = regions[regionID]
    const regionName = region.name

    systemCostRaw.solar_system_id = solarSystemID
    systemCostRaw.solar_system_name = solarSystemName
    systemCostRaw.constellation_id = constellationID
    systemCostRaw.constellation_name = constellationName
    systemCostRaw.region_id = regionID
    systemCostRaw.region_name = regionName
    systemCostRaw.cost_indices = systemCostRaw.cost_indices.reduce((obj, { activity, cost_index }) => ({ ...obj, [activity]: cost_index }), {})
    systemCosts[systemCostRaw.solar_system_id] = systemCostRaw
  }

  fs.writeFileSync('./_static/data/generated-systems.json', JSON.stringify(systemCosts))
  console.log('generateSystemDetails: END')
}
const downloadMarketHistory = async (days) => {
  console.log('downloadMarketHistory: START')
  const res = await fetch('https://data.everef.net/market-history/totals.json')
  const availableDatesObj = await res.json()
  const availableDates = Object.entries(availableDatesObj).map(([date, records]) => ({
    date,
    records
  }))
    .filter(a => a.records > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days)
    .map(a => a.date)
  if (!fs.existsSync('./_data')) fs.mkdirSync('./_data')
  if (!fs.existsSync('./_data/market-history')) fs.mkdirSync('./_data/market-history')
  fs.writeFileSync('./_data/market-history/totals.json', JSON.stringify(availableDates))
  const folder = './_data/market-history'
  for (const date of availableDates) {
    // console.log('date', date)
    const fileName = `market-history-${date}`
    if (!fs.existsSync(path.join(folder, `${fileName}.csv`))) {
      await downloadBZ2(`https://data.everef.net/market-history/2023/${fileName}.csv.bz2`, folder, `${fileName}.csv`)
    }
  }
  console.log('downloadMarketHistory: END')
  // mpp - monthly potential profit - multiplies the lesser of spot price and 30 average price with the 30 day sales quantity
}
const generateItemMarketHistory = async () => {
  console.log('generateItemMarketHistory: START')
  const availableDates = JSON.parse(fs.readFileSync('./_data/market-history/totals.json'))// .slice(0, 5) // TEMP
  const types = {}
  // console.log('availableDates', availableDates)
  for (const date of availableDates) {
    const historyDatas = await parseCSV(`./_data/market-history/market-history-${date}.csv`)

    for (const historyData of historyDatas) {
      if (historyData.region_id !== '10000002') continue
      historyData.type_id = parseInt(historyData.type_id)
      historyData.order_count = parseInt(historyData.order_count)
      historyData.volume = parseInt(historyData.volume)
      delete historyData.region_id
      delete historyData.http_last_modified
      historyData.average = parseFloat(historyData.average)
      historyData.highest = parseFloat(historyData.highest)
      historyData.lowest = parseFloat(historyData.lowest)
      // console.log('historyData', historyData)
      if (types[historyData.type_id] === undefined) types[historyData.type_id] = { history: [] }
      types[historyData.type_id].history.push(historyData)
    }
  }
  // Averages
  for (const typeID in types) {
    const type = types[typeID]
    // console.log('type', type)
    type.averagePrice = type.history.reduce((sum, h) => sum + h.average, 0) / availableDates.length
    type.volume30Days = type.history.reduce((sum, h) => sum + h.volume, 0)
    type.averageVolume = type.volume30Days / availableDates.length
  }

  fs.writeFileSync('./_static/data/generated-types-market-history.json', JSON.stringify(types))
  console.log('generateItemMarketHistory: END')
}

// Don't use anymore : START
// await downloadAndUnzip(SDE_URL, './_data', 'sde')
// await downloadBZ2(LATEST_MARKET_ORDERS_URL, './_data/market-orders', 'latest-market-orders.csv')
// await downloadBZ2('https://data.everef.net/market-history/2023/market-history-2023-09-25.csv.bz2', './_data/market-history', 'latest-market-history.csv')
// Don't use anymore : END
const downloadKillData = async () => {
  console.log('downloadKillData')
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  const day = currentDate.getDate().toString().padStart(2, '0')
  const today = `${year}${month}${day}`

  const res = await fetch('https://data.everef.net/killmails/totals.json')
  const availableDatesObj = await res.json()
  const availableDates = Object.keys(availableDatesObj).filter(d => d.startsWith('2023') && d !== today)// .slice(0, 2)
  // console.log('availableDates', availableDates)

  if (!fs.existsSync('./_data')) fs.mkdirSync('./_data')
  if (!fs.existsSync('./_data/killmails')) fs.mkdirSync('./_data/killmails')

  for (const availableDate of availableDates) {
    const dateWithDashes = `${availableDate.slice(0, 4)}-${availableDate.slice(4, 6)}-${availableDate.slice(6, 8)}`
    const url = `https://data.everef.net/killmails/${availableDate.slice(0, 4)}/killmails-${dateWithDashes}.tar.bz2`
    // console.log('availableDate', availableDate, url)
    const folder = path.join('_data', 'killmails', dateWithDashes)
    // await downloadBZ2(url, folder, fileName)
    if (fs.existsSync(folder)) {
      // console.log('  folder exists')
      continue
    }
    await downloadTar(url, folder)
  }
}
const produceDailyKillSums = () => {
  const root = path.join('_data', 'killmails')
  const dates = fs.readdirSync(root, { withFileTypes: true }).filter(f => f.isDirectory()).map(f => f.name)
  // console.log('dates', dates)
  for (const [dateI, date] of dates.entries()) {
    const lossListPath = path.join(root, date, `loss-list-${date}.json`)
    if (fs.existsSync(lossListPath)) {
      // console.log('killmail', `Already processed date: ${dateI + 1} of ${dates.length}`)
      continue
    }
    console.log('killmail', `Processing date: ${dateI + 1} of ${dates.length}`)
    const lossList = {}
    const addToLossList = (itemID, quantity) => {
      if (lossList[itemID] === undefined) {
        lossList[itemID] = quantity
      } else {
        lossList[itemID] += quantity
      }
    }
    const datePath = path.join(root, date, 'killmails')
    const fileNames = fs.readdirSync(datePath).filter(f => f.endsWith('.json'))// .slice(0, 1)
    // console.log('fileNames', fileNames)

    for (const fileName of fileNames) {
      // console.log('killmail', `${dateI + 1} of ${dates.length} - ${fileNameI + 1} of ${fileNames.length}`)
      const killmail = JSON.parse(fs.readFileSync(path.join(datePath, fileName)))
      // console.log('killmail', killmail)
      addToLossList(killmail.victim.ship_type_id, 1)
      for (const rootItem of killmail.victim.items) {
        addToLossList(rootItem.item_type_id, rootItem.quantity_dropped | rootItem.quantity_destroyed)
        if (rootItem.items !== undefined) {
          for (const childItem of rootItem.items) {
            addToLossList(childItem.item_type_id, childItem.quantity_dropped | childItem.quantity_destroyed)
          }
        }
      }
    }
    // console.log('lossList', date, lossList)
    fs.writeFileSync(lossListPath, JSON.stringify(lossList))
  }
  return dates
}
const aggregateKills = (dates) => {
  const totalLossList = {}
  // dates = dates.slice(0, 2)
  const addToTotalLossList = (itemID, date, quantity) => {
    if (totalLossList[itemID] === undefined) {
      totalLossList[itemID] = { dates: {} }
    }
    if (totalLossList[itemID].dates[date] === undefined) {
      totalLossList[itemID].dates[date] = quantity
    } else {
      totalLossList[itemID].dates[date] += quantity
    }
  }
  for (const [dateI, date] of dates.entries()) {
    // console.log('date', date)
    const lossList = JSON.parse(fs.readFileSync(path.join('_data', 'killmails', date, `loss-list-${date}.json`)))
    // console.log('lossList', date, Object.keys(lossList).length)
    for (const itemID of Object.keys(lossList)) {
      // console.log('itemID', date, itemID, lossList[itemID])
      addToTotalLossList(itemID, date, lossList[itemID])
    }
  }
  // console.log('totalLossList', totalLossList)

  // Averages
  console.log('Calculating killmail loss item averages')
  for (const itemID of Object.keys(totalLossList)) {
    // if (itemID !== '74434') {
    //   continue
    // }
    // console.log('itemID', itemID)
    const data = totalLossList[itemID].dates

    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() - 1)
    const currentDateStr = currentDate.toISOString().split('T')[0]

    const last365Days = new Date(currentDate)
    last365Days.setDate(currentDate.getDate() - 365)

    const last90Days = new Date(currentDate)
    last90Days.setDate(currentDate.getDate() - 90)

    const last30Days = new Date(currentDate)
    last30Days.setDate(currentDate.getDate() - 30)

    const last7Days = new Date(currentDate)
    last7Days.setDate(currentDate.getDate() - 7)

    const last2Days = new Date(currentDate)
    last2Days.setDate(currentDate.getDate() - 2)

    const average = (startDate, endDate) => {
      const matchingDates = []
      let total = 0
      const currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        matchingDates.push(dateStr)
        total += data[dateStr] || 0
        currentDate.setDate(currentDate.getDate() + 1)
        // console.log('average', startDate, endDate, dateStr, total)
      }

      return matchingDates.length ? total / matchingDates.length : 0
    }

    const thisYearAverage = average('2023-01-01', currentDate)
    const last90DaysAverage = average(last90Days, currentDate)
    const last30DaysAverage = average(last30Days, currentDate)
    const last7DaysAverage = average(last7Days, currentDate)
    const last2DaysAverage = average(last2Days, currentDate)

    // console.log('This year average:', thisYearAverage)
    // console.log('Last 90 Days Average:', last90DaysAverage)
    // console.log('Last 30 Days Average:', last30DaysAverage)
    // console.log('Last 7 Days Average:', last7DaysAverage)
    // console.log('Last 2 Days Average:', last2DaysAverage)

    totalLossList[itemID].averageYear = thisYearAverage
    totalLossList[itemID].average90 = last90DaysAverage
    totalLossList[itemID].average30 = last30DaysAverage
    totalLossList[itemID].average7 = last7DaysAverage
    totalLossList[itemID].average2 = last2DaysAverage
  }

  fs.writeFileSync(path.join('_static/data/generated-kill-items.json'), JSON.stringify(totalLossList))
}
const generateKillData = async () => {
  const dates = produceDailyKillSums()
  aggregateKills(dates)
}
const init = async () => {
  const startTime = performance.now()

  await downloadKillData()
  await generateKillData()
  await downloadMarketHistory(300)
  await generateItemMarketHistory()

  await downloadTar('https://data.everef.net/reference-data/reference-data-latest.tar.xz', './_data/reference-data')
  await downloadCSV(LATEST_MARKET_ORDERS_URL_FUZZ, './_data/market-orders-fuzz', 'latest-market-orders-fuzz.csv') // Current price min

  await generateItemDetails()

  await downloadTar(LATEST_CONTRACTS_URL, './_data/contracts')
  await generateContractPrices()

  await generateBlueprintDetails()

  if (!fs.existsSync('./_data/eve-ref-esi-scrape/data.sha256')) {
    await downloadTar('https://data.everef.net/esi-scrape/eve-ref-esi-scrape-latest.tar.xz', './_data') // Don't always download
  }
  await generateSystemDetails()

  const endTime = performance.now()
  const elapsedTimeInSeconds = (endTime - startTime) / 1000
  console.log(`Update took: ${elapsedTimeInSeconds} seconds`)
}
init()
