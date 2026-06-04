package com.example.billbook.bill.service;

import com.example.billbook.bill.domain.BillRecord;
import com.example.billbook.bill.domain.BillType;
import com.example.billbook.bill.dto.BillRecordRequest;
import com.example.billbook.bill.dto.BillRecordResponse;
import com.example.billbook.bill.dto.DayBillGroupResponse;
import com.example.billbook.bill.dto.MonthBillResponse;
import com.example.billbook.bill.repository.BillRecordRepository;
import com.example.billbook.common.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class BillRecordService {

    private final BillRecordRepository repository;

    public BillRecordService(BillRecordRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public BillRecordResponse create(Long userId, BillRecordRequest request) {
        BillRecordRequest normalized = normalize(request);
        Long id = repository.insert(userId, normalized);
        return get(userId, id);
    }

    @Transactional(readOnly = true)
    public BillRecordResponse get(Long userId, Long id) {
        return repository.findById(userId, id)
                .map(BillRecordResponse::from)
                .orElseThrow(() -> new NotFoundException("账单不存在"));
    }

    @Transactional
    public BillRecordResponse update(Long userId, Long id, BillRecordRequest request) {
        BillRecordRequest normalized = normalize(request);
        int affected = repository.update(userId, id, normalized);
        if (affected == 0) {
            throw new NotFoundException("账单不存在");
        }
        return get(userId, id);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        int affected = repository.softDelete(userId, id);
        if (affected == 0) {
            throw new NotFoundException("账单不存在");
        }
    }

    @Transactional(readOnly = true)
    public MonthBillResponse getMonth(Long userId, int year, int month) {
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("month 必须在 1 到 12 之间");
        }
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1);
        List<BillRecord> records = repository.findByMonth(userId, startDate, endDate);

        BigDecimal monthIncome = BigDecimal.ZERO;
        BigDecimal monthExpense = BigDecimal.ZERO;
        Map<LocalDate, List<BillRecord>> grouped = new LinkedHashMap<>();

        for (BillRecord record : records) {
            if (record.type() == BillType.INCOME) {
                monthIncome = monthIncome.add(record.amount());
            } else {
                monthExpense = monthExpense.add(record.amount());
            }
            grouped.computeIfAbsent(record.recordDate(), key -> new ArrayList<>()).add(record);
        }

        List<DayBillGroupResponse> days = grouped.entrySet()
                .stream()
                .map(entry -> toDayGroup(entry.getKey(), entry.getValue()))
                .toList();

        return new MonthBillResponse(
                year,
                month,
                money(monthIncome),
                money(monthExpense),
                days
        );
    }

    @Transactional(readOnly = true)
    public List<Integer> getAvailableMonths(Long userId, int year) {
        return repository.findDistinctMonths(userId, year).stream()
                .map(LocalDate::getMonthValue)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Integer> getAvailableYears(Long userId) {
        return repository.findDistinctYears(userId);
    }

    private DayBillGroupResponse toDayGroup(LocalDate date, List<BillRecord> records) {
        BigDecimal dayIncome = BigDecimal.ZERO;
        BigDecimal dayExpense = BigDecimal.ZERO;
        for (BillRecord record : records) {
            if (record.type() == BillType.INCOME) {
                dayIncome = dayIncome.add(record.amount());
            } else {
                dayExpense = dayExpense.add(record.amount());
            }
        }
        List<BillRecordResponse> items = records.stream()
                .map(BillRecordResponse::from)
                .toList();
        return new DayBillGroupResponse(date, weekName(date.getDayOfWeek()), money(dayIncome), money(dayExpense), items);
    }

    private BillRecordRequest normalize(BillRecordRequest request) {
        String remark = request.remark() == null ? null : request.remark().trim();
        if (remark != null && remark.isEmpty()) {
            remark = null;
        }
        return new BillRecordRequest(
                request.type(),
                request.categoryCode().trim(),
                request.categoryName().trim(),
                money(request.amount()),
                remark,
                request.recordDate()
        );
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String weekName(DayOfWeek week) {
        return switch (week) {
            case MONDAY -> "星期一";
            case TUESDAY -> "星期二";
            case WEDNESDAY -> "星期三";
            case THURSDAY -> "星期四";
            case FRIDAY -> "星期五";
            case SATURDAY -> "星期六";
            case SUNDAY -> "星期日";
        };
    }
}

