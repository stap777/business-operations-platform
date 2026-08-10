package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.Coupon;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DiscountType;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CouponRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.OrderService;
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

/**
 * End-to-end integration test suite verifying Coupon application during order creation.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CouponOrderIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    private Customer customer;
    private User manager;
    private Product product;
    private Category category;

    @BeforeEach
    void setUp() {
        long seed = System.currentTimeMillis() % 1000000;

        manager = userRepository.save(User.builder()
                .fullName("Coupon Manager")
                .username("mgr_coupon_" + seed)
                .password("encoded_pass")
                .phoneNumber("96666" + String.format("%05d", seed % 100000))
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CC-" + seed)
                .fullName("Coupon Test Customer")
                .phoneNumber("95555" + String.format("%05d", seed % 100000))
                .address("123 Coupon Street")
                .status(CustomerStatus.ACTIVE)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Coupon Test Cat " + seed)
                .description("Category for Coupon tests")
                .build());

        // Product selling price = ₹1,000
        product = productRepository.save(Product.builder()
                .name("Coupon Test Product " + seed)
                .category(category)
                .purchasePrice(new BigDecimal("600.00"))
                .sellingPrice(new BigDecimal("1000.00"))
                .availableStock(100)
                .minimumStock(5)
                .unit(ProductUnit.PCS)
                .status(ProductStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Coupon Flow 1: Active 10% coupon applied during order creation calculates discount and increments usedCount exactly once")
    void testCouponAppliedDuringOrderCreation() {
        // Create active, valid coupon: 10% discount, min order ₹500
        Coupon coupon = couponRepository.save(Coupon.builder()
                .code("SAVE10")
                .description("10% Off")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00"))
                .minimumOrderAmount(new BigDecimal("500.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .usageLimit(10)
                .usedCount(0)
                .active(true)
                .build());

        OrderRequest request = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .couponCode("save10") // Test case insensitivity (lowercase input)
                .items(List.of(
                        OrderItemRequest.builder()
                                .productId(product.getId())
                                .quantity(1) // ₹1,000 subtotal
                                .build()
                ))
                .build();

        OrderResponse response = orderService.createOrder(request, manager.getUsername());

        assertThat(response).isNotNull();
        assertThat(response.getSubtotal()).isEqualByComparingTo(new BigDecimal("1000.00"));
        assertThat(response.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("900.00"));
        assertThat(response.getCouponCode()).isEqualTo("SAVE10");

        // Verify Coupon entity state in DB
        Coupon updatedCoupon = couponRepository.findById(coupon.getId()).orElseThrow();
        assertThat(updatedCoupon.getUsedCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Coupon Flow 2: Expired coupon is rejected during order creation and usedCount is NOT incremented")
    void testExpiredCouponRejected() {
        Coupon expiredCoupon = couponRepository.save(Coupon.builder()
                .code("EXPIRED10")
                .description("Expired Coupon")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00"))
                .minimumOrderAmount(BigDecimal.ZERO)
                .startDate(LocalDateTime.now().minusDays(20))
                .endDate(LocalDateTime.now().minusDays(1))
                .usageLimit(10)
                .usedCount(0)
                .active(true)
                .build());

        OrderRequest request = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .couponCode("EXPIRED10")
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .build();

        assertThatThrownBy(() -> orderService.createOrder(request, manager.getUsername()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired");

        Coupon unchangedCoupon = couponRepository.findById(expiredCoupon.getId()).orElseThrow();
        assertThat(unchangedCoupon.getUsedCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("Coupon Flow 3: Inactive coupon is rejected during order creation")
    void testInactiveCouponRejected() {
        Coupon inactiveCoupon = couponRepository.save(Coupon.builder()
                .code("INACTIVE50")
                .description("Inactive Coupon")
                .discountType(DiscountType.FLAT)
                .discountValue(new BigDecimal("50.00"))
                .minimumOrderAmount(BigDecimal.ZERO)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .usageLimit(10)
                .usedCount(0)
                .active(false)
                .build());

        OrderRequest request = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .couponCode("INACTIVE50")
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .build();

        assertThatThrownBy(() -> orderService.createOrder(request, manager.getUsername()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inactive");

        Coupon unchangedCoupon = couponRepository.findById(inactiveCoupon.getId()).orElseThrow();
        assertThat(unchangedCoupon.getUsedCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("Coupon Flow 4: Invalid coupon code is rejected")
    void testInvalidCouponCodeRejected() {
        OrderRequest request = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .couponCode("NON_EXISTENT_COUPON")
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .build();

        assertThatThrownBy(() -> orderService.createOrder(request, manager.getUsername()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Coupon not found");
    }

    @Test
    @DisplayName("Coupon Flow 5: Percentage discount with maximum discount cap")
    void testDiscountCalculationAndCap() {
        // 50% discount with max cap of ₹200
        couponRepository.save(Coupon.builder()
                .code("MAXCAP200")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("50.00"))
                .minimumOrderAmount(BigDecimal.ZERO)
                .maximumDiscount(new BigDecimal("200.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .usageLimit(10)
                .usedCount(0)
                .active(true)
                .build());

        OrderRequest request = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .couponCode("MAXCAP200")
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .build();

        OrderResponse response = orderService.createOrder(request, manager.getUsername());

        // Subtotal = ₹1,000. 50% = ₹500, but capped at max discount ₹200. Total = ₹800.
        assertThat(response.getSubtotal()).isEqualByComparingTo(new BigDecimal("1000.00"));
        assertThat(response.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("200.00"));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("800.00"));
    }

    @Test
    @DisplayName("Coupon Flow 6: Reaching maximum usage limit rejects subsequent order attempts")
    void testUsageLimitConcurrencyProtection() {
        Coupon limitedCoupon = couponRepository.save(Coupon.builder()
                .code("SINGLEUSE")
                .discountType(DiscountType.FLAT)
                .discountValue(new BigDecimal("100.00"))
                .minimumOrderAmount(BigDecimal.ZERO)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .usageLimit(1)
                .usedCount(0)
                .active(true)
                .build());

        OrderRequest req1 = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .couponCode("SINGLEUSE")
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .build();

        // First order consumes coupon successfully
        OrderResponse resp1 = orderService.createOrder(req1, manager.getUsername());
        assertThat(resp1.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("100.00"));

        Coupon usedCoupon = couponRepository.findById(limitedCoupon.getId()).orElseThrow();
        assertThat(usedCoupon.getUsedCount()).isEqualTo(1);

        // Second order must be rejected because usage limit of 1 is reached
        OrderRequest req2 = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .couponCode("SINGLEUSE")
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .build();

        assertThatThrownBy(() -> orderService.createOrder(req2, manager.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("usage limit has been reached");
    }
}
