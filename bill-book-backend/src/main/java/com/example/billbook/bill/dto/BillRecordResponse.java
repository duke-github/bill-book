package com.example.billbook.bill.dto;

import com.example.billbook.bill.domain.BillRecord;
import com.example.billbook.bill.domain.BillType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record BillRecordResponse(
        Long id,
        BillType type,
        String categoryCode,
        String categoryName,
        BigDecimal amount,
        String remark,
        LocalDate recordDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static BillRecordResponse from(BillRecord record) {
        return new BillRecordResponse(
                record.id(),
                record.type(),
                record.categoryCode(),
                record.categoryName(),
                record.amount(),
                record.remark(),
                record.recordDate(),
                record.createdAt(),
                record.updatedAt()
        );
    }
}

