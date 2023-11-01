import { triggerLoginFlow, triggerLoginReturnFlow } from './login'
import { loadESIData } from './esi'
import { bindNavClicks, displayDataForBP, getMaterialQuantity, getSaleCostModifiers } from './display-data'
const Handsontable = window.Handsontable

let types
let typesMarketHistory
let blueprints
let tableDatas
let systems
let killItems
let esiData

const loadData = async () => {
  const typesRes = await window.fetch('/data/generated-types.json')
  types = await typesRes.json()
  const typesMarketHistoryRes = await window.fetch('/data/generated-types-market-history.json')
  typesMarketHistory = await typesMarketHistoryRes.json()
  const blueprintsRes = await window.fetch('/data/generated-blueprints.json')
  blueprints = await blueprintsRes.json()
  const blueprintsContractsRes = await window.fetch('/data/generated-blueprints-contracts.json')
  const blueprintContracts = await blueprintsContractsRes.json()
  for (const bpID of Object.keys(blueprintContracts)) {
    const bpC = blueprintContracts[bpID]
    const bp = blueprints[bpID]
    bp.blueprintContracts = bpC.contracts
  }
  const systemsRes = await window.fetch('/data/generated-systems.json')
  systems = await systemsRes.json()
  const killItemsRes = await window.fetch('/data/generated-kill-items.json')
  killItems = await killItemsRes.json()
}
const formatDuration = (seconds) => {
  if (seconds === 0) return '0s'
  const units = [
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
    { label: 's', seconds: 1 }
  ]
  return units
    .filter(unit => seconds >= unit.seconds)
    .map(unit => {
      const value = Math.floor(seconds / unit.seconds)
      seconds %= unit.seconds
      return `${value}${unit.label}`
    })
    .join(' ')
}
const hasLearnedSkills = (requiredSkills) => {
  let skillsLearned = 0
  let skillsNotLearned = 0

  // console.log('requiredSkills', requiredSkills)

  for (const skillID in requiredSkills) {
    const requiredLevel = requiredSkills[skillID]
    // console.log('requiredSkills', requiredSkills, skillID, requiredLevel)
    if (esiData === undefined) {
      skillsNotLearned++
      continue
    }
    const skill = esiData.skills.find(s => s.skill_id === parseInt(skillID))
    if (skill === undefined) {
      skillsNotLearned++
      continue
    }
    if (skill.active_skill_level >= requiredLevel) {
      skillsLearned++
    } else {
      skillsNotLearned++
    }
  }
  // console.log('requiredSkills END', skillsLearned, skillsNotLearned)
  return {
    skillsLearned, skillsNotLearned
  }
}

