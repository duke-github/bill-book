package com.example.billbook.budget.repository;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.billbook.budget.entity.MonthlyBudgetEntity;
import com.example.billbook.budget.mapper.MonthlyBudgetMapper;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class MonthlyBudgetRepository {

    private static final int GLOBAL_YEAR = 0;
    private static final int GLOBAL_MONTH = 0;

    private final MonthlyBudgetMapper mapper;

    public MonthlyBudgetRepository(MonthlyBudgetMapper mapper) {
        this.mapper = mapper;
    }

    public Optional<MonthlyBudgetEntity> findGlobalByUser(Long userId) {
        return findByUserYearMonth(userId, GLOBAL_YEAR, GLOBAL_MONTH);
    }

    public Optional<MonthlyBudgetEntity> findByUserYearMonth(Long userId, int year, int month) {
        LambdaQueryWrapper<MonthlyBudgetEntity> wrapper = new LambdaQueryWrapper<MonthlyBudgetEntity>()
                .eq(MonthlyBudgetEntity::getUserId, userId)
                .eq(MonthlyBudgetEntity::getYear, year)
                .eq(MonthlyBudgetEntity::getMonth, month)
                .eq(MonthlyBudgetEntity::getDeleted, false);
        return Optional.ofNullable(mapper.selectOne(wrapper));
    }

    public MonthlyBudgetEntity save(MonthlyBudgetEntity entity) {
        if (entity.getId() == null) {
            mapper.insert(entity);
        } else {
            mapper.updateById(entity);
        }
        return entity;
    }
}
