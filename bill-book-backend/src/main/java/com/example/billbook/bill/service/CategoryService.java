package com.example.billbook.bill.service;

import com.example.billbook.bill.domain.BillType;
import com.example.billbook.bill.dto.CategoryResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private static final List<CategoryResponse> EXPENSE_CATEGORIES = List.of(
            category(BillType.EXPENSE, "FOOD", "餐饮", "🍚", 1),
            category(BillType.EXPENSE, "SHOPPING", "购物", "🛒", 2),
            category(BillType.EXPENSE, "SNACK", "零食饮料", "🥤", 3),
            category(BillType.EXPENSE, "TRAFFIC", "交通", "🚌", 4),
            category(BillType.EXPENSE, "MEDICAL", "医疗", "💊", 5),
            category(BillType.EXPENSE, "PHONE", "通讯", "📱", 6),
            category(BillType.EXPENSE, "HOUSE", "住房", "🏠", 7),
            category(BillType.EXPENSE, "STUDY", "学习", "📚", 8),
            category(BillType.EXPENSE, "LOTTERY", "彩票", "🎫", 9),
            category(BillType.EXPENSE, "WORK", "工作", "💼", 10),
            category(BillType.EXPENSE, "ENTERTAINMENT_SPEND", "娱乐开支", "🎮", 11),
            category(BillType.EXPENSE, "FRIENDS_FAMILY", "亲友", "👥", 12),
            category(BillType.EXPENSE, "HOME", "居家", "🧹", 13),
            category(BillType.EXPENSE, "ENTERTAINMENT", "娱乐", "🎬", 14),
            category(BillType.EXPENSE, "RED_PACKET_EXPENSE", "发红包", "🧧", 15),
            category(BillType.EXPENSE, "WEDDING", "结婚", "💍", 16),
            category(BillType.EXPENSE, "BEAUTY", "美容", "💄", 17),
            category(BillType.EXPENSE, "GIFT_MONEY", "礼金", "🎁", 18),
            category(BillType.EXPENSE, "EXPRESS", "快递", "📦", 19),
            category(BillType.EXPENSE, "CREDIT_CARD", "信用卡", "💳", 20)
    );

    private static final List<CategoryResponse> INCOME_CATEGORIES = List.of(
            category(BillType.INCOME, "SALARY", "工资", "💰", 1),
            category(BillType.INCOME, "RED_PACKET", "红包", "🧧", 2),
            category(BillType.INCOME, "INVEST", "理财", "📈", 3),
            category(BillType.INCOME, "PART_TIME", "兼职", "🚗", 4),
            category(BillType.INCOME, "GIFT_MONEY_INCOME", "礼金", "🎁", 5),
            category(BillType.INCOME, "OTHER", "其他", "✨", 99)
    );

    public List<CategoryResponse> list(BillType type) {
        return type == BillType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    }

    private static CategoryResponse category(BillType type, String code, String name, String iconText, int sort) {
        return new CategoryResponse(type, code, name, iconText, sort);
    }
}