const prepareData = async () => {
  tableDatas = []
  const { systemIndexCost, facilityTax, sccSurchage } = getJobCostModifiers()
  const { brokersFee, salesTax } = getSaleCostModifiers()

  for (const bpID of Object.keys(blueprints)) {
    try {
      const bp = blueprints[bpID]
      const bpProductData = Object.values(bp.activities.manufacturing.products)[0]
      const productType = types[bpProductData.type_id]
      const marketHistory = typesMarketHistory[bpProductData.type_id]
      // console.log('productType', bp, bpProductData.type_id, productType)
      const bpMaterialsData = Object.values(bp.activities.manufacturing.materials)
      const productSellPrice = productType.sell.minval // TODO - This is not necessarily correct, this is just the current cheapest sell order
      // const productSellPrice = productType.buy.maxval // TODO - This is not necessarily correct, this is just the current cheapest sell order
      const killItem = killItems[parseInt(bpProductData.type_id)]
      const tableData = {
        bpID: bp.blueprint_type_id,
        bpName: types[bp.blueprint_type_id].name.en,
        bpCostPerRun: bp.blueprintContracts.length > 0 ? bp.blueprintContracts[0].pricePerRun : 999999999999,
        bpAvailability: bp.blueprintContracts.map(con => con.quantity * con.runs).reduce((acc, tot) => acc + tot, 0),
        bp,
        killItem,
        killDiff2to7: (killItem.average2 - killItem.average7) / killItem.average2,
        killDiff2to30: (killItem.average2 - killItem.average30) / killItem.average2,
        killDiff7to90: (killItem.average7 - killItem.average90) / killItem.average7,
        killDiff7toYear: (killItem.average7 - killItem.averageYear) / killItem.average7,
        killAverageISK2: Math.round(killItem.average2 * productSellPrice),
        killAverageISK7: Math.round(killItem.average7 * productSellPrice),
        time: bp.activities.manufacturing.time,
        productID: bpProductData.type_id,
        productQuantity: bpProductData.quantity,
        productName: productType.name.en,
        productData: productType,
        groupName: productType.groupName,
        marketGroupName: productType.marketGroupName,
        metaGroupName: productType.metaGroupName,
        categoryName: productType.categoryName,
        productSellPrice,
        productSellPriceTotal: productSellPrice * bpProductData.quantity,
        productSellOrdersCount: productType.sell.numorders,
        productBuyOrdersCount: productType.buy.numorders,
        salesFees: parseInt(productSellPrice * bpProductData.quantity * brokersFee) + parseInt(productSellPrice * bpProductData.quantity * salesTax),
        materialsBuyPrice: 0,
        materialsSellPrice: 0,
        materials: bpMaterialsData,
        blueprintPricePerRun: bp.blueprintPricePerRun,
        eiv: 0,
        averagePrice: marketHistory.averagePrice,
        volume30Days: marketHistory.volume30Days,
        averageVolume: Math.round(marketHistory.averageVolume)
        // average_price: 0,
        // adjusted_price: 0
      }
      let matEff = 0
      let timeEff = 0
      if (bp.blueprintContracts.length > 0) {
        matEff = bp.blueprintContracts[0].matEff
        timeEff = bp.blueprintContracts[0].timeEff
      }
      // 4,530,921
      for (const material of bpMaterialsData) {
        const materialType = types[material.type_id]
        material.typeData = materialType
        // material.eiv = materialType.eiv
        const quantity = getMaterialQuantity(material.quantity, matEff)
        // console.log(tableData.productName, '-', matEff, 'quantity', material.quantity, quantity)

        tableData.materialsBuyPrice += Math.ceil(materialType.buy.maxval * quantity)
        tableData.materialsSellPrice += Math.ceil(materialType.sell.minval * quantity)
        // tableData.eiv += ((materialType.eiv * material.quantity) / bpProductData.quantity)
        // tableData.average_price += ((materialType.average_price * material.quantity) / 1)
        tableData.eiv += (materialType.adjusted_price * material.quantity)
        if (tableData.productName === '\'Augmented\' Vespa') {
          console.log('materialType', materialType, materialType.type_id, materialType.name.en, materialType.sell.minval, materialType.buy.maxval, 'x', material.quantity, '=', parseInt(materialType.sell.minval * material.quantity), parseInt(materialType.buy.maxval * material.quantity))
        }
        if (materialType.adjusted_price === undefined) {
          console.log('MISSING adjusted_price', tableData.productName, '->', materialType.type_id, materialType.name.en, materialType)
        }
      }
      tableData.eiv = Math.round(tableData.eiv)

      tableData.jobCost = parseInt(tableData.eiv * systemIndexCost) + parseInt(tableData.eiv * facilityTax) + parseInt(tableData.eiv * sccSurchage)
      tableData.profitFromBuy =
        (tableData.productSellPrice * tableData.productQuantity) -
        tableData.bpCostPerRun -
        tableData.materialsBuyPrice -
        tableData.jobCost -
        tableData.salesFees
      tableData.profitFromSell = (tableData.productSellPrice * tableData.productQuantity) - tableData.bpCostPerRun - tableData.materialsSellPrice - tableData.jobCost - tableData.salesFees
      tableData.marginFromBuy = tableData.profitFromBuy / tableData.productSellPriceTotal
      tableData.marginFromSell = tableData.profitFromSell / tableData.productSellPriceTotal
      const sellCosts = (tableData.bpCostPerRun + tableData.materialsBuyPrice + tableData.jobCost + tableData.salesFees) * 0.8
      tableData.totalCostsFromSell = tableData.bpCostPerRun + tableData.materialsSellPrice + tableData.jobCost + tableData.salesFees
      tableData.mpp = Math.min(
        (((marketHistory.averagePrice * bpProductData.quantity) - sellCosts) * marketHistory.volume30Days),
        ((productSellPrice - sellCosts) * marketHistory.volume30Days)
      ) / 1000000000
      tableData.profitPerHourFromBuy = parseInt(tableData.profitFromBuy / (tableData.time / 3600))
      tableData.profitPerHourFromSell = parseInt(tableData.profitFromSell / (tableData.time / 3600))
      tableData.sellerCompetition = productType.sell.volume / marketHistory.averageVolume
      tableData.timeHuman = formatDuration(tableData.time)
      const { skillsLearned, skillsNotLearned } = hasLearnedSkills(bp.activities.manufacturing.required_skills)
      tableData.skillsLearned = skillsLearned
      tableData.skillsNotLearned = skillsNotLearned

      const maxUnitsProducedInADay = (86400 / tableData.time) * tableData.productQuantity
      const saturation = maxUnitsProducedInADay / marketHistory.averageVolume
      tableData.saturation = saturation
      const debugProducts = ['Tetryon Exotic Plasma XL', 'Marshal', 'Tengu', '\'Augmented\' Vespa', 'Large Trimark Armor Pump I', 'Coupling Array']
      if (debugProducts.includes(tableData.productName)) {
        console.log('tableData', tableData, bp, tableData.eiv, (tableData.eiv * systemIndexCost), (tableData.eiv * facilityTax), (tableData.eiv * sccSurchage), productType, marketHistory)
        console.log('sellerCompetition', productType.sell.volume, marketHistory.averageVolume, productType.sell.volume / marketHistory.averageVolume, marketHistory.averageVolume / productType.sell.volume)
        const worstSellPrice = Math.min(marketHistory.averagePrice, productSellPrice)
        const worstProfit = worstSellPrice - sellCosts
        console.log('mpp', tableData.mpp, 'prices', marketHistory.averagePrice, productSellPrice, '->', worstSellPrice, 'volume', marketHistory.volume30Days, 'costs', sellCosts, 'profit', worstProfit, 'mpp', (worstProfit * marketHistory.volume30Days) / 1000000000)
        console.log('saturation', 'averageVolume', marketHistory.averageVolume, 'maxUnitsProducedInADay', maxUnitsProducedInADay, 'saturation', saturation)
      }
      tableDatas.push(tableData)
    } catch (error) {

    }
  }
}
const getSystemIDFromName = (name) => {
  return Object.keys(systems).find((key) => systems[key].solar_system_name === name)
}
const getJobCostModifiers = () => {
  const systemID = getSystemIDFromName('Kamokor') // 3300000 - 890000
  // const systemID = getSystemIDFromName('Jita')
  const system = systems[systemID]
  console.log('systemCostIndex', system)
  // TODO - Implement dropdown etc
  const systemIndexCost = system.cost_indices.manufacturing
  const facilityTax = 0.0025 // TODO - Get these properly
  const sccSurchage = 0.015 // TODO - Get these properly
  return { systemIndexCost, facilityTax, sccSurchage }
}

