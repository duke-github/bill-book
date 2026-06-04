package com.example.billbook.bill.controller;

import com.example.billbook.bill.dto.BillRecordRequest;
import com.example.billbook.bill.dto.BillRecordResponse;
import com.example.billbook.bill.dto.MonthBillResponse;
import com.example.billbook.bill.service.BillRecordService;
import com.example.billbook.auth.service.AuthTokenService;
import com.example.billbook.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/bills")
public class BillRecordController {

    private final BillRecordService service;
    private final AuthTokenService tokenService;

    public BillRecordController(BillRecordService service, AuthTokenService tokenService) {
        this.service = service;
        this.tokenService = tokenService;
    }

    @PostMapping
    public ApiResponse<BillRecordResponse> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody BillRecordRequest request
    ) {
        return ApiResponse.success(service.create(userId(authorization), request));
    }

    @GetMapping("/{id}")
    public ApiResponse<BillRecordResponse> get(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return ApiResponse.success(service.get(userId(authorization), id));
    }

    @PutMapping("/{id}")
    public ApiResponse<BillRecordResponse> update(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody BillRecordRequest request
    ) {
        return ApiResponse.success(service.update(userId(authorization), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        service.delete(userId(authorization), id);
        return ApiResponse.success();
    }

    @GetMapping("/month")
    public ApiResponse<MonthBillResponse> month(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam int year,
            @RequestParam @Min(1) @Max(12) int month
    ) {
        return ApiResponse.success(service.getMonth(userId(authorization), year, month));
    }

    @GetMapping("/available-months")
    public ApiResponse<List<Integer>> availableMonths(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam int year
    ) {
        return ApiResponse.success(service.getAvailableMonths(userId(authorization), year));
    }

    @GetMapping("/available-years")
    public ApiResponse<List<Integer>> availableYears(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return ApiResponse.success(service.getAvailableYears(userId(authorization)));
    }

    private Long userId(String authorization) {
        return tokenService.parseUserId(authorization);
    }
}
