const { request } = require('../../utils/request')

function formatMoney(value) {
  return Number(value || 0).toFixed(2).replace(/\.?0+$/, '')
}

function buildMonthRows(months) {
  return months.filter(item => {
    return Number(item.income || 0) !== 0 || Number(item.expense || 0) !== 0
  }).map(item => {
    const income = Number(item.income || 0)
    const expense = Number(item.expense || 0)
    const balance = income - expense
    return {
      ...item,
      incomeText: formatMoney(income),
      expenseText: formatMoney(expense),
      balanceText: formatMoney(balance),
      balanceClass: balance < 0 ? 'negative' : ''
    }
  })
}

Page({
  data: {
    year: 0,
    totalIncome: '0',
    totalExpense: '0',
    totalBalance: '0',
    months: [],
    loading: false,
    availableYears: [],
    themeColor: '#87E8DE',
    buttonColor: '#5EC8FF'
  },

  _lastMonthTapTime: 0,

  onLoad() {
    const now = new Date()
    this.setData({ year: now.getFullYear() })
  },

  onShow() {
    const app = getApp()
    this.setData({
      themeColor: app.globalData.themeColor || '#87E8DE',
      buttonColor: app.globalData.buttonColor || '#5EC8FF'
    })
    const loginReady = app.globalData.loginReady || Promise.resolve()
    loginReady.then(() => this.loadYear()).catch(() => {})
  },

  onPullDownRefresh() {
    this.loadYear().finally(() => wx.stopPullDownRefresh())
  },

  prevYear() {
    const targetYear = this.data.year - 1
    const availableYears = this.data.availableYears || []
    if (availableYears.length > 0 && !availableYears.includes(targetYear)) {
      wx.showToast({ title: '该年份无数据', icon: 'none' })
      return
    }
    this.setData({ year: targetYear })
    this.loadYear(targetYear)
  },

  nextYear() {
    const targetYear = this.data.year + 1
    const availableYears = this.data.availableYears || []
    if (availableYears.length > 0 && !availableYears.includes(targetYear)) {
      wx.showToast({ title: '该年份无数据', icon: 'none' })
      return
    }
    this.setData({ year: targetYear })
    this.loadYear(targetYear)
  },

  loadYear(year = this.data.year) {
    this.setData({ loading: true })
    this.loadAvailableYears()

    const requests = []
    for (let month = 1; month <= 12; month++) {
      requests.push(request({
        url: `/bills/month?year=${year}&month=${month}`,
        silent: true
      }).then(data => ({
        month,
        income: Number(data.monthIncome || 0),
        expense: Number(data.monthExpense || 0)
      })).catch(() => ({
        month,
        income: 0,
        expense: 0
      })))
    }

    return Promise.all(requests).then(rows => {
      rows.sort((a, b) => b.month - a.month)
      const totalIncome = rows.reduce((sum, item) => sum + item.income, 0)
      const totalExpense = rows.reduce((sum, item) => sum + item.expense, 0)
      this.setData({
        totalIncome: formatMoney(totalIncome),
        totalExpense: formatMoney(totalExpense),
        totalBalance: formatMoney(totalIncome - totalExpense),
        months: buildMonthRows(rows)
      })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  loadAvailableYears() {
    request({
      url: '/bills/available-years',
      silent: true
    }).then(years => {
      this.setData({ availableYears: years || [] })
    }).catch(() => {
      this.setData({ availableYears: [] })
    })
  },

  onMonthDoubleTap(e) {
    const month = e.currentTarget.dataset.month
    const now = Date.now()
    if (now - this._lastMonthTapTime < 400) {
      this._lastMonthTapTime = 0
      wx.navigateTo({
        url: '/pages/month-stats/month-stats?year=' + this.data.year + '&month=' + month
      })
    } else {
      this._lastMonthTapTime = now
    }
  },

  openDetail() {
    wx.redirectTo({
      url: '/pages/detail/detail'
    })
  },

  openAdd() {
    wx.redirectTo({
      url: '/pages/detail/detail?openAdd=1'
    })
  },

  openSettings() {
    wx.redirectTo({
      url: '/pages/settings/settings'
    })
  }
})