const createGrid = async () => {
  const container = document.querySelector('.data-table')
  const fields = [
    { data: 'productName', colName: 'Product Name' },
    { data: 'productID', colName: 'ID', type: 'numeric' },
    { data: 'groupName', colName: 'Group' },
    { data: 'categoryName', colName: 'Category' },
    { data: 'marketGroupName', colName: 'Market' },
    { data: 'metaGroupName', colName: 'Meta' },

    { data: 'profitFromBuy', colName: 'Profit Buy', type: 'numeric', numericFormat: { pattern: '0,0' }, colorScales: true, min: -50000000, max: 50000000 },
    { data: 'profitFromSell', colName: 'Profit Sell', type: 'numeric', numericFormat: { pattern: '0,0' }, colorScales: true, min: -50000000, max: 50000000 },
    { data: 'marginFromBuy', colName: 'Margin From Buy', type: 'numeric', numericFormat: { pattern: '0,0.00%' }, colorScales: true, min: -1, max: 1 },
    { data: 'marginFromSell', colName: 'Margin From Sell', type: 'numeric', numericFormat: { pattern: '0,0.00%' }, colorScales: true, min: -1, max: 1 },
    { data: 'profitPerHourFromBuy', colName: 'ISK/H Buy', type: 'numeric', numericFormat: { pattern: '0,0' }, colorScales: true, min: -50000000, max: 50000000 },
    { data: 'profitPerHourFromSell', colName: 'ISK/H Sell', type: 'numeric', numericFormat: { pattern: '0,0' }, colorScales: true, min: -50000000, max: 50000000 },

    { data: 'totalCostsFromSell', colName: 'Total Costs Sell', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'productSellPrice', colName: 'Product Sell Price', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'averageVolume', colName: 'Average Sales', type: 'numeric', numericFormat: { pattern: '0,0' }, colorScales: true, min: 0, max: 300 },
    { data: 'productSellOrdersCount', colName: 'Sell Orders', type: 'numeric' },
    { data: 'productBuyOrdersCount', colName: 'Buy Orders', type: 'numeric' },
    { data: 'sellerCompetition', colName: 'Seller Comp.', type: 'numeric', numericFormat: { pattern: '0,0.0' }, colorScales: true, min: 0, max: 15, colorInverse: true },
    { data: 'mpp', colName: 'MPP', type: 'numeric', numericFormat: { pattern: '0,0.0' }, colorScales: true, min: 0, max: 20 },
    { data: 'saturation', colName: 'Satur', type: 'numeric', numericFormat: { pattern: '0,0.0%' }, colorScales: true, min: 0, max: 1, colorInverse: true },

    { data: 'productQuantity', colName: 'Q' },

    { data: 'killDiff2to7', colName: 'K Trend 2-7', type: 'numeric', numericFormat: { pattern: '0,0.00%' } },
    { data: 'killDiff2to30', colName: 'K Trend 2-30', type: 'numeric', numericFormat: { pattern: '0,0.00%' } },
    { data: 'killDiff7to90', colName: 'K Trend 7-90', type: 'numeric', numericFormat: { pattern: '0,0.00%' } },
    { data: 'killDiff7toYear', colName: 'K Trend 7-Year', type: 'numeric', numericFormat: { pattern: '0,0.00%' } },

    { data: 'killAverageISK2', colName: 'K ISK 2', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'killAverageISK7', colName: 'K ISK 7', type: 'numeric', numericFormat: { pattern: '0,0' } },

    { data: 'time', colName: 'Time' },
    { data: 'timeHuman', colName: 'Time Human' },
    { data: 'skillsLearned', colName: 'Skills Learned', type: 'numeric' },
    { data: 'skillsNotLearned', colName: 'Skills Not Learned', type: 'numeric', colorScales: true, min: 0, max: 1, colorInverse: true },

    { data: 'bpCostPerRun', colName: 'BP Cost', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'bpAvailability', colName: 'BP Avail', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'materialsBuyPrice', colName: 'Mats From Buy', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'materialsSellPrice', colName: 'Mats From Sell', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'jobCost', colName: 'Job Cost', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'salesFees', colName: 'Sales Fees', type: 'numeric', numericFormat: { pattern: '0,0' } }
  ]
  function getMinMaxValues (objects, fields) {
    const result = {}
    fields.forEach((field) => {
      if (field.colorScales) {
        const key = field.data
        const values = objects.map((obj) => obj[key]).filter((v) => !isNaN(v))
        console.log('getMinMaxValues', key, values)
        result[key] = {
          min: field.min === undefined ? Math.min(...values) : Math.max(Math.min(...values), field.min),
          max: field.max === undefined ? Math.max(...values) : Math.min(Math.max(...values), field.max)
        }
        if (field.colorInverse) result[key].colorInverse = field.colorInverse
      }
    })
    return result
  }
  function calculateRGBA (min, max, actual, inverse) {
    let adjustedValue = actual + 0
    if (adjustedValue > max) adjustedValue = max
    if (adjustedValue < min) adjustedValue = min
    const position = (adjustedValue - min) / (max - min)
    const r = Math.round(255 * (1 - position))
    const b = Math.round(255 * position)
    if (inverse) {
      return `rgba(${b},100,${r},0.8)`
    } else {
      return `rgba(${r},100,${b},0.8)`
    }
  }

  function negativeValueRenderer (instance, td, row, col, prop, value, cellProperties) {
    Handsontable.renderers.NumericRenderer.apply(this, arguments)
    // td.style.backgroundColor = `RGBA(${250 - parseInt(value) * 10}, 100,${parseInt(value) * 10}, 0.8)`
    td.style.color = '#eee'
    // td.innerHTML = `${td.innerHTML} &#8451; `
    const color = calculateRGBA(fieldsObj[prop].min, fieldsObj[prop].max, value, fieldsObj[prop].colorInverse)
    td.style.backgroundColor = color
    if ((row === 0 && prop === 'marginFromBuy') || (row === 100 && prop === 'marginFromBuy')) {
      // console.log('negativeValueRenderer', instance, td, row, col, prop, value, cellProperties, fieldsObj, color)
    }
  }
  const getFieldIndex = (fieldName) => {
    return fields.findIndex(f => f.data === fieldName)
  }

  const fieldsObj = getMinMaxValues(tableDatas, fields)
  console.log('fieldsObj', fieldsObj)

  const hot = new Handsontable(container, {
    data: tableDatas,
    columns: fields, // .map(f => { return { data: f } }),
    colHeaders: fields.map(f => f.colName),
    rowHeaders: true,
    width: '100%',
    height: '100%',
    dropdownMenu: true,
    readOnly: true,
    licenseKey: 'non-commercial-and-evaluation',
    renderAllRows: false, // TODO
    columnSorting: true,
    filters: true,
    fixedColumnsLeft: 1,
    cells: function (row, col, prop) {
      const cellProperties = {}
      if (fieldsObj[prop] !== undefined) {
        cellProperties.renderer = negativeValueRenderer
      }
      return cellProperties
    }
  })
  hot.getPlugin('columnSorting').sort({ column: getFieldIndex('profitPerHourFromSell'), sortOrder: 'desc' })
  const filters = hot.getPlugin('Filters')
  filters.addCondition(getFieldIndex('averageVolume'), 'gte', [10])
  // filters.addCondition(getFieldIndex('skillsNotLearned'), 'eq', [0])
  // filters.addCondition(getFieldIndex('mpp'), 'gt', [1])
  // filters.addCondition(getFieldIndex('saturation'), 'lt', [0.5])
  filters.filter()

  hot.addHook('afterSelectionEnd', (row, prop, row2, prop2, selectionLayerLevel) => {
    if (row < 0 || prop < 0) return
    const productID = hot.getDataAtRow(row)[1]
    const tableData = tableDatas.find(d => d.productID === productID)
    console.log('afterSelectionEnd', row, prop, row2, prop2, selectionLayerLevel, productID, tableData)
    displayDataForBP(tableData)
  })

  document.querySelector('.clear-filters').addEventListener('click', () => {
    filters.clearConditions()
    filters.filter()
  })
  // console.log('table', table)
}

