/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.dto;

import java.util.List;

/**
 *
 * @author Admin
 */
public class VehicleModelDTO {

    private int modelId;
    private String modelName;
    private String description;
    private boolean isActive;
    private List<VehicleVariantDTO> lists;
    private List<InventoryDTO> inventoryList;

    public VehicleModelDTO(int modelId, String modelName, String description, boolean isActive, List<VehicleVariantDTO> lists) {
        this.modelId = modelId;
        this.modelName = modelName;
        this.description = description;
        this.isActive = isActive;
        this.lists = lists;
    }

    public List<InventoryDTO> getInventoryList() {
        return inventoryList;
    }

    public void setInventoryList(List<InventoryDTO> inventoryList) {
        this.inventoryList = inventoryList;
    }

    public List<VehicleVariantDTO> getLists() {
        return lists;
    }

    public void setLists(List<VehicleVariantDTO> lists) {
        this.lists = lists;
    }

    public VehicleModelDTO() {
    }

    public VehicleModelDTO(int modelId, String modelName, String description, boolean isActive) {
        this.modelId = modelId;
        this.modelName = modelName;
        this.description = description;
        this.isActive = isActive;
    }

    public int getModelId() {
        return modelId;
    }

    public void setModelId(int modelId) {
        this.modelId = modelId;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isIsActive() {
        return isActive;
    }

    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
    }
}
