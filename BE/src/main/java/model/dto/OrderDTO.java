package model.dto;

import java.util.List;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author Admin
 */
public class OrderDTO {
    private int orderId;
    private int customerId;
    private int dealerStaffId;
    private int modelId;
    private String orderDate;
    private String status;
    private OrderDetailDTO detail;
    private List<OrderDetailDTO> details;
    private ConfirmationDTO confirmation;
    private boolean isCustom;

    public OrderDTO() {
        
    }
    
    public OrderDTO(int orderId, int customerId, int dealerStaffId, int modelId, String orderDate, String status, List<OrderDetailDTO> details, ConfirmationDTO confirmation, boolean isCustom) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.dealerStaffId = dealerStaffId;
        this.modelId = modelId;
        this.orderDate = orderDate;
        this.status = status;
        this.details = details;
        this.confirmation = confirmation;
        this.isCustom = isCustom;
    }
    
    public OrderDTO(int orderId, int customerId, int dealerStaffId, int modelId, String orderDate, String status, List<OrderDetailDTO> details) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.dealerStaffId = dealerStaffId;
        this.modelId = modelId;
        this.orderDate = orderDate;
        this.status = status;
        this.details = details;
    }

    public OrderDTO(int orderId, int customerId, int dealerStaffId, int modelId, String orderDate, String status) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.dealerStaffId = dealerStaffId;
        this.modelId = modelId;
        this.orderDate = orderDate;
        this.status = status;
    }

    public OrderDTO(int customerId, int dealerStaffId, int modelId, String orderDate, String status) {
        this.customerId = customerId;
        this.dealerStaffId = dealerStaffId;
        this.modelId = modelId;
        this.orderDate = orderDate;
        this.status = status;
    }

    public int getDealerStaffId() {
        return dealerStaffId;
    }

    public void setDealerStaffId(int dealerStaffId) {
        this.dealerStaffId = dealerStaffId;
    }

    public OrderDetailDTO getDetail() {
        return detail;
    }

    public void setDetail(OrderDetailDTO detail) {
        this.detail = detail;
    }

    public List<OrderDetailDTO> getDetails() {
        return details;
    }

    public void setDetails(List<OrderDetailDTO> details) {
        this.details = details;
    }

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public int getModelId() {
        return modelId;
    }

    public void setModelId(int modelId) {
        this.modelId = modelId;
    }

    public String getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(String orderDate) {
        this.orderDate = orderDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public ConfirmationDTO getConfirmation() {
        return confirmation;
    }

    public void setConfirmation(ConfirmationDTO confirmation) {
        this.confirmation = confirmation;
    }

    public boolean isIsCustom() {
        return isCustom;
    }

    public void setIsCustom(boolean isCustom) {
        this.isCustom = isCustom;
    }
    
}
