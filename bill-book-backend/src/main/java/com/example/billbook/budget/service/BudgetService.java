package com.example.billbook.budget.service;

import com.example.billbook.budget.dto.BudgetRequest;
import com.example.billbook.budget.dto.BudgetResponse;
import com.example.billbook.budget.entity.MonthlyBudgetEntity;
import com.example.billbook.budget.repository.MonthlyBudgetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class BudgetService {

    private final MonthlyBudgetRepository repository;

    public BudgetService(MonthlyBudgetRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public BudgetResponse get(Long userId, int year, int month) {
        return repository.findByUserYearMonth(userId, year, month)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public BudgetResponse upsert(Long userId, BudgetRequest request) {
        Optional<MonthlyBudgetEntity> existing = repository.findByUserYearMonth(userId, request.year(), request.month());
        MonthlyBudgetEntity entity;
        if (existing.isPresent()) {
            entity = existing.get();
            entity.setAmount(request.amount());
            entity.setUpdatedAt(LocalDateTime.now());
        } else {
            entity = new MonthlyBudgetEntity();
            entity.setUserId(userId);
            entity.setYear(request.year());
            entity.setMonth(request.month());
            entity.setAmount(request.amount());
            entity.setDeleted(false);
        }
        repository.save(entity);
        return toResponse(entity);
    }

    private BudgetResponse toResponse(MonthlyBudgetEntity entity) {
        return new BudgetResponse(entity.getId(), entity.getYear(), entity.getMonth(), entity.getAmount());
    }
}
