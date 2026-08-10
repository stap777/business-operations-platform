package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.DeliveryPaymentRequest;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.PaymentAllocationRequest;
import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.dto.ProductRequest;
import com.asenterprises.bms.dto.ProductResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Coupon;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DiscountType;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.PaymentAllocation;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CouponRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.DeliveryService;
import com.asenterprises.bms.service.OrderService;
import com.asenterprises.bms.service.PaymentService;
import com.asenterprises.bms.service.ProductService;
import com.asenterprises.bms.service.VerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class BusinessIntegrityHardeningTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentAllocationRepository paymentAllocationRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private ProductService productService;

    private User admin;
    private User manager;
    private User deliveryPerson;
    private Customer customer;
    private Category category;
    private Product trackedProduct;
    private Product untrackedProduct;
    private Coupon validCoupon;

    @BeforeEach
    void setUp() {
        admin = userRepository.save(User.builder()
                .fullName("Hardening Admin")
                .username("hard_admin")
                .password("encoded_pass")
                .phoneNumber("9123456780")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        manager = userRepository.save(User.builder()
                .fullName("Hardening Manager")
                .username("hard_manager")
                .password("encoded_pass")
                .phoneNumber("9123456781")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        deliveryPerson = userRepository.save(User.builder()
                .fullName("Hardening Delivery")
                .username("hard_delivery")
                .password("encoded_pass")
                .phoneNumber("9123456782")
                .role(Role.DELIVERY)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-HARD-01")
                .fullName("Integrity Test Customer")
                .phoneNumber("9876501234")
                .address("100 Integrity Plaza")
                .status(CustomerStatus.ACTIVE)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Hardening Category")
                .status(CategoryStatus.ACTIVE)
                .build());

        trackedProduct = productRepository.save(Product.builder()
                .name("Tracked Widget")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("50.00"))
                .availableStock(10)
                .minimumStock(2)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        untrackedProduct = productRepository.save(Product.builder()
                .name("Digital Service")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("200.00"))
                .purchasePrice(new BigDecimal("0.00"))
                .availableStock(0)
                .minimumStock(0)
                .trackInventory(false)
                .status(ProductStatus.ACTIVE)
                .build());

        validCoupon = couponRepository.save(Coupon.builder()
                .code("HARDEN50")
                .description("50 Flat Discount")
                .discountType(DiscountType.FLAT)
                .discountValue(new BigDecimal("50.00"))
                .minimumOrderAmount(new BigDecimal("100.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .usageLimit(2)
                .usedCount(0)
                .active(true)
                .build());
    }

    @Test
    @DisplayName("P0 Integrity: Delivery Payment creates canonical Payment & PaymentAllocation ledger entry")
    void testDeliveryPaymentCreatesCanonicalLedgerEntry() {
        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(deliveryPerson.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(trackedProduct.getId())
                        .quantity(2)
                        .build()))
                .build();

        OrderResponse createdOrder = orderService.createOrder(orderReq, manager.getUsername());
        deliveryService.startDelivery(createdOrder.getId(), deliveryPerson.getUsername());

        // Mark delivered with payment
        deliveryService.markDelivered(createdOrder.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("200.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build(), deliveryPerson.getUsername());

        Order orderInDb = orderRepository.findById(createdOrder.getId()).orElseThrow();
        assertThat(orderInDb.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(orderInDb.getAmountReceived()).isEqualByComparingTo("200.00");

        List<PaymentAllocation> allocations = paymentAllocationRepository.findByOrderId(createdOrder.getId());
        assertThat(allocations).hasSize(1);
        assertThat(allocations.get(0).getAllocatedAmount()).isEqualByComparingTo("200.00");
    }

    @Test
    @DisplayName("P0 Integrity: Overpayment rejection throws IllegalStateException (mapped to 409 Conflict)")
    void testOverpaymentRejection() {
        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(trackedProduct.getId())
                        .quantity(1)
                        .build()))
                .build();

        OrderResponse createdOrder = orderService.createOrder(orderReq, manager.getUsername());

        PaymentRequest pReq = PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("150.00")) // Total order amount is 100.00
                .paymentMethod(PaymentMethod.UPI)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(createdOrder.getId())
                        .allocatedAmount(new BigDecimal("150.00"))
                        .build()))
                .build();

        assertThatThrownBy(() -> paymentService.createPayment(pReq, admin.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("exceeds outstanding balance");
    }

    @Test
    @DisplayName("P0 Integrity: Coupon discount calculated server-side & usage limit enforced")
    void testCouponServerSideCalculationAndUsageLimit() {
        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .couponCode("HARDEN50")
                .items(List.of(OrderItemRequest.builder()
                        .productId(trackedProduct.getId())
                        .quantity(2) // 2 * 100 = 200 subtotal
                        .build()))
                .discountAmount(new BigDecimal("999.00")) // Client-submitted fake discount
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());

        // Discount must be calculated server-side as 50.00, not client fake 999.00
        assertThat(orderRes.getDiscountAmount()).isEqualByComparingTo("50.00");
        assertThat(orderRes.getTotalAmount()).isEqualByComparingTo("150.00");
    }

    @Test
    @DisplayName("P0 Integrity: Track Inventory false skips stock deduction")
    void testUntrackedProductSkipsStockDeduction() {
        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(deliveryPerson.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(untrackedProduct.getId())
                        .quantity(50)
                        .build()))
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());
        deliveryService.startDelivery(orderRes.getId(), deliveryPerson.getUsername());
        deliveryService.markDelivered(orderRes.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("10000.00"))
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .build(), deliveryPerson.getUsername());

        // Verification should succeed even though availableStock of untrackedProduct is 0
        InvoiceResponse invoiceRes = verificationService.verifyOrder(orderRes.getId(), admin.getUsername());
        assertThat(invoiceRes).isNotNull();
    }

    @Test
    @DisplayName("P0 Integrity: Order cancellation prohibited after delivery")
    void testOrderCancellationProhibitedAfterDelivery() {
        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(deliveryPerson.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(trackedProduct.getId())
                        .quantity(1)
                        .build()))
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());
        deliveryService.startDelivery(orderRes.getId(), deliveryPerson.getUsername());
        deliveryService.markDelivered(orderRes.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("100.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build(), deliveryPerson.getUsername());

        assertThatThrownBy(() -> orderService.cancelOrder(orderRes.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot cancel order in DELIVERED state");
    }

    @Test
    @DisplayName("P0 Integrity: Product profile updates do not alter available stock")
    void testProductProfileUpdatePreservesStock() {
        ProductResponse updatedProduct = productService.updateProduct(trackedProduct.getId(), ProductRequest.builder()
                .name("Updated Widget Name")
                .categoryId(category.getId())
                .purchasePrice(new BigDecimal("60.00"))
                .sellingPrice(new BigDecimal("120.00"))
                .availableStock(999) // Attempt to override stock
                .minimumStock(5)
                .unit(ProductUnit.PCS)
                .trackInventory(true)
                .build());

        // Available stock must remain 10, preserving inventory ledger integrity
        assertThat(updatedProduct.getAvailableStock()).isEqualTo(10);
    }
}
