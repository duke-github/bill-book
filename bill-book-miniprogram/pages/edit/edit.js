const { request } = require('../../utils/request')
const { getLocalCategories } = require('../../utils/categories')
const { addPendingBill, retryPendingBills } = require('../../utils/pendingBills')

const USE_SYSTEM_KEYBOARD = false

function todayText() {
  const date = new Date()
  return formatDate(date)
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDate(dateText, offset) {
  const parts = dateText.split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  date.setDate(date.getDate() + offset)
  return formatDate(date)
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

function formatMoney(value) {
  return Number(value || 0).toFixed(2).replace(/\.?0+$/, '')
}

function isOperator(char) {
  return char === '+' || char === '-'
}

function normalizeAmountInput(value) {
  let text = String(value || '')
    .replace(/[^\d.]/g, '')
    .replace(/^0+(\d)/, '$1')

  const dotIndex = text.indexOf('.')
  if (dotIndex !== -1) {
    text = text.slice(0, dotIndex + 1) + text.slice(dotIndex + 1).replace(/\./g, '')
    const parts = text.split('.')
    text = `${parts[0] || '0'}.${(parts[1] || '').slice(0, 2)}`
  }

  return text || '0'
}

function buildCategoryState(type, selectedCode, selectedName) {
  const localCategories = getLocalCategories(type)
  const selected = localCategories.find(item => item.code === selectedCode) || localCategories[0]
  return {
    type,
    categories: localCategories.map(item => ({
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
    useSystemKeyboard: USE_SYSTEM_KEYBOARD,
    billId: null,
    title: '记账',
    type: DEFAULT_CATEGORY_STATE.type,
    categories: DEFAULT_CATEGORY_STATE.categories,
    selectedCategoryCode: DEFAULT_CATEGORY_STATE.selectedCategoryCode,
    selectedCategoryName: DEFAULT_CATEGORY_STATE.selectedCategoryName,
    amountText: '0',
    remark: '',
    recordDate: '',
    recordDateLabel: '',
    keys: ['7', '8', '9', '上一天', '4', '5', '6', '下一天', '1', '2', '3', '取消', '.', '0', '退格', '完成']
  },

  onLoad(options) {
    const recordDate = todayText()
    if (options.id) {
      const initialState = {
        billId: options.id,
        title: '编辑账单',
        recordDate,
        recordDateLabel: dateLabel(recordDate)
      }
      if (options.type && options.type !== this.data.type) {
        Object.assign(initialState, buildCategoryState(options.type))
      }
      const draftState = this.getDraftBillState(options.id)
      this.setData({
        ...initialState,
        ...draftState
      })
      const hasDraft = !!draftState
      if (!hasDraft) {
        this.loadBill(options.id)
      }
      return
    }
    this.setData({
      recordDate,
      recordDateLabel: dateLabel(recordDate)
    })
  },

  getDraftBillState(id) {
    const app = getApp()
    const draft = app.globalData.editingBillDraft
    if (!draft || String(draft.id) !== String(id)) {
      return null
    }
    return {
      ...buildCategoryState(draft.type, draft.categoryCode, draft.categoryName),
      type: draft.type,
      amountText: formatMoney(draft.amount),
      remark: draft.remark || '',
      recordDate: draft.recordDate,
      recordDateLabel: dateLabel(draft.recordDate)
    }
  },

  loadBill(id) {
    request({
      url: `/bills/${id}`
    }).then(bill => {
      this.applyCategories(bill.type, bill.categoryCode, bill.categoryName)
      this.setData({
        type: bill.type,
        amountText: formatMoney(bill.amount),
        remark: bill.remark || '',
        recordDate: bill.recordDate,
        recordDateLabel: dateLabel(bill.recordDate)
      })
    })
  },

  applyCategories(type, selectedCode, selectedName) {
    this.setData(buildCategoryState(type, selectedCode, selectedName))
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.type) {
      return
    }
    this.applyCategories(type)
  },

  selectCategory(e) {
    const code = e.currentTarget.dataset.code
    const category = this.data.categories.find(item => item.code === code)
    if (!category) {
      return
    }
    this.setData({
      categories: this.data.categories.map(item => ({
        ...item,
        active: item.code === code
      })),
      selectedCategoryCode: category.code,
      selectedCategoryName: category.name
    })
  },

  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  onDateChange(e) {
    const recordDate = e.detail.value
    this.setData({
      recordDate,
      recordDateLabel: dateLabel(recordDate)
    })
  },

  onAmountInput(e) {
    const amountText = normalizeAmountInput(e.detail.value)
    this.setData({ amountText })
    return amountText
  },

  onKeyTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === '完成') {
      this.saveBill()
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
      this.goBack()
      return
    }
    if (key === '退格') {
      const next = this.data.amountText.length <= 1 ? '0' : this.data.amountText.slice(0, -1)
      this.setData({ amountText: next })
      return
    }
    this.appendAmount(key)
  },

  appendAmount(key) {
    let current = this.data.amountText === '0' ? '' : this.data.amountText
    const last = current[current.length - 1]
    const parts = current.split(/[+-]/)
    const tail = parts[parts.length - 1]

    if (isOperator(key)) {
      if (!current || isOperator(last)) {
        return
      }
      if (last === '.') {
        current = current.slice(0, -1)
      }
      this.setData({ amountText: current + key })
      return
    }

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

  computeAmount() {
    let expression = this.data.amountText
    while (expression.length > 0 && (isOperator(expression[expression.length - 1]) || expression.endsWith('.'))) {
      expression = expression.slice(0, -1)
    }
    const tokens = expression.match(/[+-]?[^+-]+/g)
    if (!tokens) {
      return null
    }
    const total = tokens.reduce((sum, token) => sum + Number(token), 0)
    if (!Number.isFinite(total) || total <= 0) {
      return null
    }
    return Number(total.toFixed(2))
  },

  saveBill() {
    const amount = this.computeAmount()
    if (!amount) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      })
      return
    }
    const data = {
      type: this.data.type,
      categoryCode: this.data.selectedCategoryCode,
      categoryName: this.data.selectedCategoryName,
      amount,
      remark: this.data.remark,
      recordDate: this.data.recordDate
    }
    const isEdit = !!this.data.billId
    if (!isEdit) {
      addPendingBill(data)
      wx.showToast({
        title: '已记账',
        icon: 'success'
      })
      wx.navigateBack()
      retryPendingBills(1000)
      return
    }

    request({
      url: `/bills/${this.data.billId}`,
      method: 'PUT',
      data
    }).then(() => {
      wx.showToast({
        title: '已保存',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 350)
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
