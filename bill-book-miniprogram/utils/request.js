const BASE_URL = 'http://47.93.160.247:9999/api'

function request(options) {
  return new Promise((resolve, reject) => {
    const token = options.skipAuth ? '' : wx.getStorageSync('auth_token')
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success(res) {
        const body = res.data || {}
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0) {
          resolve(body.data)
          return
        }
        const message = body.message || `请求失败(${res.statusCode})`
        console.error('接口请求失败', {
          url: options.url,
          statusCode: res.statusCode,
          body
        })
        if (!options.silent) {
          wx.showToast({
            title: message,
            icon: 'none'
          })
        }
        reject(new Error(message))
      },
      fail(err) {
        if (!options.silent) {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          })
        }
        reject(err)
      }
    })
  })
}

module.exports = {
  BASE_URL,
  request
}
