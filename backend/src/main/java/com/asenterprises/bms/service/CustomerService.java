package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.CustomerDropdownResponse;
import com.asenterprises.bms.dto.CustomerRequest;
import com.asenterprises.bms.dto.CustomerResponse;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.exception.ResourceAlreadyExistsException;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service providing business operations for managing customer records, string trimming,
 * duplicate validation, dropdown data retrieval, and customer code formatting.
 */
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        String trimmedPhone = trim(request.getPhoneNumber());

        if (customerRepository.existsByPhoneNumber(trimmedPhone)) {
            throw new ResourceAlreadyExistsException("Customer with phone number " + trimmedPhone + " already exists");
        }

        String customerCode = generateCustomerCode();

        Customer customer = Customer.builder()
                .customerCode(customerCode)
                .fullName(trim(request.getFullName()))
                .phoneNumber(trimmedPhone)
                .alternatePhoneNumber(trim(request.getAlternatePhoneNumber()))
                .address(trim(request.getAddress()))
                .status(CustomerStatus.ACTIVE)
                .build();

        Customer savedCustomer = customerRepository.save(customer);
        return mapToResponse(savedCustomer);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        String trimmedPhone = trim(request.getPhoneNumber());

        if (customerRepository.existsByPhoneNumberAndIdNot(trimmedPhone, id)) {
            throw new ResourceAlreadyExistsException("Customer with phone number " + trimmedPhone + " already exists");
        }

        customer.setFullName(trim(request.getFullName()));
        customer.setPhoneNumber(trimmedPhone);
        customer.setAlternatePhoneNumber(trim(request.getAlternatePhoneNumber()));
        customer.setAddress(trim(request.getAddress()));

        Customer updatedCustomer = customerRepository.save(customer);
        return mapToResponse(updatedCustomer);
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return mapToResponse(customer);
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> searchCustomers(String query, Pageable pageable) {
        if (query == null || query.trim().isEmpty()) {
            return customerRepository.findAll(pageable).map(this::mapToResponse);
        }
        String searchQuery = query.trim();
        return customerRepository
                .findByFullNameContainingIgnoreCaseOrPhoneNumberContaining(searchQuery, searchQuery, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<CustomerDropdownResponse> getCustomerDropdown() {
        return customerRepository.findByStatusOrderByIdDesc(CustomerStatus.ACTIVE)
                .stream()
                .map(this::mapToDropdownResponse)
                .toList();
    }

    @Transactional
    public CustomerResponse deactivateCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        customer.setStatus(CustomerStatus.INACTIVE);
        Customer deactivatedCustomer = customerRepository.save(customer);
        return mapToResponse(deactivatedCustomer);
    }

    /**
     * TODO (V2 Improvement): The current MAX(id)+1 calculation is suitable for V1, but can suffer from race conditions
     * during concurrent customer creation under heavy load. Replace in V2 with a dedicated PostgreSQL database sequence
     * or distributed ID generator.
     */
    private synchronized String generateCustomerCode() {
        Long maxId = customerRepository.findMaxId().orElse(0L);
        return String.format("CUST-%04d", maxId + 1);
    }

    private String trim(String input) {
        return input != null ? input.trim() : null;
    }

    private CustomerResponse mapToResponse(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .customerCode(customer.getCustomerCode())
                .fullName(customer.getFullName())
                .phoneNumber(customer.getPhoneNumber())
                .alternatePhoneNumber(customer.getAlternatePhoneNumber())
                .address(customer.getAddress())
                .status(customer.getStatus())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }

    private CustomerDropdownResponse mapToDropdownResponse(Customer customer) {
        return CustomerDropdownResponse.builder()
                .id(customer.getId())
                .customerCode(customer.getCustomerCode())
                .fullName(customer.getFullName())
                .build();
    }
}
