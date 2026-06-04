const { request } = require('../../utils/request')
const { getLocalCategories } = require('../../utils/categories')
const { addPendingBill, getPendingBills, retryPendingBills } = require('../../utils/pendingBills')

function todayText() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2).replace(/\.?0+$/, '')
}

function buildDateLabel(dateText, week) {
  const parts = dateText.split('-')
  return `${parts[1]}月${parts[2]}日 ${week}`
}

function weekText(dateText) {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const parts = dateText.split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return labels[date.getDay()]
}

function shiftDate(dateText, offset) {
  const parts = dateText.split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  date.setDate(date.getDate() + offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function categoryIcon(type, code, name) {
  const category = getLocalCategories(type).find(item => item.code === code)
  return category ? category.iconText : '◌'
}

function normalizeBillItem(item, pendingTempId) {
  const remark = String(item.remark || '').trim()
  const categoryName = item.categoryName || item.categoryCode || '未分类'
  return {
    ...item,
    id: item.id || pendingTempId,
    pending: item.pending || !!pendingTempId,
    iconText: categoryIcon(item.type, item.categoryCode, item.categoryName),
    recordTitle: remark || categoryName,
    amountText: `${item.type === 'EXPENSE' ? '-' : '+'}${formatMoney(item.amount)}`,
    amountClass: item.type === 'EXPENSE' ? 'expense' : 'income',
  }
}

function mergePendingBills(data, year, month) {
  const pendingItems = getPendingBills()
    .filter(item => {
      const [itemYear, itemMonth] = item.data.recordDate.split('-').map(Number)
      return itemYear === year && itemMonth === month
    })

  const dayMap = new Map((data.days || []).map(day => [
    day.date,
    {
      ...day,
      items: [...(day.items || [])]
    }
  ]))

  let monthIncome = Number(data.monthIncome || 0)
  let monthExpense = Number(data.monthExpense || 0)

  pendingItems.forEach(item => {
    const bill = item.data
    const day = dayMap.get(bill.recordDate) || {
      date: bill.recordDate,
      week: weekText(bill.recordDate),
      dayIncome: 0,
      dayExpense: 0,
      items: []
    }

    if (bill.type === 'EXPENSE') {
      day.dayExpense = Number(day.dayExpense || 0) + Number(bill.amount || 0)
      monthExpense += Number(bill.amount || 0)
    } else {
      day.dayIncome = Number(day.dayIncome || 0) + Number(bill.amount || 0)
      monthIncome += Number(bill.amount || 0)
    }

    day.items = [
      normalizeBillItem(bill, item.tempId),
      ...day.items
    ]
    dayMap.set(bill.recordDate, day)
  })

  return {
    ...data,
    monthIncome,
    monthExpense,
    days: Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date))
  }
}

function buildEditDraft(bill) {
  return {
    id: bill.id,
    type: bill.type,
    categoryCode: bill.categoryCode,
    categoryName: bill.categoryName,
    amount: bill.amount,
    remark: bill.remark || '',
    recordDate: bill.recordDate
  }
}

function dateLabel(dateText) {
  const today = todayText()
  if (dateText === today) {
    return '今天'
  }
  if (dateText === shiftDate(today, -1)) {
    return '昨天'
  }
  return dateText
}

function buildCategoryState(type, selectedCode, selectedName) {
  const localCategories = getLocalCategories(type)
  const selected = localCategories.find(item => item.code === selectedCode) || localCategories[0]
  return {
    editType: type,
    editCategories: localCategories.map(item => ({
      ...item,
      active: item.code === selected.code
    })),
    selectedCategoryCode: selectedCode || selected.code,
    selectedCategoryName: selectedName || selected.name
  }
}

const DEFAULT_CATEGORY_STATE = buildCategoryState('EXPENSE')

