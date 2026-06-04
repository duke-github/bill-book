package com.example.billbook.bill.controller;

import com.example.billbook.bill.domain.BillType;
import com.example.billbook.bill.dto.CategoryResponse;
import com.example.billbook.bill.service.CategoryService;
import com.example.billbook.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<CategoryResponse>> list(@RequestParam(defaultValue = "EXPENSE") BillType type) {
        return ApiResponse.success(service.list(type));
    }
}

