const { request } = require('./request')

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const LOGIN_PERMISSION_KEY = 'login_permission_confirmed'

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

function setAuth(data) {
  wx.setStorageSync(TOKEN_KEY, data.token)
  wx.setStorageSync(USER_KEY, {
    userId: data.userId,
    openid: data.openid
  })
}

function login() {
  return new Promise((resolve, reject) => {
    const token = getToken()
    if (token) {
      resolve(wx.getStorageSync(USER_KEY) || {})
      return
    }
    ensureLoginPermission()
      .then(() => wxLogin())
      .then(resolve)
      .catch(reject)
  })
}

function ensureLoginPermission() {
  if (wx.getStorageSync(LOGIN_PERMISSION_KEY)) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: '登录授权',
      content: '需要使用微信登录来保存你的账单数据',
      confirmText: '允许',
      cancelText: '暂不',
      success(res) {
        if (!res.confirm) {
          reject(new Error('未授权登录'))
          return
        }
        wx.setStorageSync(LOGIN_PERMISSION_KEY, true)
        resolve()
      },
      fail: reject
    })
  })
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (!res.code) {
          reject(new Error('微信登录失败'))
          return
        }
        request({
          url: '/auth/wechat-login',
          method: 'POST',
          data: {
            code: res.code
          },
          skipAuth: true
        }).then(data => {
          setAuth(data)
          resolve(data)
        }).catch(reject)
      },
      fail: reject
    })
  })
}

module.exports = {
  getToken,
  login
}
