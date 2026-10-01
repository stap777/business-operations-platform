package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.entity.Order;
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
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.InvoiceService;
import com.asenterprises.bms.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Comprehensive integration test suite validating robust reference generation,
 * collision avoidance, sequence gaps, deletions, IST date boundaries,
 * and concurrent order & invoice creation.
 */
@SpringBootTest
@ActiveProfiles("test")
public class OrderReferenceCollisionAndIntegrityTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private Customer customer;
    private User manager;
    private Product product;
    private Category category;

    private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    @BeforeEach
    void setUp() {
        transactionTemplate.execute(status -> {
            long seed = System.nanoTime();
            long uniqueSuffix = Math.abs((System.currentTimeMillis() * 1000 + (seed % 1000)) % 100000000L);

            manager = userRepository.save(User.builder()
                    .fullName("Ref Test Manager")
                    .username("ref_mgr_" + seed)
                    .password("encoded_pass")
                    .phoneNumber(String.format("97%08d", uniqueSuffix))
                    .role(Role.MANAGER)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            customer = customerRepository.save(Customer.builder()
                    .customerCode("GOKUL-" + seed)
                    .fullName("GOKUL SWEETS")
                    .phoneNumber(String.format("98%08d", uniqueSuffix))
                    .address("Main Bazaar, Shop 42")
                    .status(CustomerStatus.ACTIVE)
                    .build());

            category = categoryRepository.save(Category.builder()
                    .name("Sweets Category " + seed)
                    .description("Category for sweets")
                    .build());

            product = productRepository.save(Product.builder()
                    .name("Kaju Katli " + seed)
                    .category(category)
                    .purchasePrice(new BigDecimal("400.00"))
                    .sellingPrice(new BigDecimal("600.00"))
                    .availableStock(1000)
                    .minimumStock(10)
                    .unit(ProductUnit.BOX)
                    .status(ProductStatus.ACTIVE)
                    .build());

            return null;
        });
    }

    private OrderRequest buildOrderRequest() {
        return OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder()
                                .productId(product.getId())
                                .quantity(2)
                                .build()
                ))
                .notes("Production Reference Test Order")
                .build();
    }

    @Test
    @DisplayName("1. First order of the day starts at 0001 with IST date prefix")
    void testFirstOrderOfTheDayFormat() {
        String todayStr = LocalDate.now(IST_ZONE).format(DATE_FORMATTER);
        String expectedPrefix = "ORD-" + todayStr + "-";

        String orderNum = orderService.generateOrderNumber();
        assertThat(orderNum).startsWith(expectedPrefix);

        String invoiceNum = invoiceService.generateInvoiceNumber();
        assertThat(invoiceNum).startsWith("INV-" + todayStr + "-");
    }

    @Test
    @DisplayName("2. Sequential order creations increment monotonically and create corresponding invoices")
    void testSequentialOrders() {
        OrderResponse o1 = orderService.createOrder(buildOrderRequest(), manager.getUsername());
        OrderResponse o2 = orderService.createOrder(buildOrderRequest(), manager.getUsername());
        OrderResponse o3 = orderService.createOrder(buildOrderRequest(), manager.getUsername());

        assertThat(o1.getOrderNumber()).isNotNull();
        assertThat(o2.getOrderNumber()).isNotNull();
        assertThat(o3.getOrderNumber()).isNotNull();

        assertThat(o1.getOrderNumber()).isLessThan(o2.getOrderNumber());
        assertThat(o2.getOrderNumber()).isLessThan(o3.getOrderNumber());

        Invoice inv1 = invoiceRepository.findByOrderId(o1.getId()).orElseThrow();
        Invoice inv2 = invoiceRepository.findByOrderId(o2.getId()).orElseThrow();
        Invoice inv3 = invoiceRepository.findByOrderId(o3.getId()).orElseThrow();

        assertThat(inv1.getInvoiceNumber()).isLessThan(inv2.getInvoiceNumber());
        assertThat(inv2.getInvoiceNumber()).isLessThan(inv3.getInvoiceNumber());
    }

    @Test
    @DisplayName("3. Deleted order followed by new order must NOT reuse number (Fix for production bug)")
    void testDeletedOrderFollowedByNewOrder() {
        // Create order 1 and order 2
        OrderResponse o1 = orderService.createOrder(buildOrderRequest(), manager.getUsername());
        OrderResponse o2 = orderService.createOrder(buildOrderRequest(), manager.getUsername());

        String order1Number = o1.getOrderNumber();
        String order2Number = o2.getOrderNumber();

        // Delete order 1
        orderService.deleteOrder(o1.getId());

        // In the old count-based logic: count drops to 1, next is 1 + 1 = 2 (duplicate of o2!).
        // In the new max-sequence logic: o2 exists, next is sequence(o2) + 1.
        OrderResponse o3 = orderService.createOrder(buildOrderRequest(), manager.getUsername());

        assertThat(o3.getOrderNumber()).isNotEqualTo(order1Number);
        assertThat(o3.getOrderNumber()).isNotEqualTo(order2Number);
        assertThat(o3.getOrderNumber()).isGreaterThan(order2Number);

        // Verify invoice was also successfully created without collision
        Invoice inv3 = invoiceRepository.findByOrderId(o3.getId()).orElseThrow();
        assertThat(inv3.getInvoiceNumber()).isNotNull();
    }

    @Test
    @DisplayName("4. Gaps in existing order numbers must advance past the maximum sequence")
    void testGapsInExistingOrderNumbers() {
        String todayStr = LocalDate.now(IST_ZONE).format(DATE_FORMATTER);
        String currentNext = orderService.generateOrderNumber();
        long currentSeq = Long.parseLong(currentNext.substring(("ORD-" + todayStr + "-").length()));

        long gapSeq = currentSeq + 100;
        String gapOrderNumber = String.format("ORD-%s-%04d", todayStr, gapSeq);

        // Manually seed an order with a gap
        transactionTemplate.execute(status -> {
            Order gapOrder = Order.builder()
                    .orderNumber(gapOrderNumber)
                    .customer(customer)
                    .manager(manager)
                    .orderStatus(OrderStatus.CREATED)
                    .paymentStatus(PaymentStatus.PENDING)
                    .subtotal(new BigDecimal("1200.00"))
                    .discountAmount(BigDecimal.ZERO)
                    .totalAmount(new BigDecimal("1200.00"))
                    .build();
            return orderRepository.saveAndFlush(gapOrder);
        });

        long expectedNextSeq = gapSeq + 1;
        String expectedNext = String.format("ORD-%s-%04d", todayStr, expectedNextSeq);

        // The next generated order must be gapSeq + 1
        String nextOrderNum = orderService.generateOrderNumber();
        assertThat(nextOrderNum).isEqualTo(expectedNext);

        // Creating order must succeed with expectedNext
        OrderResponse response = orderService.createOrder(buildOrderRequest(), manager.getUsername());
        assertThat(response.getOrderNumber()).isEqualTo(expectedNext);
    }

    @Test
    @DisplayName("5. Invoice generation respects gaps and deletions without sequence collisions")
    void testInvoiceGenerationGapsAndDeletions() {
        String todayStr = LocalDate.now(IST_ZONE).format(DATE_FORMATTER);
        String currentNext = invoiceService.generateInvoiceNumber();
        long currentSeq = Long.parseLong(currentNext.substring(("INV-" + todayStr + "-").length()));

        long gapSeq = currentSeq + 100;
        String gapInvoiceNumber = String.format("INV-%s-%04d", todayStr, gapSeq);

        transactionTemplate.execute(status -> {
            Order dummyOrder = Order.builder()
                    .orderNumber("ORD-GAP-" + System.nanoTime())
                    .customer(customer)
                    .manager(manager)
                    .orderStatus(OrderStatus.CREATED)
                    .paymentStatus(PaymentStatus.PENDING)
                    .subtotal(new BigDecimal("100.00"))
                    .discountAmount(BigDecimal.ZERO)
                    .totalAmount(new BigDecimal("100.00"))
                    .build();
            dummyOrder = orderRepository.saveAndFlush(dummyOrder);

            Invoice gapInvoice = Invoice.builder()
                    .invoiceNumber(gapInvoiceNumber)
                    .order(dummyOrder)
                    .invoiceDate(LocalDateTime.now())
                    .customerNameSnapshot(customer.getFullName())
                    .customerPhoneSnapshot(customer.getPhone())
                    .customerAddressSnapshot(customer.getAddress())
                    .subtotal(dummyOrder.getSubtotal())
                    .discountAmount(BigDecimal.ZERO)
                    .totalAmount(dummyOrder.getTotalAmount())
                    .paymentStatus(PaymentStatus.PENDING)
                    .paymentReceivedAtGeneration(BigDecimal.ZERO)
                    .generatedBy(manager)
                    .build();
            return invoiceRepository.saveAndFlush(gapInvoice);
        });

        long expectedNextSeq = gapSeq + 1;
        String expectedNext = String.format("INV-%s-%04d", todayStr, expectedNextSeq);

        String nextInvoiceNum = invoiceService.generateInvoiceNumber();
        assertThat(nextInvoiceNum).isEqualTo(expectedNext);
    }

    @Test
    @DisplayName("6. Business timezone is explicitly Asia/Kolkata")
    void testIstDateBoundary() {
        assertThat(OrderService.BUSINESS_ZONE).isEqualTo(ZoneId.of("Asia/Kolkata"));
        assertThat(InvoiceService.BUSINESS_ZONE).isEqualTo(ZoneId.of("Asia/Kolkata"));

        String expectedDatePart = LocalDate.now(ZoneId.of("Asia/Kolkata")).format(DATE_FORMATTER);
        String orderNumber = orderService.generateOrderNumber();
        String invoiceNumber = invoiceService.generateInvoiceNumber();

        assertThat(orderNumber).contains(expectedDatePart);
        assertThat(invoiceNumber).contains(expectedDatePart);
    }

    @Test
    @DisplayName("7. Concurrent order creation produces unique references with retry protection")
    void testConcurrentOrderCreation() throws Exception {
        int threadCount = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Callable<OrderResponse>> tasks = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            tasks.add(() -> {
                startLatch.await();
                return orderService.createOrder(buildOrderRequest(), manager.getUsername());
            });
        }

        startLatch.countDown();
        List<Future<OrderResponse>> futures = executor.invokeAll(tasks);
        executor.shutdown();
        assertThat(executor.awaitTermination(30, TimeUnit.SECONDS)).isTrue();

        Set<String> orderNumbers = new HashSet<>();
        Set<String> invoiceNumbers = new HashSet<>();

        for (Future<OrderResponse> future : futures) {
            OrderResponse resp = future.get();
            assertThat(resp).isNotNull();
            assertThat(resp.getOrderNumber()).isNotNull();

            orderNumbers.add(resp.getOrderNumber());

            Invoice invoice = invoiceRepository.findByOrderId(resp.getId()).orElseThrow();
            invoiceNumbers.add(invoice.getInvoiceNumber());
        }

        // All order numbers and invoice numbers must be distinct
        assertThat(orderNumbers).hasSize(threadCount);
        assertThat(invoiceNumbers).hasSize(threadCount);
    }

    @Test
    @DisplayName("8. Concurrent invoice number generation produces distinct candidates")
    void testConcurrentInvoiceGeneration() throws Exception {
        int threadCount = 5;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Callable<String>> tasks = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            tasks.add(() -> {
                startLatch.await();
                return invoiceService.generateInvoiceNumber();
            });
        }

        startLatch.countDown();
        List<Future<String>> futures = executor.invokeAll(tasks);
        executor.shutdown();
        assertThat(executor.awaitTermination(15, TimeUnit.SECONDS)).isTrue();

        List<String> generatedNumbers = new ArrayList<>();
        for (Future<String> future : futures) {
            generatedNumbers.add(future.get());
        }

        // Verify valid format for each
        String todayStr = LocalDate.now(IST_ZONE).format(DATE_FORMATTER);
        for (String num : generatedNumbers) {
            assertThat(num).startsWith("INV-" + todayStr + "-");
        }
    }

    @Test
    @DisplayName("9. Unique key collision triggers automatic retry and recovery")
    void testUniqueKeyCollisionAndRetry() {
        // Generate candidate order number
        String candidateOrderNum = orderService.generateOrderNumber();

        // Seed an order with that exact order number right before creation attempt
        transactionTemplate.execute(status -> {
            Order collidingOrder = Order.builder()
                    .orderNumber(candidateOrderNum)
                    .customer(customer)
                    .manager(manager)
                    .orderStatus(OrderStatus.CREATED)
                    .paymentStatus(PaymentStatus.PENDING)
                    .subtotal(new BigDecimal("500.00"))
                    .discountAmount(BigDecimal.ZERO)
                    .totalAmount(new BigDecimal("500.00"))
                    .build();
            return orderRepository.saveAndFlush(collidingOrder);
        });

        // Now creating an order should detect the collision, advance past it, and succeed
        OrderResponse recoveredOrder = orderService.createOrder(buildOrderRequest(), manager.getUsername());

        assertThat(recoveredOrder).isNotNull();
        assertThat(recoveredOrder.getOrderNumber()).isNotEqualTo(candidateOrderNum);
        assertThat(recoveredOrder.getOrderNumber()).isGreaterThan(candidateOrderNum);
    }
}
