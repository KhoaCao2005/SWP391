package model.dto;

public class InstallmentPlanDTO {
    private int planId;
    private int paymentId;
    private String interestRate;
    private String termMonth;
    private String monthlyPay;
    private String status;

    // Default constructor
    public InstallmentPlanDTO() {
    }

    // Constructor without planId (for creating new plans)
    public InstallmentPlanDTO(int paymentId, String interestRate, String termMonth, String monthlyPay, String status) {
        this.paymentId = paymentId;
        this.interestRate = interestRate;
        this.termMonth = termMonth;
        this.monthlyPay = monthlyPay;
        this.status = status;
    }

    // Constructor with planId (for existing plans)
    public InstallmentPlanDTO(int planId, int paymentId, String interestRate, String termMonth, String monthlyPay, String status) {
        this.planId = planId;
        this.paymentId = paymentId;
        this.interestRate = interestRate;
        this.termMonth = termMonth;
        this.monthlyPay = monthlyPay;
        this.status = status;
    }

    // Getters and setters
    public int getPlanId() {
        return planId;
    }

    public void setPlanId(int planId) {
        this.planId = planId;
    }

    public int getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(int paymentId) {
        this.paymentId = paymentId;
    }

    public String getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(String interestRate) {
        this.interestRate = interestRate;
    }

    public String getTermMonth() {
        return termMonth;
    }

    public void setTermMonth(String termMonth) {
        this.termMonth = termMonth;
    }

    public String getMonthlyPay() {
        return monthlyPay;
    }

    public void setMonthlyPay(String monthlyPay) {
        this.monthlyPay = monthlyPay;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
