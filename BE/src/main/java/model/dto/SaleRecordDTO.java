package model.dto;

import java.math.BigDecimal;

public class SaleRecordDTO {
    private int saleId;
    private int dealerStaffId;
    private String dealername;
    private String saleDate;
    private BigDecimal saleAmount;

    public SaleRecordDTO() {
    }

    public SaleRecordDTO(int saleId, int dealerStaffId, String dealername, String saleDate, BigDecimal saleAmount) {
        this.saleId = saleId;
        this.dealerStaffId = dealerStaffId;
        this.dealername = dealername;
        this.saleDate = saleDate;
        this.saleAmount = saleAmount;
    }

    public SaleRecordDTO(int saleId, int dealerStaffId, String saleDate, BigDecimal saleAmount) {
        this.saleId = saleId;
        this.dealerStaffId = dealerStaffId;
        this.saleDate = saleDate;
        this.saleAmount = saleAmount;
    }

    public String getDealername() {
        return dealername;
    }

    public void setDealername(String dealername) {
        this.dealername = dealername;
    }

    public int getSaleId() {
        return saleId;
    }

    public void setSaleId(int saleId) {
        this.saleId = saleId;
    }

    public int getDealerStaffId() {
        return dealerStaffId;
    }

    public void setDealerStaffId(int dealerStaffId) {
        this.dealerStaffId = dealerStaffId;
    }

    public String getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(String saleDate) {
        this.saleDate = saleDate;
    }

    public BigDecimal getSaleAmount() {
        return saleAmount;
    }

    public void setSaleAmount(BigDecimal saleAmount) {
        this.saleAmount = saleAmount;
    }
}
