const movingAverage = (data, period) => {
  const result = []
  for (let i = 0; i < data.length; i++) {
    const slice = data.slice(Math.max(0, i - period + 1), i + 1)
    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length
    result.push(i < 7 ? null : avg)
  }
  return result
}
const calculateDonchianChannel = (data, period) => {
  // const upperLine = []
  // const lowerLine = []
  // const middleLine = []
  const donchain = []
  for (let i = period - 1; i < data.length; i++) {
    const highSlice = data.slice(i - period + 1, i + 1).map(entry => entry[1])
    const lowSlice = data.slice(i - period + 1, i + 1).map(entry => entry[0])

    const maxHigh = Math.max(...highSlice)
    const minLow = Math.min(...lowSlice)
    // const average = (maxHigh + minLow) / 2

    // upperLine.push(maxHigh)
    // lowerLine.push(minLow)
    // middleLine.push(average)
    donchain.push([minLow, maxHigh])
  }
  return donchain
  // return { upperLine, lowerLine, middleLine }
}

export const insertGraph = (selector, tableData) => {
  // const dates = Object.keys(tableData.killItem.dates)
  // const values = Object.values(tableData.killItem.dates)
  const history = window.typesMarketHistory[tableData.productID].history

  const dateKeys = Object.keys(tableData.killItem.dates)

  const minDate = new Date(Math.min(...dateKeys.map(date => new Date(date))))
  const maxDate = new Date(Math.max(...dateKeys.map(date => new Date(date))))

  // Create an array of all dates within the range
  const allDates = []
  const currentDate = new Date(minDate)

  while (currentDate <= maxDate) {
    allDates.push(currentDate.toISOString().split('T')[0])
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Fill in missing dates with a value of 0
  const killDataDates = {}
  const priceDataAverageDates = {}
  const priceDataMinMaxDates = {}
  const priceDataVolumeDates = {}
  // allDates.forEach(date => {
  let lastAveragePrice = null
  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i]

    killDataDates[date] = tableData.killItem.dates[date] || 0
    // console.log('date', history[0].date, date, history[0].date === date)

    priceDataAverageDates[date] = null
    priceDataMinMaxDates[date] = [null, null]
    priceDataVolumeDates[date] = null
    // TODO - For each date, if it doesn't exist, you should use the previous max average as this average and min/max
    const priceHistory = history.find(h => h.date === date)
    // console.log('date', date, priceHistory ? priceHistory.average : 'unknown')

    if (priceHistory) {
      lastAveragePrice = priceHistory.average
      priceDataAverageDates[date] = priceHistory.average
      priceDataMinMaxDates[date] = [priceHistory.lowest, priceHistory.highest]
      priceDataVolumeDates[date] = priceHistory.volume
    } else {
      console.log(' SET', date, lastAveragePrice)
      priceDataAverageDates[date] = lastAveragePrice
      priceDataMinMaxDates[date] = [lastAveragePrice, lastAveragePrice]
      priceDataVolumeDates[date] = 0
    }
    console.log(' val', date, priceDataAverageDates[date])
  }

  const dates = Object.keys(killDataDates)
  const killData = dates.map(date => killDataDates[date])
  const priceDataAverage = dates.map(date => priceDataAverageDates[date])
  const priceDataMinMax = dates.map(date => priceDataMinMaxDates[date])
  const priceDataVolume = dates.map(date => priceDataVolumeDates[date])

  const killMA7Data = movingAverage(killData, 7)
  const killMA20Data = movingAverage(killData, 20)
  const priceMA7Data = movingAverage(priceDataAverage, 7)
  const priceMA20Data = movingAverage(priceDataAverage, 20)

  const donchain = calculateDonchianChannel(priceDataMinMax, 20)
  console.log('kill', killData, killMA7Data)
  console.log('average', priceDataAverage, priceMA7Data)
  console.log('priceDataMinMax', priceDataMinMax)
  console.log('donchain', donchain)
  const Chart = window.Chart

  const ctx = document.querySelector(selector)
  // console.log('ctx', ctx)
  const myChart = new Chart(ctx, {
    // type: 'scatter',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Medium Day Price',
          data: priceDataAverage,
          backgroundColor: 'rgba(255, 191, 0, 0.5)',
          borderColor: 'rgba(255, 191, 0, 0.5)',
          borderWidth: 0,
          type: 'line',
          yAxisID: 'yAxisPrice'
        },
        {
          label: 'Destroyed',
          data: killData,
          backgroundColor: 'rgba(255, 99, 71, 0.5)',
          borderColor: 'rgba(255, 99, 71, 0.5)',
          borderWidth: 0,
          pointRadius: 2,
          type: 'scatter',
          yAxisID: 'yAxisKill'
        },
        {
          label: 'Destroyed 7 MA',
          data: killMA7Data,
          borderColor: 'rgba(255, 99, 71, 0.5)',
          borderWidth: 1,
          type: 'line',
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          yAxisID: 'yAxisKill'
        },
        {
          label: 'Destroyed 20 MA',
          data: killMA20Data,
          borderColor: 'rgba(255, 99, 71, 1)',
          borderWidth: 1,
          type: 'line',
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          yAxisID: 'yAxisKill'
        },
        {
          label: 'Price 7 MA',
          data: priceMA7Data,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          type: 'line',
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          yAxisID: 'yAxisPrice'
        },
        {
          label: 'Price 20 MA',
          data: priceMA20Data,
          borderColor: 'rgba(255, 191, 0, 1)',
          borderWidth: 1,
          type: 'line',
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          yAxisID: 'yAxisPrice'
        },
        {
          label: 'Min / Max Price',
          data: priceDataMinMax,
          backgroundColor: 'rgba(60, 60, 60, 1)',
          borderColor: 'rgba(60, 60, 60, 1)',
          borderWidth: 0,
          type: 'bar',
          yAxisID: 'yAxisPrice',
          hidden: true
        },
        {
          label: 'Donchain',
          data: donchain,
          backgroundColor: 'rgba(30, 30, 30, 0.5)',
          borderColor: 'rgba(30, 30, 30, 0.5)',
          borderWidth: 0,
          type: 'bar',
          yAxisID: 'yAxisPrice',
          hidden: true
        },
        {
          label: 'Volume',
          data: priceDataVolume,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 0.7)',
          type: 'bar',
          yAxisID: 'yAxisVolume',
          barPercentage: 1,
          barThickness: 3
        }

      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: tableData.productName
        }
      },
      scales: {
        yAxisPrice: {
          type: 'linear',
          position: 'left',
          beginAtZero: false
        },
        yAxisVolume: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          min: 0,
          max: Math.max(...priceDataVolume) * 4,
          barPercentage: 1,
          grid: {
            display: false
          }
        },
        yAxisKill: {
          type: 'linear',
          position: 'right',
          grid: {
            display: false
          }
        }
      }
    }
  })
  return myChart
}
