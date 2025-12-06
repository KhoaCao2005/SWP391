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
public class DealerDTO {
    private int dealerId;
    private String dealerName;
    private String address;
    private String phoneNumber;
    private List<PromotionDTO> promotion;
   
    public DealerDTO() {
    }

    public List<PromotionDTO> getPromotion() {
        return promotion;
    }

       public DealerDTO setPromotion(List<PromotionDTO> promotion) {
        this.promotion = promotion;
        return this;
    }

    public DealerDTO(int dealerId, String dealerName, String address, String phoneNumber, List<PromotionDTO> promotion) {
        this.dealerId = dealerId;
        this.dealerName = dealerName;
        this.address = address;
        this.phoneNumber = phoneNumber;
        this.promotion = promotion;
    }

    public DealerDTO(int dealerId, String dealerName, String address, String phoneNumber) {
        this.dealerId = dealerId;
        this.dealerName = dealerName;
        this.address = address;
        this.phoneNumber = phoneNumber;
    }

    public int getDealerId() {
        return dealerId;
    }

    public void setDealerId(int dealerId) {
        this.dealerId = dealerId;
    }

    public String getDealerName() {
        return dealerName;
    }

    public void setDealerName(String dealerName) {
        this.dealerName = dealerName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
}
