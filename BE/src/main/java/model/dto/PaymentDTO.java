package model.dto;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author Admin
 */
public class PaymentDTO {
    private int paymentId;
    private int orderId;
    private String method;
    private double amount;
    private String paymentDate;
    private InstallmentPlanDTO installmentPlan;

    public PaymentDTO() {
    
    }

    public PaymentDTO(int orderId, String method, double amount, String paymentDate) {
        this.orderId = orderId;
        this.method = method;
        this.amount = amount;
        this.paymentDate = paymentDate;
    }
    

    public PaymentDTO(int paymentId, int orderId, String method, double amount, String paymentDate) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.method = method;
        this.amount = amount;
        this.paymentDate = paymentDate;
    }

    public int getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(int paymentId) {
        this.paymentId = paymentId;
    }

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(String paymentDate) {
        this.paymentDate = paymentDate;
    }

    public InstallmentPlanDTO getInstallmentPlan() {
        return installmentPlan;
    }

    public void setInstallmentPlan(InstallmentPlanDTO installmentPlan) {
        this.installmentPlan = installmentPlan;
    }
}
