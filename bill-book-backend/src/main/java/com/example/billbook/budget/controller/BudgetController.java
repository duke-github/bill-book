package com.example.billbook.budget.controller;

import com.example.billbook.auth.service.AuthTokenService;
import com.example.billbook.budget.dto.BudgetRequest;
import com.example.billbook.budget.dto.BudgetResponse;
import com.example.billbook.budget.service.BudgetService;
import com.example.billbook.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService service;
    private final AuthTokenService tokenService;

    public BudgetController(BudgetService service, AuthTokenService tokenService) {
        this.service = service;
        this.tokenService = tokenService;
    }

    @GetMapping
    public ApiResponse<BudgetResponse> get(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam int year,
            @RequestParam int month
    ) {
        BudgetResponse budget = service.get(userId(authorization), year, month);
        return ApiResponse.success(budget);
    }

    @PostMapping
    public ApiResponse<BudgetResponse> upsert(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody BudgetRequest request
    ) {
        return ApiResponse.success(service.upsert(userId(authorization), request));
    }

    private Long userId(String authorization) {
        return tokenService.parseUserId(authorization);
    }
}
