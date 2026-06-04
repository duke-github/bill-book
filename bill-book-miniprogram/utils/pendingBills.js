const { request } = require('./request')

const STORAGE_KEY = 'pending_bills'

function getPendingBills() {
  return wx.getStorageSync(STORAGE_KEY) || []
}

function setPendingBills(items) {
  wx.setStorageSync(STORAGE_KEY, items)
}

function addPendingBill(data) {
  const tempId = `pending_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const item = {
    tempId,
    data,
    createdAt: Date.now(),
    retryCount: 0
  }
  setPendingBills([item, ...getPendingBills()])
  return item
}

function removePendingBill(tempId) {
  setPendingBills(getPendingBills().filter(item => item.tempId !== tempId))
}

function retryPendingBills(delay = 0) {
  const run = () => {
    getPendingBills().forEach(item => {
      request({
        url: '/bills',
        method: 'POST',
        data: item.data,
        silent: true
      }).then(() => {
        removePendingBill(item.tempId)
      }).catch(() => {
        const pending = getPendingBills()
        setPendingBills(pending.map(next => (
          next.tempId === item.tempId
            ? { ...next, retryCount: (next.retryCount || 0) + 1 }
            : next
        )))
        const retryDelay = Math.min(30000, 2000 * Math.pow(2, item.retryCount || 0))
        retryPendingBills(retryDelay)
      })
    })
  }

  if (delay > 0) {
    setTimeout(run, delay)
    return
  }
  run()
}

module.exports = {
  addPendingBill,
  getPendingBills,
  retryPendingBills
}
