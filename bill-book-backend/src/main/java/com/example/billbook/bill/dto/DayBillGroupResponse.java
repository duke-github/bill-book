package com.example.billbook.bill.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DayBillGroupResponse(
        LocalDate date,
        String week,
        BigDecimal dayIncome,
        BigDecimal dayExpense,
        List<BillRecordResponse> items
) {
}

