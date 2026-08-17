package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.BusinessSettingsRequest;
import com.asenterprises.bms.dto.CouponRequest;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.Coupon;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.DiscountType;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.StockAdjustment;
import com.asenterprises.bms.entity.StockAdjustmentType;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CouponRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.StockAdjustmentRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.repository.UserSessionRepository;
import com.asenterprises.bms.service.BusinessSettingsService;
import com.asenterprises.bms.service.DeliveryService;
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

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class VerificationWorkflowIntegrationTest {

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
    private InvoiceRepository invoiceRepository;

    @Autowired
    private StockAdjustmentRepository stockAdjustmentRepository;

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private BusinessSettingsService businessSettingsService;

    private User adminUser;
    private User managerUser;
    private User deliveryUser;
    private Customer customer;
    private Product product;
    private Coupon coupon;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private com.asenterprises.bms.repository.PasswordResetTokenRepository passwordResetTokenRepository;

    @BeforeEach
    void setUp() {
        passwordResetTokenRepository.deleteAll();
        userSessionRepository.deleteAll();
        invoiceRepository.deleteAll();
        orderRepository.deleteAll();
        customerRepository.deleteAll();
        productRepository.deleteAll();
        couponRepository.deleteAll();
        stockAdjustmentRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(User.builder()
                .fullName("System Admin")
                .username("vw_admin_test")
                .password("encoded_pass")
                .phoneNumber("9876543290")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        managerUser = userRepository.save(User.builder()
                .fullName("Branch Manager")
                .username("vw_manager_test")
                .password("encoded_pass")
                .phoneNumber("9876543291")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        deliveryUser = userRepository.save(User.builder()
                .fullName("Delivery Agent")
                .username("vw_delivery_test")
                .password("encoded_pass")
                .phoneNumber("9876543292")
                .role(Role.DELIVERY)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-ENT-001")
                .fullName("Enterprise Client Corp")
                .phoneNumber("9988776655")
                .address("789 Commercial Blvd, Sector 4")
                .status(CustomerStatus.ACTIVE)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Industrial Hardware")
                .description("Heavy machinery components")
                .status(com.asenterprises.bms.entity.CategoryStatus.ACTIVE)
                .build());

        product = productRepository.save(Product.builder()
                .name("Steel Bearing Assembly")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("150.00"))
                .purchasePrice(new BigDecimal("100.00"))
                .availableStock(50)
                .minimumStock(10)
                .status(ProductStatus.ACTIVE)
                .build());

        coupon = couponRepository.save(Coupon.builder()
                .code("WELCOME2026")
                .description("Special launch discount")
                .discountType(DiscountType.FLAT)
                .discountValue(new BigDecimal("50.00"))
                .minimumOrderAmount(new BigDecimal("200.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(30))
                .usageLimit(100)
                .usedCount(0)
                .active(true)
                .build());

        businessSettingsService.updateBusinessSettings(BusinessSettingsRequest.builder()
                .businessName("A.S. Enterprises Corp")
                .phone("+91-1122334455")
                .address("Headquarters, Industrial Hub")
                .invoicePrefix("INV-ASE")
                .currency("INR")
                .invoiceFooter("Thank you for your valued business.")
                .build());
    }

    @Test
    @DisplayName("Complete E2E Business Workflow: Order Creation -> Delivery -> Admin Verification -> Invoice Snapshots")
    void testCompleteVerificationWorkflow() {
        // Step 1: Create Order
        Order order = Order.builder()
                .orderNumber("ORD-20260806-0001")
                .customer(customer)
                .manager(managerUser)
                .deliveryPerson(deliveryUser)
                .orderStatus(OrderStatus.ASSIGNED)
                .paymentStatus(PaymentStatus.PENDING)
                .deliveryStatus(DeliveryStatus.PENDING)
                .subtotal(new BigDecimal("300.00"))
                .discountAmount(new BigDecimal("50.00"))
                .totalAmount(new BigDecimal("250.00"))
                .coupon(coupon)
                .build();

        OrderItem item = OrderItem.builder()
                .product(product)
                .quantity(2)
                .sellingPrice(new BigDecimal("150.00"))
                .lineTotal(new BigDecimal("300.00"))
                .build();
        order.addItem(item);

        Order savedOrder = orderRepository.save(order);
        if (savedOrder.getCoupon() != null) {
            couponRepository.incrementUsedCount(savedOrder.getCoupon().getId());
        }
        assertThat(savedOrder.getId()).isNotNull();

        // Step 2: Transition Delivery to DELIVERED
        deliveryService.startDelivery(savedOrder.getId(), deliveryUser.getUsername());
        deliveryService.markDelivered(savedOrder.getId(), com.asenterprises.bms.dto.DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("250.00"))
                .paymentMethod(com.asenterprises.bms.entity.PaymentMethod.CASH)
                .build(), deliveryUser.getUsername());

        Order deliveredOrder = orderRepository.findById(savedOrder.getId()).orElseThrow();
        assertThat(deliveredOrder.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(deliveredOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);

        // Step 3: Admin Verifies Order
        InvoiceResponse invoiceResponse = verificationService.verifyOrder(savedOrder.getId(), adminUser.getUsername());

        // Step 4: Verify Assertions
        assertThat(invoiceResponse).isNotNull();
        assertThat(invoiceResponse.getInvoiceNumber()).startsWith("INV-");
        assertThat(invoiceResponse.getCustomerNameSnapshot()).isEqualTo("Enterprise Client Corp");
        assertThat(invoiceResponse.getCustomerPhoneSnapshot()).isEqualTo("9988776655");
        assertThat(invoiceResponse.getCustomerAddressSnapshot()).isEqualTo("789 Commercial Blvd, Sector 4");
        assertThat(invoiceResponse.getTotalAmount()).isEqualByComparingTo("250.00");
        assertThat(invoiceResponse.getItems()).hasSize(1);
        assertThat(invoiceResponse.getItems().get(0).getProductNameSnapshot()).isEqualTo("Steel Bearing Assembly");
        assertThat(invoiceResponse.getItems().get(0).getQuantity()).isEqualTo(2);

        // Step 5: Verify Database State Changes
        Order verifiedOrder = orderRepository.findById(savedOrder.getId()).orElseThrow();
        assertThat(verifiedOrder.getOrderStatus()).isEqualTo(OrderStatus.VERIFIED);

        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProduct.getAvailableStock()).isEqualTo(48); // 50 - 2

        Coupon updatedCoupon = couponRepository.findById(coupon.getId()).orElseThrow();
        assertThat(updatedCoupon.getUsedCount()).isEqualTo(1);

        Invoice invoiceInDb = invoiceRepository.findByOrderId(savedOrder.getId()).orElseThrow();
        assertThat(invoiceInDb.getInvoiceNumber()).isEqualTo(invoiceResponse.getInvoiceNumber());

        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(product.getId());
        assertThat(adjustments).hasSize(1);
        assertThat(adjustments.get(0).getAdjustmentType()).isEqualTo(StockAdjustmentType.OUT);
        assertThat(adjustments.get(0).getQuantity()).isEqualTo(2);
        assertThat(adjustments.get(0).getReason()).isEqualTo("ORDER_FULFILLMENT");
    }
}
