const THEME_KEY = 'theme_color'
const BUTTON_KEY = 'button_color'

const DEFAULT_THEME = '#87E8DE'
const DEFAULT_BUTTON = '#5EC8FF'

function getThemeColor() {
  return wx.getStorageSync(THEME_KEY) || DEFAULT_THEME
}

function setThemeColor(color) {
  wx.setStorageSync(THEME_KEY, color)
}

function getButtonColor() {
  return wx.getStorageSync(BUTTON_KEY) || DEFAULT_BUTTON
}

function setButtonColor(color) {
  wx.setStorageSync(BUTTON_KEY, color)
}

module.exports = {
  DEFAULT_THEME,
  DEFAULT_BUTTON,
  getThemeColor,
  setThemeColor,
  getButtonColor,
  setButtonColor
}
