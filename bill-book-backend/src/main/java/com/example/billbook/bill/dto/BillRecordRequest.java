package com.example.billbook.bill.dto;

import com.example.billbook.bill.domain.BillType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BillRecordRequest(
        @NotNull BillType type,
        @NotBlank @Size(max = 64) String categoryCode,
        @NotBlank @Size(max = 64) String categoryName,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 10, fraction = 2) BigDecimal amount,
        @Size(max = 255) String remark,
        @NotNull LocalDate recordDate
) {
}

