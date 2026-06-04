package com.example.billbook.bill.repository;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.example.billbook.bill.domain.BillRecord;
import com.example.billbook.bill.domain.BillType;
import com.example.billbook.bill.dto.BillRecordRequest;
import com.example.billbook.bill.entity.BillRecordEntity;
import com.example.billbook.bill.mapper.BillRecordMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class BillRecordRepository {

    private final BillRecordMapper mapper;

    public BillRecordRepository(BillRecordMapper mapper) {
        this.mapper = mapper;
    }

    public Long insert(Long userId, BillRecordRequest request) {
        BillRecordEntity entity = toEntity(userId, request);
        int affected = mapper.insert(entity);
        if (affected == 0 || entity.getId() == null) {
            throw new IllegalStateException("账单创建失败");
        }
        return entity.getId();
    }

    public int update(Long userId, Long id, BillRecordRequest request) {
        LambdaUpdateWrapper<BillRecordEntity> wrapper = new LambdaUpdateWrapper<BillRecordEntity>()
                .eq(BillRecordEntity::getId, id)
                .eq(BillRecordEntity::getUserId, userId)
                .eq(BillRecordEntity::getDeleted, false)
                .set(BillRecordEntity::getType, request.type())
                .set(BillRecordEntity::getCategoryCode, request.categoryCode())
                .set(BillRecordEntity::getCategoryName, request.categoryName())
                .set(BillRecordEntity::getAmount, request.amount())
                .set(BillRecordEntity::getRemark, request.remark())
                .set(BillRecordEntity::getRecordDate, request.recordDate())
                .set(BillRecordEntity::getUpdatedAt, LocalDateTime.now());
        return mapper.update(null, wrapper);
    }

    public int softDelete(Long userId, Long id) {
        LambdaUpdateWrapper<BillRecordEntity> wrapper = new LambdaUpdateWrapper<BillRecordEntity>()
                .eq(BillRecordEntity::getId, id)
                .eq(BillRecordEntity::getUserId, userId)
                .eq(BillRecordEntity::getDeleted, false)
                .set(BillRecordEntity::getDeleted, true)
                .set(BillRecordEntity::getUpdatedAt, LocalDateTime.now());
        return mapper.update(null, wrapper);
    }

    public Optional<BillRecord> findById(Long userId, Long id) {
        LambdaQueryWrapper<BillRecordEntity> wrapper = new LambdaQueryWrapper<BillRecordEntity>()
                .eq(BillRecordEntity::getId, id)
                .eq(BillRecordEntity::getUserId, userId)
                .eq(BillRecordEntity::getDeleted, false);
        return Optional.ofNullable(mapper.selectOne(wrapper)).map(this::toDomain);
    }

    public List<BillRecord> findByMonth(Long userId, LocalDate startDate, LocalDate endDate) {
        LambdaQueryWrapper<BillRecordEntity> wrapper = new LambdaQueryWrapper<BillRecordEntity>()
                .eq(BillRecordEntity::getUserId, userId)
                .ge(BillRecordEntity::getRecordDate, startDate)
                .lt(BillRecordEntity::getRecordDate, endDate)
                .eq(BillRecordEntity::getDeleted, false)
                .orderByDesc(BillRecordEntity::getRecordDate)
                .orderByDesc(BillRecordEntity::getCreatedAt)
                .orderByDesc(BillRecordEntity::getId);
        return mapper.selectList(wrapper).stream().map(this::toDomain).toList();
    }

    public List<LocalDate> findDistinctMonths(Long userId, int year) {
        LambdaQueryWrapper<BillRecordEntity> wrapper = new LambdaQueryWrapper<BillRecordEntity>()
                .select(BillRecordEntity::getRecordDate)
                .eq(BillRecordEntity::getUserId, userId)
                .ge(BillRecordEntity::getRecordDate, LocalDate.of(year, 1, 1))
                .lt(BillRecordEntity::getRecordDate, LocalDate.of(year + 1, 1, 1))
                .eq(BillRecordEntity::getDeleted, false);
        return mapper.selectList(wrapper).stream()
                .map(BillRecordEntity::getRecordDate)
                .map(d -> d.withDayOfMonth(1))
                .distinct()
                .sorted()
                .toList();
    }

    public List<Integer> findDistinctYears(Long userId) {
        LambdaQueryWrapper<BillRecordEntity> wrapper = new LambdaQueryWrapper<BillRecordEntity>()
                .select(BillRecordEntity::getRecordDate)
                .eq(BillRecordEntity::getUserId, userId)
                .eq(BillRecordEntity::getDeleted, false);
        return mapper.selectList(wrapper).stream()
                .map(BillRecordEntity::getRecordDate)
                .map(d -> d.getYear())
                .distinct()
                .sorted()
                .toList();
    }

    private BillRecordEntity toEntity(Long userId, BillRecordRequest request) {
        BillRecordEntity entity = new BillRecordEntity();
        entity.setUserId(userId);
        entity.setType(request.type());
        entity.setCategoryCode(request.categoryCode());
        entity.setCategoryName(request.categoryName());
        entity.setAmount(request.amount());
        entity.setRemark(request.remark());
        entity.setRecordDate(request.recordDate());
        entity.setDeleted(false);
        return entity;
    }

    private BillRecord toDomain(BillRecordEntity entity) {
        return new BillRecord(
                entity.getId(),
                entity.getUserId(),
                entity.getType(),
                entity.getCategoryCode(),
                entity.getCategoryName(),
                entity.getAmount(),
                entity.getRemark(),
                entity.getRecordDate(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                Boolean.TRUE.equals(entity.getDeleted())
        );
    }
}
