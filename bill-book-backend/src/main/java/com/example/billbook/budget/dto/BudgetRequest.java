package com.example.billbook.budget.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BudgetRequest(
        @NotNull @Min(2020) @Max(2100) Integer year,
        @NotNull @Min(1) @Max(12) Integer month,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 10, fraction = 2) BigDecimal amount
) {
}
