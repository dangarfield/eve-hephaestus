import { openEVEContract, openEVEInformation, openEVEMarket } from './esi'
import { insertGraph } from './graph-price'

const displayBPData = (tableData) => {
  const html =
    `<div class="col-12">
        <p>
            Blueprint Name: ${tableData.bpName} - ${tableData.bpID}
            <span class="bi-graph-up text-primary" open-market="${tableData.bpID}"></span>
            <a class="btn btn-secondary btn-sm" href="https://www.adam4eve.eu/contract_price.php?typeID=${tableData.bpID}" target="_blank">
                <span class="bi-currency-pound"></span>
            </a>
            <a class="btn btn-secondary btn-sm" href="http://games.chruker.dk/eve_online/item.php?type_id=${tableData.bpID}" target="_blank">
                <span class="bi-info-circle-fill"></span>
            </a>

        </p>
        <p>
            Product Name: ${tableData.productName} - ${tableData.productID}
            <span class="bi-graph-up text-primary" open-market="${tableData.productID}"></span>
            <a class="btn btn-secondary btn-sm" href="https://www.adam4eve.eu/commodity.php?typeID=${tableData.productID}" target="_blank">
                <span class="bi-currency-pound"></span>
            </a>
        </p>
    </div>
    <div class="col-12">
      <canvas class="kill-loss-chart"></canvas>
    </div>`
  document.querySelector('.tab-blueprint').innerHTML = html

  insertGraph('.tab-blueprint .kill-loss-chart', tableData)

  //
}
export const getMaterialQuantity = (base, me) => {
// const base = material.quantity
//         const me = 10
  const runs = 1
  const ecModifier = 1
  //   const ecModifier = 1 - 0.01
  const ecRigModifier = 1
  //   const ecRigModifier = 1 - (0.02 * 1.9)
  //   const ecRigModifier = 1 - (0.024 * 1.9)

  const quantity = Math.max(runs, Math.ceil(Math.round((base * ((100 - (me + 0)) / 100) * ecModifier * ecRigModifier) * runs, 2)))
  return quantity
}
export const getSaleCostModifiers = () => {
  // TODO - Based on where to sell, get these properly
  const brokersFee = 0.0175
  const salesTax = 0.0448
  return { brokersFee, salesTax }
}
const calcCosts = (tableData, runs) => {
  const { brokersFee, salesTax } = getSaleCostModifiers()
  let matEff = 0
  let timeEff = 0
  const ecModifier = 1
  const ecRigModifier = 1
  if (tableData.bp.blueprintContracts.length > 0) {
    matEff = tableData.bp.blueprintContracts[0].matEff
    timeEff = tableData.bp.blueprintContracts[0].timeEff
  }
  // bpCost =
}
const displayMaterialsData = (tableData) => {
  const runs = 1
  let matEff = 0
  let timeEff = 0
  const ecModifier = 1
  const ecRigModifier = 1
  if (tableData.bp.blueprintContracts.length > 0) {
    matEff = tableData.bp.blueprintContracts[0].matEff
    timeEff = tableData.bp.blueprintContracts[0].timeEff
  }
  let totalVolume = 0
  const { brokersFee, salesTax } = getSaleCostModifiers()
  const matRows = tableData.materials.map(mat => {
    const adjustedQuantity = getMaterialQuantity(mat.quantity, matEff, ecModifier, ecRigModifier)
    const totalBuy = Math.ceil(adjustedQuantity * mat.typeData.buy.maxval)
    const totalSell = Math.ceil(adjustedQuantity * mat.typeData.sell.minval)
    const shouldBuy = totalSell - totalBuy > 150000
    const volume = adjustedQuantity * mat.typeData.packaged_volume
    totalVolume += volume
    return `<tr>
        <td>
            <img src="https://images.evetech.net/types/${mat.type_id}/icon?size=32" alt="">
            ${mat.typeData.name.en}
            <span class="bi-graph-up text-primary" open-market="${mat.type_id}"></span>
            <a href="https://www.adam4eve.eu/commodity.php?typeID=${mat.type_id}" target="_blank"><span class="bi-currency-pound"></span></a>
        </td>
        <td class="text-end">${Math.ceil(mat.quantity).toLocaleString()}</td>
        <td class="text-end">${adjustedQuantity.toLocaleString()}</td>
        <td class="text-end">${volume.toLocaleString()}</td>
        <td class="text-end">${mat.typeData.buy.maxval.toLocaleString()}</td>
        <td class="text-end">${mat.typeData.sell.minval.toLocaleString()}</td>
        <td class="text-end${shouldBuy ? ' text-warning' : ''}">${totalBuy.toLocaleString()}</td>
        <td class="text-end${shouldBuy ? '' : ' text-success'}">${totalSell.toLocaleString()}</td>
        </tr>`
  }).join('')
  const html =
    `<div class="col">
        <p>Materials for: ${tableData.productName} - ${tableData.bpID}</p>
        <p>ME: <span class="badge bg-secondary">${matEff}</span> - TE: <span class="badge bg-secondary">${timeEff}</span> - From BP Contract</p>
        <p>EC Mod: <span class="badge bg-secondary">${ecModifier}</span> - EC Rig Mod: <span class="badge bg-secondary">${ecRigModifier}</span> - FIXED</p>
    </div>
    <table class="table table-striped table-sm">
            <thead class="">
                <tr>
                    <th>Name</th>
                    <th class="text-end">Quantity</th>
                    <th class="text-end">Adjusted Quantity</th>
                    <th class="text-end">m<sup>3</sup></th>
                    <th class="text-end">Buy Price</th>
                    <th class="text-end">Sell Price</th>
                    <th class="text-end">Buy Total</th>
                    <th class="text-end">Sell Total</th>
                </tr>
            </thead>
            <tbody>
                ${matRows}
                <tr>
                    <td colspan="2"></td>
                    <td>Materials m<sup>3</sup></td>
                    <td class="text-end fw-bold">${totalVolume.toLocaleString()}</td>
                    <td></td>
                    <td>Material Costs</td>
                    <td class="text-end fw-bold">${Math.ceil(tableData.materialsBuyPrice).toLocaleString()}</td>
                    <td class="text-end fw-bold">${Math.ceil(tableData.materialsSellPrice).toLocaleString()}</td>
                </tr>
                <tr>
                    <td colspan="2"></td>
                    <td>Product m<sup>3</sup></td>
                    <td class="text-end">${tableData.productData.packaged_volume.toLocaleString()}</td>
                    <td></td>
                    <td>Job Cost</td>
                    <td class="text-end">${tableData.jobCost.toLocaleString()}</td>
                    <td class="text-end">${tableData.jobCost.toLocaleString()}</td>
                </tr>
                <tr>
                    <td colspan="5"></td>
                    <td>BP Cost</td>
                    <td class="text-end">${tableData.bpCostPerRun.toLocaleString()}</td>
                    <td class="text-end">${tableData.bpCostPerRun.toLocaleString()}</td>
                </tr>
                <tr>
                    <td colspan="5"></td>
                    <td>Total Build Costs</td>
                    <td class="text-end">${(Math.ceil(tableData.materialsBuyPrice) + tableData.jobCost + tableData.bpCostPerRun).toLocaleString()}</td>
                    <td class="text-end">${(Math.ceil(tableData.materialsSellPrice) + tableData.jobCost + tableData.bpCostPerRun).toLocaleString()}</td>
                </tr>
                <tr>
                    <td colspan="5"></td>
                    <td>Sell Price (${Math.ceil(tableData.productSellPrice).toLocaleString()} x${tableData.productQuantity})</td>
                    <td class="text-end">${(Math.ceil(tableData.productSellPrice) * tableData.productQuantity).toLocaleString()}</td>
                    <td class="text-end">${(Math.ceil(tableData.productSellPrice) * tableData.productQuantity).toLocaleString()}</td>
                </tr>
                <tr>
                    <td colspan="5"></td>
                    <td>Sales Tax</td>
                    <td class="text-end">${(Math.ceil(tableData.productSellPrice * tableData.productQuantity * brokersFee) + Math.ceil(tableData.productSellPrice * tableData.productQuantity * salesTax)).toLocaleString()}</td>
                    <td class="text-end">${(Math.ceil(tableData.productSellPrice * tableData.productQuantity * brokersFee) + Math.ceil(tableData.productSellPrice * tableData.productQuantity * salesTax)).toLocaleString()}</td>
                </tr>
                <tr>
                    <td colspan="2"></td>
                    <td>Runs</td>
                    <td class="text-end">${runs}</td>
                    <td></td>
                    <td>Profit</td>
                    <td class="text-end">${(
                        (Math.ceil(tableData.productSellPrice) * tableData.productQuantity) -
                        tableData.bpCostPerRun -
                        Math.ceil(tableData.materialsBuyPrice) -
                        tableData.jobCost -
                        Math.ceil(tableData.productSellPrice * tableData.productQuantity * brokersFee) -
                        Math.ceil(tableData.productSellPrice * tableData.productQuantity * salesTax)
                        ).toLocaleString()}
                    </td>
                    <td class="text-end">${(
                        (Math.ceil(tableData.productSellPrice) * tableData.productQuantity) -
                        Math.ceil(tableData.materialsSellPrice) -
                        tableData.jobCost -
                        tableData.bpCostPerRun -
                        Math.ceil(tableData.productSellPrice * tableData.productQuantity * brokersFee) -
                        Math.ceil(tableData.productSellPrice * tableData.productQuantity * salesTax)
                        ).toLocaleString()}
                    </td>
                </tr>
                <tr>
                    <td colspan="2"></td>
                    <td>Time</td>
                    <td class="text-end">${runs * tableData.time}</td>
                    <td></td>
                    <td>Profit per hour</td>
                    <td class="text-end">${(
                        (Math.ceil(tableData.productSellPrice) * tableData.productQuantity) -
                        tableData.bpCostPerRun -
                        Math.ceil(tableData.materialsBuyPrice) -
                        tableData.jobCost -
                        Math.ceil(tableData.productSellPrice * tableData.productQuantity * brokersFee) -
                        Math.ceil(tableData.productSellPrice * tableData.productQuantity * salesTax)
                        ).toLocaleString()}
                    </td>
                    <td class="text-end">${(
                        (Math.ceil(tableData.productSellPrice) * tableData.productQuantity) -
                        Math.ceil(tableData.materialsSellPrice) -
                        tableData.jobCost -
                        tableData.bpCostPerRun -
                        Math.ceil(tableData.productSellPrice * tableData.productQuantity * brokersFee) -
                        Math.ceil(tableData.productSellPrice * tableData.productQuantity * salesTax)
                        ).toLocaleString()}
                    </td>
                </tr>
            </tbody>
        </table>
    `
  document.querySelector('.tab-materials').innerHTML = html
}
const displayCostsData = (tableData) => {
  const html =
    `<div class="col">
        <p>Costs: </p>
    </div>`
  document.querySelector('.tab-costs').innerHTML = html
}
const displayContractsData = (tableData) => {
  const conRows = tableData.bp.blueprintContracts.sort((a, b) => a.pricePerRun - b.pricePerRun).map(con => {
    return `<tr>
        <td class="text-end">${parseInt(con.pricePerRun).toLocaleString()}</td>
        <td class="text-end">${parseInt(con.price).toLocaleString()}</td>
        <td class="text-end">${parseInt(con.quantity).toLocaleString()}</td>
        <td class="text-end">${parseInt(con.runs).toLocaleString()}</td>
        <td class="text-end">${con.isBPC ? '<span class="text-danger">BPC</span>' : '<span class="text-success">BPO</span>'}</td>
        <td class="text-end">${parseInt(con.matEff).toLocaleString()}</td>
        <td class="text-end">${parseInt(con.timeEff).toLocaleString()}</td>
        <td>
            <span class="bi-window-plus text-primary" open-contract="${con.contractID}"></span>
        </td>
    </tr>`
  }).join('')
  const html =
    `<div class="col">
        <p>
            Blueprint Name: ${tableData.bpName} - ${tableData.bpID}
            <a class="btn btn-secondary btn-tiny" href="https://www.adam4eve.eu/contract_price.php?typeID=${tableData.bpID}" target="_blank">
                <span class="bi-currency-pound"></span>
            </a>
        </p>
        <p>Contracts - Total available: ${tableData.bpAvailability}</p>
        <table class="table table-sm">
            <thead>
                <tr>
                <th class="text-end">Price Per Run</th>
                <th class="text-end">Price</th>
                <th class="text-end">Quantity</th>
                <th class="text-end">Runs</th>
                <th class="text-end">Is BPC</th>
                <th class="text-end">Mat Eff</th>
                <th class="text-end">Time Eff</th>
                <th>Open</th>
                </tr>
            </thead>
            <tbody>
                ${conRows}
            </tbody>
        </table>
    </div>`
  document.querySelector('.tab-contracts').innerHTML = html
}
const displayTab = (tab) => {
  document.querySelectorAll('.tab').forEach(tabContent => {
    tabContent.style.display = tabContent.classList.contains(`tab-${tab}`) ? 'block' : 'none'
  })
  document.querySelectorAll('.nav-tabs .nav-link').forEach(navLink => {
    navLink.classList.contains(`nav-${tab}`) ? navLink.classList.add('active') : navLink.classList.remove('active')
  })
}
export const bindNavClicks = () => {
  for (const navLink of [...document.querySelectorAll('.nav-tabs .nav-link')]) {
    navLink.addEventListener('click', (event) => {
      const tabName = [...event.target.classList].find(c => c !== 'nav-link' && c.startsWith('nav-')).replace('nav-', '')
      displayTab(tabName)
    })
  }
}
const bindOpenEVEWindow = () => {
  for (const windowLink of [...document.querySelectorAll('[open-contract]')]) {
    windowLink.addEventListener('click', (event) => {
      const windowID = event.target.getAttribute('open-contract')
      console.log('open-contract', windowID)
      openEVEContract(windowID)
    })
  }
  for (const windowLink of [...document.querySelectorAll('[open-market]')]) {
    windowLink.addEventListener('click', (event) => {
      const windowID = event.target.getAttribute('open-market')
      console.log('open-market', windowID)
      openEVEMarket(windowID)
    })
  }
  for (const windowLink of [...document.querySelectorAll('[open-information]')]) {
    windowLink.addEventListener('click', (event) => {
      const windowID = event.target.getAttribute('open-information')
      console.log('open-information', windowID)
      openEVEInformation(windowID)
    })
  }
}
export const displayDataForBP = async (tableData) => {
  console.log('displayDataForBP', tableData)
  displayBPData(tableData)
  displayMaterialsData(tableData)
  displayCostsData(tableData)
  displayContractsData(tableData)
  //   displayTab('blueprint')
  bindOpenEVEWindow()
}
