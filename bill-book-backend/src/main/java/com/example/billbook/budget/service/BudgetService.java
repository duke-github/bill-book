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

    private static final int GLOBAL_YEAR = 0;
    private static final int GLOBAL_MONTH = 0;

    private final MonthlyBudgetRepository repository;

    public BudgetService(MonthlyBudgetRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public BudgetResponse getGlobal(Long userId) {
        return repository.findGlobalByUser(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public BudgetResponse upsertGlobal(Long userId, BudgetRequest request) {
        Optional<MonthlyBudgetEntity> existing = repository.findGlobalByUser(userId);
        MonthlyBudgetEntity entity;
        if (existing.isPresent()) {
            entity = existing.get();
            entity.setAmount(request.amount());
            entity.setUpdatedAt(LocalDateTime.now());
        } else {
            entity = new MonthlyBudgetEntity();
            entity.setUserId(userId);
            entity.setYear(GLOBAL_YEAR);
            entity.setMonth(GLOBAL_MONTH);
            entity.setAmount(request.amount());
            entity.setDeleted(false);
        }
        repository.save(entity);
        return toResponse(entity);
    }

    private BudgetResponse toResponse(MonthlyBudgetEntity entity) {
        return new BudgetResponse(entity.getId(), entity.getAmount());
    }
}
