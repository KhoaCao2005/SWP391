package model.dto;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author Admin
 */
public class ConfirmationDTO {
    private int confirmationId;
    private int userId;
    private int orderDetailId;
    private String agreement;
    private String date;

    public ConfirmationDTO() {
    }

    public ConfirmationDTO(int confirmationId, int userId, int orderDetailId, String agreement, String date) {
        this.confirmationId = confirmationId;
        this.userId = userId;
        this.orderDetailId = orderDetailId;
        this.agreement = agreement;
        this.date = date;
    }

    public int getConfirmationId() {
        return confirmationId;
    }

    public void setConfirmationId(int confirmationId) {
        this.confirmationId = confirmationId;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public int getOrderDetailId() {
        return orderDetailId;
    }

    public void setOrderDetailId(int orderDetailId) {
        this.orderDetailId = orderDetailId;
    }

    public String getAgreement() {
        return agreement;
    }

    public void setAgreement(String agreement) {
        this.agreement = agreement;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    
}
