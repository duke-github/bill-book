const { request } = require('../../utils/request')
const { getThemeColor, setThemeColor, getButtonColor, setButtonColor } = require('../../utils/theme')

Page({
  data: {
    themeColor: '#87E8DE',
    buttonColor: '#5EC8FF',
    selectedTheme: '#87E8DE',
    selectedButton: '#5EC8FF',
    themeColors: [
      { label: '薄荷绿', value: '#87E8DE' },
      { label: '珊瑚红', value: '#FF8A80' },
      { label: '薰衣草', value: '#B39DDB' },
      { label: '天空蓝', value: '#81D4FA' },
      { label: '蜜桃色', value: '#FFAB91' },
      { label: '柠檬黄', value: '#FFF176' }
    ],
    buttonColors: [
      { label: '天空蓝', value: '#5EC8FF' },
      { label: '珊瑚红', value: '#FF6B6B' },
      { label: '清新绿', value: '#69DB7C' },
      { label: '优雅紫', value: '#9775FA' },
      { label: '活力橙', value: '#FFA94D' }
    ],
    budgetYearMonth: '',
    budgetAmount: ''
  },

  onShow() {
    const app = getApp()
    const themeColor = getThemeColor()
    const buttonColor = getButtonColor()
    app.globalData.themeColor = themeColor
    app.globalData.buttonColor = buttonColor

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const budgetYearMonth = `${year}-${month}`

    this.setData({
      themeColor,
      buttonColor,
      selectedTheme: themeColor,
      selectedButton: buttonColor,
      budgetYearMonth
    })

    this.loadBudget()
  },

  selectThemeColor(e) {
    const color = e.currentTarget.dataset.color
    this.setData({
      selectedTheme: color,
      themeColor: color
    })
    setThemeColor(color)
    getApp().globalData.themeColor = color
  },

  selectButtonColor(e) {
    const color = e.currentTarget.dataset.color
    this.setData({
      selectedButton: color,
      buttonColor: color
    })
    setButtonColor(color)
    getApp().globalData.buttonColor = color
  },

  onBudgetDateChange(e) {
    this.setData({ budgetYearMonth: e.detail.value })
    this.loadBudget()
  },

  onBudgetInput(e) {
    this.setData({ budgetAmount: e.detail.value })
  },

  loadBudget() {
    const parts = this.data.budgetYearMonth.split('-')
    if (parts.length < 2) return
    const year = Number(parts[0])
    const month = Number(parts[1])
    request({
      url: `/budgets?year=${year}&month=${month}`,
      silent: true
    }).then(data => {
      this.setData({
        budgetAmount: data && data.amount ? String(data.amount) : ''
      })
    }).catch(() => {
      this.setData({ budgetAmount: '' })
    })
  },

  saveBudget() {
    const parts = this.data.budgetYearMonth.split('-')
    if (parts.length < 2) {
      wx.showToast({ title: '请选择月份', icon: 'none' })
      return
    }
    const year = Number(parts[0])
    const month = Number(parts[1])
    const amount = Number(this.data.budgetAmount)
    if (!amount || amount <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    request({
      url: '/budgets',
      method: 'POST',
      data: { year, month, amount }
    }).then(() => {
      wx.showToast({ title: '预算已保存', icon: 'success' })
    })
  },

  openDetail() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.redirectTo({ url: '/pages/detail/detail' })
  },

  openAdd() {
    const pages = getCurrentPages()
    if (pages.length <= 1) {
      wx.redirectTo({ url: '/pages/detail/detail?openAdd=1' })
      return
    }
    wx.navigateBack({
      success() {
        setTimeout(() => {
          const pages = getCurrentPages()
          const detailPage = pages[pages.length - 1]
          if (detailPage && detailPage.openAdd) {
            detailPage.openAdd()
          }
        }, 50)
      }
    })
  },

  openStatistics() {
    wx.navigateTo({ url: '/pages/statistics/statistics' })
  }
})
