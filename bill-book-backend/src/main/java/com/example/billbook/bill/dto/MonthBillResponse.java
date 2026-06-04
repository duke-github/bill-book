package com.example.billbook.bill.dto;

import java.math.BigDecimal;
import java.util.List;

public record MonthBillResponse(
        int year,
        int month,
        BigDecimal monthIncome,
        BigDecimal monthExpense,
        List<DayBillGroupResponse> days
) {
}

