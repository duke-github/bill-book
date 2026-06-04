const { login } = require('./utils/auth')
const { getThemeColor, getButtonColor } = require('./utils/theme')

App({
  globalData: {
    loginReady: null,
    themeColor: '#87E8DE',
    buttonColor: '#5EC8FF'
  },

  onLaunch() {
    this.globalData.loginReady = login().catch(error => {
      console.error('微信登录失败', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
      throw error
    })
    this.loadTheme()
  },

  loadTheme() {
    this.globalData.themeColor = getThemeColor()
    this.globalData.buttonColor = getButtonColor()
  }
})
