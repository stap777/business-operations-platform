package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchSheetOrderDto {
    private Long orderId;
    private String orderNumber;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private String orderStatus;
    private String deliveryStatus;
    private String paymentMethod;
    private String notes;
    private List<DispatchSheetProductDto> products;
}
