package model.dto;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author Admin
 */
public class VehicleVariantDTO {
    private int variantId;
    private int modelId;
    private String versionName;
    private String color;
    private String image;
    private double price;
    private boolean isActive;

    public VehicleVariantDTO() {
    }

    public VehicleVariantDTO(int variantId, int modelId, String versionName, String color, String image, double price, boolean isActive) {
        this.variantId = variantId;
        this.modelId = modelId;
        this.versionName = versionName;
        this.color = color;
        this.image = image;
        this.price = price;
        this.isActive = isActive;
    }

    public int getVariantId() {
        return variantId;
    }

    public void setVariantId(int variantId) {
        this.variantId = variantId;
    }

    public int getModelId() {
        return modelId;
    }

    public void setModelId(int modelId) {
        this.modelId = modelId;
    }

    public String getVersionName() {
        return versionName;
    }

    public void setVersionName(String versionName) {
        this.versionName = versionName;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public boolean isIsActive() {
        return isActive;
    }

    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
    }
}
