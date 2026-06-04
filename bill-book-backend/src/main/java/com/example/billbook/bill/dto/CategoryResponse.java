package com.example.billbook.bill.dto;

import com.example.billbook.bill.domain.BillType;

public record CategoryResponse(
        BillType type,
        String code,
        String name,
        String iconText,
        int sort
) {
}