const isCheapestSignificantlyCheaper = (items, thresholdPercentage) => {
  if (items.length < 2) {
    // If there are fewer than 2 items, no comparison can be made
    return false
  }

  // Sort the items by price in ascending order
  const sortedItems = [...items].filter(b => b.isBPC === true).sort((a, b) => a.pricePerRun - b.pricePerRun)
  if (sortedItems.length < 2) {
    // If there are fewer than 2 items, no comparison can be made
    return false
  }
  // Get the price of the cheapest item
  const cheapestPrice = sortedItems[0].pricePerRun

  // Get the price of the second cheapest item
  const secondCheapestPrice = sortedItems[1].pricePerRun

  // Calculate the percentage difference
  const percentageDifference = ((secondCheapestPrice - cheapestPrice) / secondCheapestPrice) * 100

  // Check if the cheapest item is significantly cheaper
  return percentageDifference >= thresholdPercentage
}

const identifyCheapContracts = async () => {
  for (const bpIDString in blueprints) {
    const bpID = parseInt(bpIDString)
    const bpName = types[bpID].name.en
    const bpContracts = blueprints[bpID].blueprintContracts
    const shouldBuy = isCheapestSignificantlyCheaper(bpContracts, 60)
    if (shouldBuy && bpContracts[0].pricePerRun > 1000000) {
      console.log('identifyCheapContracts', bpName, shouldBuy, bpContracts[0].pricePerRun, bpContracts[1].pricePerRun, bpContracts.sort((a, b) => a.pricePerRun - b.pricePerRun))
    }
  }
}
const init = async () => {
  console.log('init')
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.has('code') && urlParams.has('state')) {
    triggerLoginReturnFlow()
  }
  // document.querySelector('.buttons').innerHTML = 'Actions - tbc'
  document.querySelector('.login').addEventListener('click', triggerLoginFlow)
  await loadData()
  esiData = await loadESIData()
  await prepareData()
  await createGrid()
  bindNavClicks()
  console.log('types', types)
  console.log('typesMarketHistory', typesMarketHistory)
  console.log('blueprints', blueprints)
  console.log('tableDatas', tableDatas)
  console.log('systems', systems)
  console.log('esiData', esiData)
  window.types = types
  window.typesMarketHistory = typesMarketHistory
  window.blueprints = blueprints
  window.tableDatas = tableDatas
  window.systems = systems
  window.killItems = killItems
  window.esiData = esiData
  await identifyCheapContracts()
}

