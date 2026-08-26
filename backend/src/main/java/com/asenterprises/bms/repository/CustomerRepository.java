package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);

    Optional<Customer> findByCustomerCode(String customerCode);

    Page<Customer> findByFullNameContainingIgnoreCaseOrPhoneNumberContaining(String fullName, String phoneNumber, Pageable pageable);

    List<Customer> findByStatusOrderByIdDesc(CustomerStatus status);

    @Query(
        "SELECT c FROM Customer c WHERE (:query IS NULL OR LOWER(c.fullName) LIKE CONCAT('%', LOWER(:query), '%') OR c.phoneNumber LIKE CONCAT('%', :query, '%')) " +
        "AND (:status IS NULL OR c.status = :status)"
    )
    Page<Customer> searchCustomers(
            @org.springframework.data.repository.query.Param("query") String query,
            @org.springframework.data.repository.query.Param("status") CustomerStatus status,
            Pageable pageable
    );

    @Query("SELECT MAX(c.id) FROM Customer c")
    Optional<Long> findMaxId();
}
