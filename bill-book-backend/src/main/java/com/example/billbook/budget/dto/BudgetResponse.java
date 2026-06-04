package com.example.billbook.budget.dto;

import java.math.BigDecimal;

public record BudgetResponse(
        Long id,
        Integer year,
        Integer month,
        BigDecimal amount
) {
}