init()

/*
Hi, I hope you're well. I've got a question if that's ok.

I've got a tool that's starting to come together, but I'm just missing one thing to give me a little confidence, well, two things really. 1) A realistic selling price to base potential profit on and 2) a level of confidence of whether the item will sell.

1) Realistic selling price - I'm current calculating this from fuzzworks `current.sell.minval` (eg, cheapest current order). This is fine for a guess, but a lot of the time it's not realistic to sell at that price as there could be low sell trade volume, temporarily inflated prices (and therefore low trade volume) etc. So, thoughts? What do you do here? What do you generally advise?

2) Confidence of selling - Given the first ('realistic selling price'), I'm looking at last 7 day trade volumes, 30 day market volumes, buy/sell order ratio, market saturation (what % of the market could a single slot produce compared to what is traded in a single day), market competitivity ( ratio of sell orders relative to total volume traded). I'm finding a few positive results, but still not really cracking it here. Do you just have sell orders open for months / check and update them every day? Any pointers on this too would be good.

I will sell at a loss when it is in my interest, but I want to have a good idea of where my costs are compared to market.  I accumulate large quantities of inputs, in some cases months worth of trade activity as this allows me to normalize my costs during more volatile moments (generally also caused by me)

Are some of the material sell prices unreasonable or zero?!

Add type groups etc

Add skills requirement - Show learned skills vs unlearned

Fill orders from jita and perimeter only (if possible)

Some level of 'good or bad', ideally visualised with color

Market bars to display the last x something or other, bar chart etc

click blueprint costs to see blueprint costs
click materials cost to see material costs

update contract to also reflect plex costs as it seems the packrat has 500 plex + 20,000 ISK, but stays at PLEX in my figures

Ensure that the mat eff and time eff from the cheapest price per run blueprint are reflected in the mineral cost calculations
*/
