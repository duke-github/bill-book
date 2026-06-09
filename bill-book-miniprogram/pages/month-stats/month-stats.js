const { request } = require('../../utils/request')
const { getLocalCategories } = require('../../utils/categories')

function formatMoney(value) {
  return Number(value || 0).toFixed(2).replace(/\.?0+$/, '')
}

function categoryIcon(type, code) {
  const cats = getLocalCategories(type)
  const found = cats.find(function (item) { return item.code === code })
  return found ? found.iconText : '◌'
}

function weekText(dateText) {
  var labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  var parts = dateText.split('-').map(Number)
  var date = new Date(parts[0], parts[1] - 1, parts[2])
  return labels[date.getDay()]
}

Page({
  data: {
    year: 0,
    month: 0,
    monthIncome: '0',
    monthExpense: '0',
    totalBalance: '0',
    activeType: 'EXPENSE',
    activeCategories: [],
    selectedCode: '',
    selectedName: '',
    selectedTotal: '0',
    selectedPercent: '0%',
    currentBills: [],
    billsMap: {},
    catTotals: {},
    hasData: false,
    loading: false,
    themeColor: '#87E8DE',
    buttonColor: '#5EC8FF'
  },

  // Store all items for re-filtering on type switch
  _allExpenseItems: [],
  _allIncomeItems: [],
  _totalExpense: 0,
  _totalIncome: 0,

  onLoad(options) {
    var now = new Date()
    this.setData({
      year: options.year ? Number(options.year) : now.getFullYear(),
      month: options.month ? Number(options.month) : now.getMonth() + 1
    })
  },

  onShow() {
    var app = getApp()
    this.setData({
      themeColor: app.globalData.themeColor || '#87E8DE',
      buttonColor: app.globalData.buttonColor || '#5EC8FF'
    })
    var loginReady = app.globalData.loginReady || Promise.resolve()
    var self = this
    loginReady.then(function () {
      self.loadData()
    }).catch(function (err) {
      console.error('[month-stats] login failed:', err)
    })
  },

  onPullDownRefresh() {
    this.loadData().finally(function () { wx.stopPullDownRefresh() })
  },

  loadData() {
    var self = this
    var year = this.data.year
    var month = this.data.month
    this.setData({ loading: true })

    return request({
      url: '/bills/month?year=' + year + '&month=' + month
    }).then(function (data) {
      if (!data) {
        self.setData({ hasData: false })
        return
      }

      var monthIncome = Number(data.monthIncome || 0)
      var monthExpense = Number(data.monthExpense || 0)

      // Flatten all items from days
      var allItems = []
      var days = data.days || []
      days.forEach(function (day) {
        var items = day.items || []
        items.forEach(function (item) {
          allItems.push(item)
        })
      })

      var expenseItems = allItems.filter(function (item) { return item.type === 'EXPENSE' })
      var incomeItems = allItems.filter(function (item) { return item.type === 'INCOME' })

      var totalExpense = expenseItems.reduce(function (sum, item) { return sum + Number(item.amount || 0) }, 0)
      var totalIncome = incomeItems.reduce(function (sum, item) { return sum + Number(item.amount || 0) }, 0)

      // Store for type switching
      self._allExpenseItems = expenseItems
      self._allIncomeItems = incomeItems
      self._totalExpense = totalExpense
      self._totalIncome = totalIncome

      // Build categories and bills for current type
      var activeType = self.data.activeType
      var built = self._buildForType(activeType)

      self.setData({
        monthIncome: formatMoney(monthIncome),
        monthExpense: formatMoney(monthExpense),
        totalBalance: formatMoney(monthIncome - monthExpense),
        hasData: true,
        activeCategories: built.categories,
        selectedCode: built.selectedCode,
        selectedName: built.selectedName,
        selectedTotal: built.selectedTotal,
        selectedPercent: built.selectedPercent,
        currentBills: built.currentBills,
        billsMap: built.billsMap,
        catTotals: built.catTotals
      })
    }).catch(function (err) {
      console.error('[month-stats] loadData error:', err)
      self.setData({ hasData: false })
    }).finally(function () {
      self.setData({ loading: false })
    })
  },

  _buildForType(type) {
    var items = type === 'EXPENSE' ? this._allExpenseItems : this._allIncomeItems
    var total = type === 'EXPENSE' ? this._totalExpense : this._totalIncome

    // Group items by category
    var map = {}
    var billsMap = {}
    items.forEach(function (item) {
      var code = item.categoryCode || 'OTHER'
      if (!map[code]) {
        map[code] = {
          code: code,
          name: item.categoryName || '未分类',
          iconText: categoryIcon(type, code),
          total: 0
        }
        billsMap[code] = []
      }
      map[code].total += Number(item.amount || 0)
      billsMap[code].push(item)
    })

    // Build sorted category list
    var catList = Object.keys(map).map(function (key) { return map[key] })
    catList.sort(function (a, b) { return b.total - a.total })
    var catTotals = {}
    catList.forEach(function (cat) {
      cat.amountText = formatMoney(cat.total)
      cat.percent = total > 0 ? (cat.total / total * 100).toFixed(1) + '%' : '0%'
      cat.percentNum = total > 0 ? cat.total / total * 100 : 0
      catTotals[cat.code] = cat.amountText
    })

    // Default select first category
    var selectedCode = catList.length > 0 ? catList[0].code : ''
    var selectedName = catList.length > 0 ? catList[0].name : ''
    var selectedTotal = catList.length > 0 ? catList[0].amountText : '0'
    var selectedPercent = catList.length > 0 ? catList[0].percent : '0%'

    // Build bill list for selected category
    var currentBills = this._buildBillList(billsMap[selectedCode] || [])

    // Mark active category
    catList.forEach(function (cat) {
      cat.active = cat.code === selectedCode
    })

    return {
      categories: catList,
      selectedCode: selectedCode,
      selectedName: selectedName,
      selectedTotal: selectedTotal,
      selectedPercent: selectedPercent,
      currentBills: currentBills,
      billsMap: billsMap,
      catTotals: catTotals
    }
  },

  _buildBillList(items) {
    // Sort by date descending
    var sorted = items.slice().sort(function (a, b) {
      return (b.recordDate || '').localeCompare(a.recordDate || '')
    })

    var lastDate = ''
    return sorted.map(function (item) {
      var remark = String(item.remark || '').trim()
      var categoryName = item.categoryName || item.categoryCode || '未分类'
      var showDateHeader = item.recordDate !== lastDate
      lastDate = item.recordDate

      var dateLabel = ''
      if (showDateHeader && item.recordDate) {
        var parts = item.recordDate.split('-')
        dateLabel = parts[1] + '月' + parts[2] + '日 ' + weekText(item.recordDate)
      }

      return {
        id: item.id,
        iconText: categoryIcon(item.type, item.categoryCode),
        recordTitle: remark || categoryName,
        amountText: formatMoney(item.amount),
        amountClass: item.type === 'EXPENSE' ? 'expense' : 'income',
        showDateHeader: showDateHeader,
        dateLabel: dateLabel,
        recordDate: item.recordDate
      }
    })
  },

  switchType(e) {
    var type = e.currentTarget.dataset.type
    if (type === this.data.activeType) return

    var built = this._buildForType(type)
    this.setData({
      activeType: type,
      activeCategories: built.categories,
      selectedCode: built.selectedCode,
      selectedName: built.selectedName,
      selectedTotal: built.selectedTotal,
      selectedPercent: built.selectedPercent,
      currentBills: built.currentBills,
      billsMap: built.billsMap,
      catTotals: built.catTotals
    })
  },

  selectCategory(e) {
    var code = e.currentTarget.dataset.code
    if (code === this.data.selectedCode) return

    var billsMap = this.data.billsMap
    var catTotals = this.data.catTotals
    var activeCategories = this.data.activeCategories.map(function (cat) {
      return { code: cat.code, name: cat.name, iconText: cat.iconText, amountText: cat.amountText, percent: cat.percent, percentNum: cat.percentNum, total: cat.total, active: cat.code === code }
    })

    var selectedCat = activeCategories.find(function (cat) { return cat.code === code })
    var currentBills = this._buildBillList(billsMap[code] || [])

    this.setData({
      activeCategories: activeCategories,
      selectedCode: code,
      selectedName: selectedCat ? selectedCat.name : '',
      selectedTotal: selectedCat ? selectedCat.amountText : '0',
      selectedPercent: selectedCat ? selectedCat.percent : '0%',
      currentBills: currentBills
    })
  },

  goBack() {
    wx.navigateBack({ fail: function () {
      wx.redirectTo({ url: '/pages/statistics/statistics' })
    }})
  }
})
