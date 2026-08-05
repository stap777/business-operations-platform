package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByNameAndCategoryId(String name, Long categoryId);

    boolean existsByNameAndCategoryIdAndIdNot(String name, Long categoryId, Long id);

    boolean existsByCategoryIdAndStatus(Long categoryId, ProductStatus status);

    List<Product> findByStatusOrderByNameAsc(ProductStatus status);

    @Query("SELECT p FROM Product p JOIN FETCH p.category " +
           "WHERE (:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))) " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:lowStockOnly IS NULL OR :lowStockOnly = FALSE OR p.availableStock <= p.minimumStock)")
    Page<Product> searchProducts(
            @Param("name") String name,
            @Param("categoryId") Long categoryId,
            @Param("lowStockOnly") Boolean lowStockOnly,
            Pageable pageable
    );
}
