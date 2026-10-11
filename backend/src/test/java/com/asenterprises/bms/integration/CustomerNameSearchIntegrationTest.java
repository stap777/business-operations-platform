package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.PaymentResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.Payment;
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
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.OrderService;
import com.asenterprises.bms.service.PaymentReportService;
import com.asenterprises.bms.service.PaymentService;
import com.asenterprises.bms.dto.PaymentReportResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CustomerNameSearchIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentReportService paymentReportService;

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
    private PaymentRepository paymentRepository;

    private User manager;
    private Customer aliceCustomer;
    private Customer bobCustomer;
    private Customer charlieCustomer;
    private Product product;

    private Order orderAlicePending;
    private Order orderAliceDelivered;
    private Order orderBobVerified;
    private Order orderCharlieOutstanding;

    private Payment paymentAliceCash;
    private Payment paymentAliceTransfer;
    private Payment paymentBobCheque;
    private Payment paymentCharlieCash;

    @BeforeEach
    void setUp() {
        manager = userRepository.save(User.builder()
                .fullName("Search Test Manager")
                .username("search_mgr_" + System.currentTimeMillis())
                .password("encoded_pass")
                .phoneNumber("9123400001")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        long suffix = System.currentTimeMillis() % 100000;
        aliceCustomer = customerRepository.save(Customer.builder()
                .customerCode("CST-" + suffix + "-A")
                .fullName("Alice Smith")
                .phoneNumber("9876543210")
                .address("101 Alice Street")
                .status(CustomerStatus.ACTIVE)
                .build());

        bobCustomer = customerRepository.save(Customer.builder()
                .customerCode("CST-" + suffix + "-B")
                .fullName("Bob Johnson")
                .phoneNumber("9876543211")
                .address("202 Bob Avenue")
                .status(CustomerStatus.ACTIVE)
                .build());

        charlieCustomer = customerRepository.save(Customer.builder()
                .customerCode("CST-" + suffix + "-C")
                .fullName("Charlie Brown")
                .phoneNumber("9876543212")
                .address("303 Charlie Boulevard")
                .status(CustomerStatus.ACTIVE)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Search Cat " + System.currentTimeMillis())
                .status(CategoryStatus.ACTIVE)
                .build());

        product = productRepository.save(Product.builder()
                .name("Search Test Widget")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("60.00"))
                .availableStock(50)
                .minimumStock(5)
                .status(ProductStatus.ACTIVE)
                .trackInventory(true)
                .build());

        // Order 1: Alice, CREATED, created 2 days ago
        orderAlicePending = Order.builder()
                .orderNumber("ORD-ALICE-1001")
                .customer(aliceCustomer)
                .manager(manager)
                .orderStatus(OrderStatus.CREATED)
                .paymentStatus(PaymentStatus.PENDING)
                .subtotal(new BigDecimal("100.00"))
                .totalAmount(new BigDecimal("100.00"))
                .amountReceived(BigDecimal.ZERO)
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();
        orderAlicePending.addItem(OrderItem.builder()
                .product(product)
                .quantity(1)
                .purchasePrice(new BigDecimal("60.00"))
                .sellingPrice(new BigDecimal("100.00"))
                .lineTotal(new BigDecimal("100.00"))
                .build());
        orderAlicePending = orderRepository.save(orderAlicePending);

        // Order 2: Alice, DELIVERED, created 1 day ago
        orderAliceDelivered = Order.builder()
                .orderNumber("ORD-ALICE-1002")
                .customer(aliceCustomer)
                .manager(manager)
                .orderStatus(OrderStatus.DELIVERED)
                .paymentStatus(PaymentStatus.PAID)
                .subtotal(new BigDecimal("200.00"))
                .totalAmount(new BigDecimal("200.00"))
                .amountReceived(new BigDecimal("200.00"))
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();
        orderAliceDelivered.addItem(OrderItem.builder()
                .product(product)
                .quantity(2)
                .purchasePrice(new BigDecimal("60.00"))
                .sellingPrice(new BigDecimal("100.00"))
                .lineTotal(new BigDecimal("200.00"))
                .build());
        orderAliceDelivered = orderRepository.save(orderAliceDelivered);

        // Order 3: Bob, VERIFIED, created today
        orderBobVerified = Order.builder()
                .orderNumber("ORD-BOB-2001")
                .customer(bobCustomer)
                .manager(manager)
                .orderStatus(OrderStatus.VERIFIED)
                .paymentStatus(PaymentStatus.PAID)
                .subtotal(new BigDecimal("300.00"))
                .totalAmount(new BigDecimal("300.00"))
                .amountReceived(new BigDecimal("300.00"))
                .createdAt(LocalDateTime.now())
                .build();
        orderBobVerified.addItem(OrderItem.builder()
                .product(product)
                .quantity(3)
                .purchasePrice(new BigDecimal("60.00"))
                .sellingPrice(new BigDecimal("100.00"))
                .lineTotal(new BigDecimal("300.00"))
                .build());
        orderBobVerified = orderRepository.save(orderBobVerified);

        // Order 4: Charlie, VERIFIED, outstanding balance (partial), created today
        orderCharlieOutstanding = Order.builder()
                .orderNumber("ORD-CHARLIE-3001")
                .customer(charlieCustomer)
                .manager(manager)
                .orderStatus(OrderStatus.VERIFIED)
                .paymentStatus(PaymentStatus.PARTIAL)
                .subtotal(new BigDecimal("400.00"))
                .totalAmount(new BigDecimal("400.00"))
                .amountReceived(new BigDecimal("100.00"))
                .createdAt(LocalDateTime.now())
                .build();
        orderCharlieOutstanding.addItem(OrderItem.builder()
                .product(product)
                .quantity(4)
                .purchasePrice(new BigDecimal("60.00"))
                .sellingPrice(new BigDecimal("100.00"))
                .lineTotal(new BigDecimal("400.00"))
                .build());
        orderCharlieOutstanding = orderRepository.save(orderCharlieOutstanding);

        // Payment 1: Alice, CASH, 2 days ago
        paymentAliceCash = Payment.builder()
                .paymentNumber("PAY-ALICE-01")
                .customer(aliceCustomer)
                .receivedBy(manager)
                .paymentDate(LocalDateTime.now().minusDays(2))
                .totalAmount(new BigDecimal("100.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build();
        paymentAliceCash.addAllocation(PaymentAllocation.builder()
                .order(orderAlicePending)
                .allocatedAmount(new BigDecimal("100.00"))
                .build());
        paymentAliceCash = paymentRepository.save(paymentAliceCash);

        // Payment 2: Alice, BANK_TRANSFER, 1 day ago
        paymentAliceTransfer = Payment.builder()
                .paymentNumber("PAY-ALICE-02")
                .customer(aliceCustomer)
                .receivedBy(manager)
                .paymentDate(LocalDateTime.now().minusDays(1))
                .totalAmount(new BigDecimal("50.00"))
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .build();
        paymentAliceTransfer.addAllocation(PaymentAllocation.builder()
                .order(orderAliceDelivered)
                .allocatedAmount(new BigDecimal("50.00"))
                .build());
        paymentAliceTransfer = paymentRepository.save(paymentAliceTransfer);

        // Payment 3: Bob, CHEQUE, today
        paymentBobCheque = Payment.builder()
                .paymentNumber("PAY-BOB-01")
                .customer(bobCustomer)
                .receivedBy(manager)
                .paymentDate(LocalDateTime.now())
                .totalAmount(new BigDecimal("200.00"))
                .paymentMethod(PaymentMethod.CHEQUE)
                .build();
        paymentBobCheque.addAllocation(PaymentAllocation.builder()
                .order(orderBobVerified)
                .allocatedAmount(new BigDecimal("200.00"))
                .build());
        paymentBobCheque = paymentRepository.save(paymentBobCheque);

        // Payment 4: Charlie, CASH, today
        paymentCharlieCash = Payment.builder()
                .paymentNumber("PAY-CHARLIE-01")
                .customer(charlieCustomer)
                .receivedBy(manager)
                .paymentDate(LocalDateTime.now())
                .totalAmount(new BigDecimal("100.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build();
        paymentCharlieCash.addAllocation(PaymentAllocation.builder()
                .order(orderCharlieOutstanding)
                .allocatedAmount(new BigDecimal("100.00"))
                .build());
        paymentCharlieCash = paymentRepository.save(paymentCharlieCash);
    }

    @Test
    @DisplayName("1. Searching by a partial customer name returns the correct orders")
    void testSearchOrdersByPartialCustomerName() {
        // Search by "Alice"
        Page<OrderResponse> resultAlice = orderService.searchOrders("Alice", null, null, null, null, PageRequest.of(0, 10));
        assertThat(resultAlice).isNotNull();
        assertThat(resultAlice.getContent()).hasSize(2);
        assertThat(resultAlice.getContent()).allMatch(o -> o.getCustomerName().equals("Alice Smith"));

        // Search by partial "lic"
        Page<OrderResponse> resultPartialLic = orderService.searchOrders("lic", null, null, null, null, PageRequest.of(0, 10));
        assertThat(resultPartialLic).isNotNull();
        assertThat(resultPartialLic.getContent()).hasSize(2);
        assertThat(resultPartialLic.getContent()).allMatch(o -> o.getCustomerName().equals("Alice Smith"));

        // Search by partial "John"
        Page<OrderResponse> resultJohn = orderService.searchOrders("John", null, null, null, null, PageRequest.of(0, 10));
        assertThat(resultJohn).isNotNull();
        assertThat(resultJohn.getContent()).hasSize(1);
        assertThat(resultJohn.getContent().get(0).getOrderNumber()).isEqualTo("ORD-BOB-2001");
        assertThat(resultJohn.getContent().get(0).getCustomerName()).isEqualTo("Bob Johnson");
    }

    @Test
    @DisplayName("2. Searching by a partial order number still works")
    void testSearchOrdersByPartialOrderNumber() {
        // Search exact order number
        Page<OrderResponse> resultExact = orderService.searchOrders("ORD-ALICE-1001", null, null, null, null, PageRequest.of(0, 10));
        assertThat(resultExact).isNotNull();
        assertThat(resultExact.getContent()).hasSize(1);
        assertThat(resultExact.getContent().get(0).getOrderNumber()).isEqualTo("ORD-ALICE-1001");

        // Search partial order number
        Page<OrderResponse> resultPartial = orderService.searchOrders("2001", null, null, null, null, PageRequest.of(0, 10));
        assertThat(resultPartial).isNotNull();
        assertThat(resultPartial.getContent()).hasSize(1);
        assertThat(resultPartial.getContent().get(0).getOrderNumber()).isEqualTo("ORD-BOB-2001");
    }

    @Test
    @DisplayName("3. Matching is case-insensitive for orders")
    void testSearchOrdersCaseInsensitive() {
        // Lowercase customer name
        Page<OrderResponse> lower = orderService.searchOrders("alice", null, null, null, null, PageRequest.of(0, 10));
        assertThat(lower.getContent()).hasSize(2);

        // Mixed case customer name
        Page<OrderResponse> mixed = orderService.searchOrders("aLiCe", null, null, null, null, PageRequest.of(0, 10));
        assertThat(mixed.getContent()).hasSize(2);

        // Uppercase customer name
        Page<OrderResponse> upper = orderService.searchOrders("ALICE", null, null, null, null, PageRequest.of(0, 10));
        assertThat(upper.getContent()).hasSize(2);

        // Lowercase order number
        Page<OrderResponse> orderLower = orderService.searchOrders("ord-bob-2001", null, null, null, null, PageRequest.of(0, 10));
        assertThat(orderLower.getContent()).hasSize(1);
        assertThat(orderLower.getContent().get(0).getOrderNumber()).isEqualTo("ORD-BOB-2001");
    }

    @Test
    @DisplayName("4. Payments outstanding-orders search finds a customer by name")
    void testPaymentsOutstandingOrdersSearchByCustomerName() {
        // Payments page queries /orders/search with orderNumber parameter to search outstanding orders
        Page<OrderResponse> charlieOrders = orderService.searchOrders("Charlie", null, null, null, null, PageRequest.of(0, 10));
        assertThat(charlieOrders).isNotNull();
        assertThat(charlieOrders.getContent()).hasSize(1);

        OrderResponse charlieOrder = charlieOrders.getContent().get(0);
        assertThat(charlieOrder.getOrderNumber()).isEqualTo("ORD-CHARLIE-3001");
        assertThat(charlieOrder.getCustomerName()).isEqualTo("Charlie Brown");
        assertThat(charlieOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);
        assertThat(charlieOrder.getTotalAmount().subtract(charlieOrder.getAmountReceived()))
                .isEqualByComparingTo(new BigDecimal("300.00"));

        // Case-insensitive partial customer search as performed by user in search box
        Page<OrderResponse> brownOrders = orderService.searchOrders("brown", null, null, null, null, PageRequest.of(0, 10));
        assertThat(brownOrders.getContent()).hasSize(1);
        assertThat(brownOrders.getContent().get(0).getOrderNumber()).isEqualTo("ORD-CHARLIE-3001");
    }

    @Test
    @DisplayName("5. Payment transaction-history search finds a customer by name and payment number")
    void testSearchPaymentsByCustomerNameAndPaymentNumber() {
        // Customer full name
        Page<PaymentResponse> resultAlice = paymentService.searchPayments("Alice", null, null, null, null, PageRequest.of(0, 10));
        assertThat(resultAlice).isNotNull();
        assertThat(resultAlice.getContent()).hasSize(2);
        assertThat(resultAlice.getContent()).allMatch(p -> p.getCustomerName().equals("Alice Smith"));

        // Partial customer name
        Page<PaymentResponse> resultPartial = paymentService.searchPayments("lic", null, null, null, null, PageRequest.of(0, 10));
        assertThat(resultPartial).isNotNull();
        assertThat(resultPartial.getContent()).hasSize(2);

        // Case-insensitive customer name
        Page<PaymentResponse> resultMixed = paymentService.searchPayments("aLiCe sMiTh", null, null, null, null, PageRequest.of(0, 10));
        assertThat(resultMixed).isNotNull();
        assertThat(resultMixed.getContent()).hasSize(2);

        // Another customer
        Page<PaymentResponse> resultBob = paymentService.searchPayments("johnson", null, null, null, null, PageRequest.of(0, 10));
        assertThat(resultBob).isNotNull();
        assertThat(resultBob.getContent()).hasSize(1);
        assertThat(resultBob.getContent().get(0).getPaymentNumber()).isEqualTo("PAY-BOB-01");

        // Search by payment number (exact)
        Page<PaymentResponse> resultPayExact = paymentService.searchPayments("PAY-ALICE-01", null, null, null, null, PageRequest.of(0, 10));
        assertThat(resultPayExact).isNotNull();
        assertThat(resultPayExact.getContent()).hasSize(1);
        assertThat(resultPayExact.getContent().get(0).getPaymentNumber()).isEqualTo("PAY-ALICE-01");

        // Search by payment number (partial and lowercase)
        Page<PaymentResponse> resultPayPartial = paymentService.searchPayments("pay-alice", null, null, null, null, PageRequest.of(0, 10));
        assertThat(resultPayPartial).isNotNull();
        assertThat(resultPayPartial.getContent()).hasSize(2);
    }

    @Test
    @DisplayName("6. Pagination totals match the returned filtered results for orders and payments")
    void testPaginationTotalsMatchFilteredResults() {
        // Order search with page size 1
        Page<OrderResponse> orderPage1 = orderService.searchOrders("Alice", null, null, null, null, PageRequest.of(0, 1));
        assertThat(orderPage1.getTotalElements()).isEqualTo(2);
        assertThat(orderPage1.getTotalPages()).isEqualTo(2);
        assertThat(orderPage1.getContent()).hasSize(1);
        assertThat(orderPage1.getNumber()).isEqualTo(0);

        Page<OrderResponse> orderPage2 = orderService.searchOrders("Alice", null, null, null, null, PageRequest.of(1, 1));
        assertThat(orderPage2.getTotalElements()).isEqualTo(2);
        assertThat(orderPage2.getContent()).hasSize(1);
        assertThat(orderPage2.getNumber()).isEqualTo(1);
        // Ensure the two pages return different orders
        assertThat(orderPage1.getContent().get(0).getId()).isNotEqualTo(orderPage2.getContent().get(0).getId());

        // Payment search with page size 1
        Page<PaymentResponse> payPage1 = paymentService.searchPayments("Alice", null, null, null, null, PageRequest.of(0, 1));
        assertThat(payPage1.getTotalElements()).isEqualTo(2);
        assertThat(payPage1.getTotalPages()).isEqualTo(2);
        assertThat(payPage1.getContent()).hasSize(1);

        Page<PaymentResponse> payPage2 = paymentService.searchPayments("Alice", null, null, null, null, PageRequest.of(1, 1));
        assertThat(payPage2.getTotalElements()).isEqualTo(2);
        assertThat(payPage2.getContent()).hasSize(1);
        assertThat(payPage1.getContent().get(0).getId()).isNotEqualTo(payPage2.getContent().get(0).getId());
    }

    @Test
    @DisplayName("7. Existing filters remain functional alongside customer search")
    void testExistingFiltersRemainFunctional() {
        // Order: Search "Alice" + Status DELIVERED -> returns only ORD-ALICE-1002 (skips PENDING)
        Page<OrderResponse> aliceDelivered = orderService.searchOrders("Alice", null, OrderStatus.DELIVERED, null, null, PageRequest.of(0, 10));
        assertThat(aliceDelivered.getContent()).hasSize(1);
        assertThat(aliceDelivered.getContent().get(0).getOrderNumber()).isEqualTo("ORD-ALICE-1002");

        // Order: Search "Alice" + CustomerId Alice -> returns 2
        Page<OrderResponse> aliceWithId = orderService.searchOrders("Alice", aliceCustomer.getId(), null, null, null, PageRequest.of(0, 10));
        assertThat(aliceWithId.getContent()).hasSize(2);

        // Order: Search "Alice" + CustomerId Bob -> returns 0
        Page<OrderResponse> aliceWithBobId = orderService.searchOrders("Alice", bobCustomer.getId(), null, null, null, PageRequest.of(0, 10));
        assertThat(aliceWithBobId.getContent()).isEmpty();

        // Order: Search "Alice" + Date filter (today matches Alice's orders, tomorrow matches 0)
        Page<OrderResponse> aliceToday = orderService.searchOrders(
                "Alice",
                null,
                null,
                LocalDate.now(),
                LocalDate.now(),
                PageRequest.of(0, 10)
        );
        assertThat(aliceToday.getContent()).hasSize(2);

        Page<OrderResponse> aliceTomorrow = orderService.searchOrders(
                "Alice",
                null,
                null,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(1),
                PageRequest.of(0, 10)
        );
        assertThat(aliceTomorrow.getContent()).isEmpty();

        // Order: Search "Alice" + open-ended endDate today -> matches Alice's orders
        Page<OrderResponse> aliceEndOnly = orderService.searchOrders(
                "Alice",
                null,
                null,
                null,
                LocalDate.now(),
                PageRequest.of(0, 10)
        );
        assertThat(aliceEndOnly.getContent()).hasSize(2);

        // Order: Search "Alice" + open-ended endDate yesterday -> returns 0
        Page<OrderResponse> aliceEndPast = orderService.searchOrders(
                "Alice",
                null,
                null,
                null,
                LocalDate.now().minusDays(1),
                PageRequest.of(0, 10)
        );
        assertThat(aliceEndPast.getContent()).isEmpty();

        // Order: Search "Alice" + inverted range (startDate > endDate normalized without error)
        Page<OrderResponse> aliceInverted = orderService.searchOrders(
                "Alice",
                null,
                null,
                LocalDate.now().plusDays(2),
                LocalDate.now().plusDays(1),
                PageRequest.of(0, 10)
        );
        assertThat(aliceInverted.getContent()).isEmpty();

        // PaymentReport: Open-ended endDate more than 30 days ago should not invert range or throw
        PaymentReportResponse pastReport = paymentReportService.getPaymentReport(null, LocalDate.now().minusDays(45), null);
        assertThat(pastReport).isNotNull();
        Page<PaymentResponse> aliceTransfer = paymentService.searchPayments(
                "Alice",
                null,
                PaymentMethod.BANK_TRANSFER,
                null,
                null,
                PageRequest.of(0, 10)
        );
        assertThat(aliceTransfer.getContent()).hasSize(1);
        assertThat(aliceTransfer.getContent().get(0).getPaymentNumber()).isEqualTo("PAY-ALICE-02");

        // Payment: Search "Alice" + CustomerId Bob -> returns 0
        Page<PaymentResponse> alicePayBobId = paymentService.searchPayments(
                "Alice",
                bobCustomer.getId(),
                null,
                null,
                null,
                PageRequest.of(0, 10)
        );
        assertThat(alicePayBobId.getContent()).isEmpty();

        // Payment: Search "Alice" + Date filter (2 days ago only)
        Page<PaymentResponse> alicePayDate = paymentService.searchPayments(
                "Alice",
                null,
                null,
                LocalDate.now().minusDays(2),
                LocalDate.now().minusDays(2),
                PageRequest.of(0, 10)
        );
        assertThat(alicePayDate.getContent()).hasSize(1);
        assertThat(alicePayDate.getContent().get(0).getPaymentNumber()).isEqualTo("PAY-ALICE-01");
    }
}
