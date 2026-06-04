const EXPENSE_CATEGORIES = [
  { type: 'EXPENSE', code: 'FOOD', name: '餐饮', iconText: '🍚' },
  { type: 'EXPENSE', code: 'SHOPPING', name: '购物', iconText: '🛒' },
  { type: 'EXPENSE', code: 'SNACK', name: '零食饮料', iconText: '🥤' },
  { type: 'EXPENSE', code: 'TRAFFIC', name: '交通', iconText: '🚌' },
  { type: 'EXPENSE', code: 'MEDICAL', name: '医疗', iconText: '💊' },
  { type: 'EXPENSE', code: 'PHONE', name: '通讯', iconText: '📱' },
  { type: 'EXPENSE', code: 'HOUSE', name: '住房', iconText: '🏠' },
  { type: 'EXPENSE', code: 'STUDY', name: '学习', iconText: '📚' },
  { type: 'EXPENSE', code: 'LOTTERY', name: '彩票', iconText: '🎫' },
  { type: 'EXPENSE', code: 'WORK', name: '工作', iconText: '💼' },
  { type: 'EXPENSE', code: 'ENTERTAINMENT_SPEND', name: '娱乐开支', iconText: '🎮' },
  { type: 'EXPENSE', code: 'FRIENDS_FAMILY', name: '亲友', iconText: '👥' },
  { type: 'EXPENSE', code: 'HOME', name: '居家', iconText: '🧹' },
  { type: 'EXPENSE', code: 'ENTERTAINMENT', name: '娱乐', iconText: '🎬' },
  { type: 'EXPENSE', code: 'RED_PACKET_EXPENSE', name: '发红包', iconText: '🧧' },
  { type: 'EXPENSE', code: 'WEDDING', name: '结婚', iconText: '💍' },
  { type: 'EXPENSE', code: 'BEAUTY', name: '美容', iconText: '💄' },
  { type: 'EXPENSE', code: 'GIFT_MONEY', name: '礼金', iconText: '🎁' },
  { type: 'EXPENSE', code: 'EXPRESS', name: '快递', iconText: '📦' },
  { type: 'EXPENSE', code: 'CREDIT_CARD', name: '信用卡', iconText: '💳' }
]

const INCOME_CATEGORIES = [
  { type: 'INCOME', code: 'SALARY', name: '工资', iconText: '💰' },
  { type: 'INCOME', code: 'RED_PACKET', name: '红包', iconText: '🧧' },
  { type: 'INCOME', code: 'INVEST', name: '理财', iconText: '📈' },
  { type: 'INCOME', code: 'PART_TIME', name: '兼职', iconText: '🚗' },
  { type: 'INCOME', code: 'GIFT_MONEY_INCOME', name: '礼金', iconText: '🎁' },
  { type: 'INCOME', code: 'OTHER', name: '其他', iconText: '✨' }
]

function getLocalCategories(type) {
  return type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

module.exports = {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getLocalCategories
}
