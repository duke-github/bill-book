package com.example.billbook.bill.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record BillRecord(
        Long id,
        Long userId,
        BillType type,
        String categoryCode,
        String categoryName,
        BigDecimal amount,
        String remark,
        LocalDate recordDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean deleted
) {
}

