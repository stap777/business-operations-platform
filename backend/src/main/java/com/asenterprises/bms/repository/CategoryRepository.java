package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    Optional<Category> findByNameIgnoreCase(String name);

    Page<Category> findByNameContainingIgnoreCase(String name, Pageable pageable);

    List<Category> findByStatusOrderByNameAsc(CategoryStatus status);

    @org.springframework.data.jpa.repository.Query(
        value = "SELECT c FROM Category c WHERE (CAST(:query AS String) IS NULL OR LOWER(c.name) LIKE CONCAT('%', LOWER(CAST(:query AS String)), '%')) " +
                "AND (:status IS NULL OR c.status = :status)",
        countQuery = "SELECT COUNT(c) FROM Category c WHERE (CAST(:query AS String) IS NULL OR LOWER(c.name) LIKE CONCAT('%', LOWER(CAST(:query AS String)), '%')) " +
                     "AND (:status IS NULL OR c.status = :status)"
    )
    Page<Category> searchCategories(
            @org.springframework.data.repository.query.Param("query") String query,
            @org.springframework.data.repository.query.Param("status") CategoryStatus status,
            Pageable pageable
    );
}
