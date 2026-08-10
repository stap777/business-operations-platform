package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.PaymentAllocationRequest;
import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.AuditLogRepository;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.OrderService;
import com.asenterprises.bms.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
public class Phase3ReliabilityAndIntegrityTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentAllocationRepository paymentAllocationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    private User admin;
    private User manager;
    private Customer customer;
    private Product product;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        paymentAllocationRepository.deleteAll();
        paymentRepository.deleteAll();
        invoiceRepository.deleteAll();
        orderRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        customerRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(User.builder()
                .fullName("Phase3 Admin")
                .username("p3_admin")
                .password("encoded_pass")
                .phoneNumber("9111111111")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        manager = userRepository.save(User.builder()
                .fullName("Phase3 Manager")
                .username("p3_manager")
                .password("encoded_pass")
                .phoneNumber("9222222222")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-P3-01")
                .fullName("Phase3 Client")
                .phoneNumber("9888877776")
                .address("100 Phase3 Lane")
                .status(CustomerStatus.ACTIVE)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Phase3 Category")
                .status(CategoryStatus.ACTIVE)
                .build());

        product = productRepository.save(Product.builder()
                .name("Phase3 Product")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("1000.00"))
                .purchasePrice(new BigDecimal("600.00"))
                .availableStock(50)
                .minimumStock(5)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Phase 3 Audit #1: Database Constraint Violation -> Throws DataIntegrityViolationException")
    void testDatabaseConstraintViolationHandling() {
        // Attempt creating duplicate username
        User duplicate = User.builder()
                .fullName("Duplicate User")
                .username("p3_admin") // Existing username
                .password("encoded_pass")
                .phoneNumber("9999999999")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .build();

        assertThatThrownBy(() -> userRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Phase 3 Audit #2: Multiple Credit Orders - Paying Order A isolates Order B outstanding balance")
    void testMultipleCreditOrdersIsolation() {
        // Create Order A = ₹3,000 (3 units)
        OrderResponse orderA = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(3).build()))
                .build(), manager.getUsername());

        // Create Order B = ₹2,000 (2 units)
        OrderResponse orderB = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(2).build()))
                .build(), manager.getUsername());

        // Verify initial state
        assertThat(orderA.getTotalAmount()).isEqualByComparingTo("3000.00");
        assertThat(orderA.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);

        assertThat(orderB.getTotalAmount()).isEqualByComparingTo("2000.00");
        assertThat(orderB.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);

        // Fully Pay Order A (₹3,000)
        PaymentRequest pReq = PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("3000.00"))
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .remarks("Settling Order A")
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderA.getId())
                        .allocatedAmount(new BigDecimal("3000.00"))
                        .build()))
                .build();

        paymentService.createPayment(pReq, admin.getUsername());

        // Assert Order A is now PAID and outstanding = 0
        Order refreshedOrderA = orderRepository.findById(orderA.getId()).orElseThrow();
        assertThat(refreshedOrderA.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(refreshedOrderA.getAmountReceived()).isEqualByComparingTo("3000.00");

        // Assert Order B remains PENDING with full ₹2,000 outstanding intact
        Order refreshedOrderB = orderRepository.findById(orderB.getId()).orElseThrow();
        assertThat(refreshedOrderB.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(refreshedOrderB.getAmountReceived()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("Phase 3 Audit #3: Order Creation Failure Safety - Non-existent customer rejects without state mutation")
    void testOrderCreationFailureSafety() {
        OrderRequest invalidReq = OrderRequest.builder()
                .customerId(99999L) // Non-existent customer
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .build();

        assertThatThrownBy(() -> orderService.createOrder(invalidReq, manager.getUsername()))
                .isInstanceOf(com.asenterprises.bms.exception.ResourceNotFoundException.class);

        // Assert zero orders created in database
        assertThat(orderRepository.count()).isEqualTo(0);
        // Assert product stock unchanged
        Product refreshedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(refreshedProduct.getAvailableStock()).isEqualTo(50);
    }
}