Page({
  data: {
    year: 0,
    month: 0,
    monthIncome: '0.00',
    monthExpense: '0.00',
    days: [],
    loading: false,
    editingVisible: false,
    editingBillId: null,
    editType: DEFAULT_CATEGORY_STATE.editType,
    editCategories: DEFAULT_CATEGORY_STATE.editCategories,
    selectedCategoryCode: DEFAULT_CATEGORY_STATE.selectedCategoryCode,
    selectedCategoryName: DEFAULT_CATEGORY_STATE.selectedCategoryName,
    amountText: '0',
    remark: '',
    recordDate: '',
    recordDateLabel: '',
    keys: ['7', '8', '9', '上一天', '4', '5', '6', '下一天', '1', '2', '3', '取消', '.', '0', '退格', '完成'],
    typeFilter: '',
    monthlyBudget: null,
    budgetText: '',
    themeColor: '#87E8DE',
    buttonColor: '#5EC8FF'
  },

  onLoad(options = {}) {
    const now = new Date()
    this.setData({
      year: options.year ? Number(options.year) : now.getFullYear(),
      month: options.month ? Number(options.month) : now.getMonth() + 1
    })
    if (options.openAdd === '1') {
      setTimeout(() => this.openAdd(), 80)
    }
  },

  onShow() {
    const app = getApp()
    this.setData({
      themeColor: app.globalData.themeColor || '#87E8DE',
      buttonColor: app.globalData.buttonColor || '#5EC8FF'
    })
    const loginReady = app.globalData.loginReady || Promise.resolve()
    loginReady.then(() => {
      this.loadMonth()
      retryPendingBills(1000)
    }).catch(() => {})
  },

  onPullDownRefresh() {
    this.loadMonth().finally(() => wx.stopPullDownRefresh())
  },

  loadMonth() {
    const { year, month } = this.data
    return this.loadMonthBy(year, month)
  },

  loadMonthBy(year, month) {
    this.setData({ loading: true })
    this.loadAvailableMonths(year)
    this.loadBudget(year, month)

    return request({
      url: `/bills/month?year=${year}&month=${month}`
    }).then(data => {
      this._rawMonthData = data
      this._applyTypeFilter()
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  _applyTypeFilter() {
    const data = this._rawMonthData
    if (!data) return
    const { year, month, typeFilter } = this.data
    let merged = mergePendingBills(data, year, month)

    const monthIncome = merged.monthIncome
    const monthExpense = merged.monthExpense

    let days = merged.days
    if (typeFilter) {
      days = days.map(day => {
        const filteredItems = (day.items || []).filter(item => item.type === typeFilter)
        let dayIncome = 0
        let dayExpense = 0
        if (typeFilter === 'INCOME') {
          dayIncome = filteredItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        } else {
          dayExpense = filteredItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        }
        return {
          ...day,
          items: filteredItems,
          dayIncome,
          dayExpense
        }
      }).filter(day => (day.items || []).length > 0)
    }

    days = days.map(day => ({
      ...day,
      dateLabel: buildDateLabel(day.date, day.week),
      dayIncomeText: formatMoney(day.dayIncome),
      dayExpenseText: formatMoney(day.dayExpense),
      items: (day.items || []).map(item => normalizeBillItem(item))
    }))

    this.setData({
      monthIncome: formatMoney(monthIncome),
      monthExpense: formatMoney(monthExpense),
      days
    })
  },

  loadAvailableMonths(year) {
    request({
      url: `/bills/available-months?year=${year}`,
      silent: true
    }).then(months => {
      this.setData({ availableMonths: months || [] })
    }).catch(() => {
      this.setData({ availableMonths: [] })
    })
  },

  loadBudget(year, month) {
    request({
      url: `/budgets`,
      silent: true
    }).then(data => {
      const budget = data && data.amount ? Number(data.amount) : null
      let budgetText = ''
      if (budget) {
        budgetText = formatMoney(budget)
      }
      this.setData({ monthlyBudget: budget, budgetText })
    }).catch(() => {
      this.setData({ monthlyBudget: null, budgetText: '' })
    })
  },

  prevMonth() {
    let { year, month } = this.data
    const availableMonths = this.data.availableMonths || []
    month -= 1
    if (month < 1) {
      year -= 1
      month = 12
      this.setData({ year, month })
      request({
        url: `/bills/available-months?year=${year}`,
        silent: true
      }).then(months => {
        months = months || []
        this.setData({ availableMonths: months })
        if (months.length > 0 && !months.includes(month)) {
          wx.showToast({ title: '没有更多数据了', icon: 'none' })
        } else {
          this.loadMonthBy(year, month)
        }
      }).catch(() => {
        this.loadMonthBy(year, month)
      })
      return
    }
    if (availableMonths.length > 0 && !availableMonths.includes(month)) {
      wx.showToast({ title: '没有更多数据了', icon: 'none' })
      return
    }
    this.setData({ year, month })
    this.loadMonthBy(year, month)
  },

  nextMonth() {
    let { year, month } = this.data
    const availableMonths = this.data.availableMonths || []
    month += 1
    if (month > 12) {
      year += 1
      month = 1
      this.setData({ year, month })
      request({
        url: `/bills/available-months?year=${year}`,
        silent: true
      }).then(months => {
        months = months || []
        this.setData({ availableMonths: months })
        if (months.length > 0 && !months.includes(month)) {
          wx.showToast({ title: '没有更多数据了', icon: 'none' })
        } else {
          this.loadMonthBy(year, month)
        }
      }).catch(() => {
        this.loadMonthBy(year, month)
      })
      return
    }
    if (availableMonths.length > 0 && !availableMonths.includes(month)) {
      wx.showToast({ title: '没有更多数据了', icon: 'none' })
      return
    }
    this.setData({ year, month })
    this.loadMonthBy(year, month)
  },

  onScrollToLower() {
    this._scrollEndReached = true
  },

  onListTouchStart(e) {
    if (!e.touches || !e.touches.length) return
    this._touchStartY = e.touches[0].clientY
  },

  onListTouchEnd(e) {
    if (!this._scrollEndReached) return
    if (this._touchStartY === undefined) return
    const endY = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0
    const diff = this._touchStartY - endY
    if (diff > 50) {
      this._swipeUpCount = (this._swipeUpCount || 0) + 1
      if (this._swipeUpCount === 1) {
        this._swipeUpTimer = setTimeout(() => {
          this._swipeUpCount = 0
        }, 2000)
      }
      if (this._swipeUpCount >= 2) {
        clearTimeout(this._swipeUpTimer)
        this._swipeUpCount = 0
        this._scrollEndReached = false
        this.prevMonth()
      }
    }
    this._touchStartY = undefined
  },

  toggleTypeFilter(e) {
    const type = e.currentTarget.dataset.type
    const currentFilter = this.data.typeFilter
    const newFilter = currentFilter === type ? '' : type
    this.setData({ typeFilter: newFilter })
    this._applyTypeFilter()
  },

  openAdd() {
    const recordDate = todayText()
    this.setData({
      editingVisible: true,
      editingBillId: null,
      ...buildCategoryState('EXPENSE'),
      amountText: '0',
      remark: '',
      recordDate,
      recordDateLabel: dateLabel(recordDate)
    })
  },

  openStatistics() {
    wx.redirectTo({
      url: '/pages/statistics/statistics'
    })
  },

  openSettings() {
    wx.redirectTo({
      url: '/pages/settings/settings'
    })
  },

  openEdit(e) {
    if (e.currentTarget.dataset.pending) {
      wx.showToast({
        title: '正在同步，请稍后',
        icon: 'none'
      })
      return
    }
    const id = e.currentTarget.dataset.id
    const bill = this.findBillById(id)
    if (!bill) {
      return
    }
    const draft = buildEditDraft(bill)
    this.setData({
      editingVisible: true,
      editingBillId: draft.id,
      ...buildCategoryState(draft.type, draft.categoryCode, draft.categoryName),
      amountText: formatMoney(draft.amount),
      remark: draft.remark || '',
      recordDate: draft.recordDate,
      recordDateLabel: dateLabel(draft.recordDate)
    })
  },

  findBillById(id) {
    for (const day of this.data.days) {
      const bill = (day.items || []).find(item => String(item.id) === String(id))
      if (bill) {
        return bill
      }
    }
    return null
  },

  showBillActions(e) {
    if (e.currentTarget.dataset.pending) {
      wx.showToast({
        title: '正在同步，请稍后',
        icon: 'none'
      })
      return
    }
    const id = e.currentTarget.dataset.id
    wx.showActionSheet({
      itemList: ['删除', '前一天', '后一天'],
      success: res => {
        if (res.tapIndex === 0) {
          this.confirmDelete(id)
          return
        }
        if (res.tapIndex === 1) {
          this.moveBillDate(id, -1)
          return
        }
        if (res.tapIndex === 2) {
          this.moveBillDate(id, 1)
        }
      }
    })
  },

  moveBillDate(id, offset) {
    const bill = this.findBillById(id)
    if (!bill) {
      return
    }
    request({
      url: `/bills/${id}`,
      method: 'PUT',
      data: {
        type: bill.type,
        categoryCode: bill.categoryCode,
        categoryName: bill.categoryName,
        amount: bill.amount,
        remark: bill.remark || '',
        recordDate: shiftDate(bill.recordDate, offset)
      }
    }).then(() => {
      wx.showToast({
        title: '已调整',
        icon: 'success'
      })
      this.loadMonth()
    })
  },

  confirmDelete(id) {
    request({
      url: `/bills/${id}`,
      method: 'DELETE'
    }).then(() => {
      wx.showToast({
        title: '已删除',
        icon: 'success'
      })
      this.loadMonth()
    })
  },

  closeEditor() {
    this.setData({ editingVisible: false })
  },

  switchEditType(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.editType) {
      return
    }
    this.setData(buildCategoryState(type))
  },

  selectEditCategory(e) {
    const code = e.currentTarget.dataset.code
    const category = this.data.editCategories.find(item => item.code === code)
    if (!category) {
      return
    }
    this.setData({
      editCategories: this.data.editCategories.map(item => ({
        ...item,
        active: item.code === code
      })),
      selectedCategoryCode: category.code,
      selectedCategoryName: category.name
    })
  },

  onEditRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  onEditDateChange(e) {
    const recordDate = e.detail.value
    this.setData({
      recordDate,
      recordDateLabel: dateLabel(recordDate)
    })
  },

  onEditKeyTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === '完成') {
      this.saveEditorBill()
      return
    }
    if (key === '上一天') {
      const recordDate = shiftDate(this.data.recordDate, -1)
      this.setData({
        recordDate,
        recordDateLabel: dateLabel(recordDate)
      })
      return
    }
    if (key === '下一天') {
      const recordDate = shiftDate(this.data.recordDate, 1)
      this.setData({
        recordDate,
        recordDateLabel: dateLabel(recordDate)
      })
      return
    }
    if (key === '取消') {
      this.closeEditor()
      return
    }
    if (key === '退格') {
      const next = this.data.amountText.length <= 1 ? '0' : this.data.amountText.slice(0, -1)
      this.setData({ amountText: next })
      return
    }
    this.appendEditAmount(key)
  },

  appendEditAmount(key) {
    let current = this.data.amountText === '0' ? '' : this.data.amountText
    const last = current[current.length - 1]
    const parts = current.split(/[+-]/)
    const tail = parts[parts.length - 1]

    if (key === '.') {
      if (tail.includes('.')) {
        return
      }
      this.setData({ amountText: current + (tail ? '.' : '0.') })
      return
    }

    if (tail.includes('.') && tail.split('.')[1].length >= 2) {
      return
    }
    if (current.length >= 16) {
      return
    }
    this.setData({ amountText: current + key })
  },

  computeEditAmount() {
    let expression = this.data.amountText
    while (expression.length > 0 && expression.endsWith('.')) {
      expression = expression.slice(0, -1)
    }
    const amount = Number(expression)
    if (!Number.isFinite(amount) || amount <= 0) {
      return null
    }
    return Number(amount.toFixed(2))
  },

  saveEditorBill() {
    const amount = this.computeEditAmount()
    if (!amount) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      })
      return
    }
    const data = {
      type: this.data.editType,
      categoryCode: this.data.selectedCategoryCode,
      categoryName: this.data.selectedCategoryName,
      amount,
      remark: this.data.remark,
      recordDate: this.data.recordDate
    }

    if (!this.data.editingBillId) {
      addPendingBill(data)
      wx.showToast({
        title: '已记账',
        icon: 'success'
      })
      this.closeEditor()
      this.loadMonth()
      retryPendingBills(1000)
      return
    }

    request({
      url: `/bills/${this.data.editingBillId}`,
      method: 'PUT',
      data
    }).then(() => {
      wx.showToast({
        title: '已保存',
        icon: 'success'
      })
      this.closeEditor()
      this.loadMonth()
    })
  }
})
