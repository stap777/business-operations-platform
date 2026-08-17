package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.OperatingExpenseRequest;
import com.asenterprises.bms.dto.OperatingExpenseResponse;
import com.asenterprises.bms.entity.OperatingExpense;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.repository.OperatingExpenseRepository;
import com.asenterprises.bms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OperatingExpenseService {

    private final OperatingExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    @Transactional
    public OperatingExpenseResponse createExpense(OperatingExpenseRequest request, String username) {
        User creator = userRepository.findByUsername(username)
                .orElse(null);

        OperatingExpense expense = OperatingExpense.builder()
                .category(request.getCategory().trim().toUpperCase())
                .description(request.getDescription().trim())
                .amount(request.getAmount())
                .expenseDate(request.getExpenseDate())
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .createdBy(creator)
                .build();

        OperatingExpense saved = expenseRepository.save(expense);
        log.info("Created operating expense #{}: {} - {} - ₹{}", saved.getId(), saved.getCategory(), saved.getDescription(), saved.getAmount());
        return mapToResponse(saved);
    }

    @Transactional
    public OperatingExpenseResponse updateExpense(Long id, OperatingExpenseRequest request) {
        OperatingExpense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operating expense not found with ID: " + id));

        expense.setCategory(request.getCategory().trim().toUpperCase());
        expense.setDescription(request.getDescription().trim());
        expense.setAmount(request.getAmount());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);

        OperatingExpense updated = expenseRepository.save(expense);
        log.info("Updated operating expense #{}", updated.getId());
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteExpense(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new IllegalArgumentException("Operating expense not found with ID: " + id);
        }
        expenseRepository.deleteById(id);
        log.info("Deleted operating expense #{}", id);
    }

    @Transactional(readOnly = true)
    public Page<OperatingExpenseResponse> searchExpenses(String category, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return expenseRepository.searchExpenses(category, startDate, endDate, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return expenseRepository.findDistinctCategories();
    }

    private OperatingExpenseResponse mapToResponse(OperatingExpense expense) {
        return OperatingExpenseResponse.builder()
                .id(expense.getId())
                .category(expense.getCategory())
                .description(expense.getDescription())
                .amount(expense.getAmount())
                .expenseDate(expense.getExpenseDate())
                .notes(expense.getNotes())
                .createdByName(expense.getCreatedBy() != null ? expense.getCreatedBy().getFullName() : "System")
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }
}
