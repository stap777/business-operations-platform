package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.OperatingExpense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface OperatingExpenseRepository extends JpaRepository<OperatingExpense, Long> {

    @Query("SELECT SUM(e.amount) FROM OperatingExpense e WHERE e.expenseDate >= :startDate AND e.expenseDate <= :endDate")
    BigDecimal sumExpensesBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT DISTINCT e.category FROM OperatingExpense e ORDER BY e.category ASC")
    List<String> findDistinctCategories();

    @Query("SELECT e FROM OperatingExpense e WHERE " +
           "(:category IS NULL OR e.category = :category) AND " +
           "(CAST(:startDate AS java.time.LocalDate) IS NULL OR e.expenseDate >= :startDate) AND " +
           "(CAST(:endDate AS java.time.LocalDate) IS NULL OR e.expenseDate <= :endDate) " +
           "ORDER BY e.expenseDate DESC, e.id DESC")
    Page<OperatingExpense> searchExpenses(
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );
}
