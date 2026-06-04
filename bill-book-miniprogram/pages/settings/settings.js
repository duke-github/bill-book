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
    budgetAmount: ''
  },

  onShow() {
    const app = getApp()
    const themeColor = getThemeColor()
    const buttonColor = getButtonColor()
    app.globalData.themeColor = themeColor
    app.globalData.buttonColor = buttonColor

    this.setData({
      themeColor,
      buttonColor,
      selectedTheme: themeColor,
      selectedButton: buttonColor
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

  onBudgetInput(e) {
    this.setData({ budgetAmount: e.detail.value })
  },

  loadBudget() {
    request({
      url: '/budgets',
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
    const amount = Number(this.data.budgetAmount)
    if (!amount || amount <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    request({
      url: '/budgets',
      method: 'POST',
      data: { amount }
    }).then(() => {
      wx.showToast({ title: '预算已保存', icon: 'success' })
    })
  },

  openDetail() {
    wx.redirectTo({ url: '/pages/detail/detail' })
  },

  openAdd() {
    wx.redirectTo({ url: '/pages/detail/detail?openAdd=1' })
  },

  openStatistics() {
    wx.redirectTo({ url: '/pages/statistics/statistics' })
  }
})
