package com.asenterprises.bms.integration;

import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.VerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ValidationAndEdgeCasesIntegrationTest {

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
    private VerificationService verificationService;

    private User adminUser;
    private User managerUser;
    private Customer customer;
    private Product product;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.save(User.builder()
                .fullName("Admin User")
                .username("admin_val")
                .password("encoded_pass")
                .phoneNumber("9876543213")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        managerUser = userRepository.save(User.builder()
                .fullName("Manager User")
                .username("manager_val")
                .password("encoded_pass")
                .phoneNumber("9876543214")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-VAL-001")
                .fullName("Val Customer")
                .phoneNumber("9999900000")
                .address("Validation Address")
                .status(CustomerStatus.ACTIVE)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Val Category")
                .status(com.asenterprises.bms.entity.CategoryStatus.ACTIVE)
                .build());

        product = productRepository.save(Product.builder()
                .name("Validation Product")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("60.00"))
                .availableStock(5)
                .minimumStock(2)
                .status(ProductStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Reject Verification for Order not in DELIVERED status")
    void testRejectVerificationForNonDeliveredOrder() {
        Order order = orderRepository.save(Order.builder()
                .orderNumber("ORD-VAL-001")
                .customer(customer)
                .manager(managerUser)
                .orderStatus(OrderStatus.CREATED)
                .paymentStatus(PaymentStatus.PENDING)
                .deliveryStatus(DeliveryStatus.PENDING)
                .subtotal(new BigDecimal("100.00"))
                .totalAmount(new BigDecimal("100.00"))
                .build());

        assertThatThrownBy(() -> verificationService.verifyOrder(order.getId(), adminUser.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only orders with status DELIVERED can be verified");
    }

    @Test
    @DisplayName("Reject Verification when Product stock is insufficient")
    void testRejectVerificationWhenStockInsufficient() {
        Order order = Order.builder()
                .orderNumber("ORD-VAL-002")
                .customer(customer)
                .manager(managerUser)
                .orderStatus(OrderStatus.DELIVERED)
                .paymentStatus(PaymentStatus.PENDING)
                .deliveryStatus(DeliveryStatus.DELIVERED)
                .subtotal(new BigDecimal("1000.00"))
                .totalAmount(new BigDecimal("1000.00"))
                .build();

        OrderItem item = OrderItem.builder()
                .product(product)
                .quantity(10) // Required 10, Available stock is 5
                .sellingPrice(new BigDecimal("100.00"))
                .lineTotal(new BigDecimal("1000.00"))
                .build();
        order.addItem(item);

        Order savedOrder = orderRepository.save(order);

        assertThatThrownBy(() -> verificationService.verifyOrder(savedOrder.getId(), adminUser.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Insufficient stock for product");
    }

    @Test
    @DisplayName("Reject Verification for duplicate Invoice generation")
    void testRejectDuplicateInvoiceVerification() {
        Order order = Order.builder()
                .orderNumber("ORD-VAL-003")
                .customer(customer)
                .manager(managerUser)
                .orderStatus(OrderStatus.DELIVERED)
                .paymentStatus(PaymentStatus.PENDING)
                .deliveryStatus(DeliveryStatus.DELIVERED)
                .subtotal(new BigDecimal("100.00"))
                .totalAmount(new BigDecimal("100.00"))
                .build();

        OrderItem item = OrderItem.builder()
                .product(product)
                .quantity(1)
                .sellingPrice(new BigDecimal("100.00"))
                .lineTotal(new BigDecimal("1000.00"))
                .build();
        order.addItem(item);

        Order savedOrder = orderRepository.save(order);

        // First verification succeeds
        verificationService.verifyOrder(savedOrder.getId(), adminUser.getUsername());

        // Second verification attempt fails
        assertThatThrownBy(() -> verificationService.verifyOrder(savedOrder.getId(), adminUser.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only orders with status DELIVERED can be verified");
    }
}
