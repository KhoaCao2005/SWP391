package model.dto;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author Admin
 */
public class TestDriveScheduleDTO {
    private int appointmentId;
    private int customerId;
    private String serialId;
    private String date;
    private String status;

    public TestDriveScheduleDTO() {
    }

    public TestDriveScheduleDTO(int appointmentId, int customerId, String serialId, String date, String status) {
        this.appointmentId = appointmentId;
        this.customerId = customerId;
        this.serialId = serialId;
        this.date = date;
        this.status = status;
    }

   

    public int getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(int appointmentId) {
        this.appointmentId = appointmentId;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public String getSerialId() {
        return serialId;
    }

    public void setSerialId(String serialId) {
        this.serialId = serialId;
    }

    

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
