package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.CategoryDropdownResponse;
import com.asenterprises.bms.dto.CategoryRequest;
import com.asenterprises.bms.dto.CategoryResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.exception.ResourceAlreadyExistsException;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service handling category business operations: creation, updates, searching, dropdown retrieval,
 * and deactivation with active product dependency checks.
 */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String trimmedName = trim(request.getName());

        if (categoryRepository.existsByName(trimmedName)) {
            throw new ResourceAlreadyExistsException("Category with name '" + trimmedName + "' already exists");
        }

        Category category = Category.builder()
                .name(trimmedName)
                .description(trim(request.getDescription()))
                .status(CategoryStatus.ACTIVE)
                .build();

        Category savedCategory = categoryRepository.save(category);
        return mapToResponse(savedCategory);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        String trimmedName = trim(request.getName());

        if (categoryRepository.existsByNameAndIdNot(trimmedName, id)) {
            throw new ResourceAlreadyExistsException("Category with name '" + trimmedName + "' already exists");
        }

        category.setName(trimmedName);
        category.setDescription(trim(request.getDescription()));

        Category updatedCategory = categoryRepository.save(category);
        return mapToResponse(updatedCategory);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return mapToResponse(category);
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> searchCategories(String query, Pageable pageable) {
        return searchCategories(query, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> searchCategories(String query, CategoryStatus status, Pageable pageable) {
        String searchQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return categoryRepository.searchCategories(searchQuery, status, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<CategoryDropdownResponse> getCategoryDropdown() {
        return categoryRepository.findByStatusOrderByNameAsc(CategoryStatus.ACTIVE)
                .stream()
                .map(this::mapToDropdownResponse)
                .toList();
    }

    @Transactional
    public CategoryResponse deactivateCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (productRepository.existsByCategoryIdAndStatus(id, ProductStatus.ACTIVE)) {
            throw new IllegalArgumentException("Category cannot be deactivated because ACTIVE products are assigned to it");
        }

        category.setStatus(CategoryStatus.INACTIVE);
        Category deactivatedCategory = categoryRepository.save(category);
        return mapToResponse(deactivatedCategory);
    }

    @Transactional
    public CategoryResponse restoreCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        category.setStatus(CategoryStatus.ACTIVE);
        Category restoredCategory = categoryRepository.save(category);
        return mapToResponse(restoredCategory);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (productRepository.existsByCategoryIdAndStatus(id, ProductStatus.ACTIVE)) {
            throw new IllegalArgumentException("This category still contains products.");
        }

        categoryRepository.delete(category);
    }

    private String trim(String input) {
        return input != null ? input.trim() : null;
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .status(category.getStatus())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private CategoryDropdownResponse mapToDropdownResponse(Category category) {
        return CategoryDropdownResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .build();
    }
}
