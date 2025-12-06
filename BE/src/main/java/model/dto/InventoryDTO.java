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
public class InventoryDTO {
    private int inventoryId;
    private int modelId;
    private String quantity;
    private List<VehicleModelDTO> list;
    public InventoryDTO() {
    }

    public InventoryDTO(int inventoryId, int modelId, String quantity, List<VehicleModelDTO> list) {
        this.inventoryId = inventoryId;
        this.modelId = modelId;
        this.quantity = quantity;
        this.list = list;
    }

    public InventoryDTO(int inventoryId, int modelId, String quantity) {
        this.inventoryId = inventoryId;
        this.modelId = modelId;
        this.quantity = quantity;
    }

    public List<VehicleModelDTO> getList() {
        return list;
    }

    public void setList(List<VehicleModelDTO> list) {
        this.list = list;
    }

    public int getInventoryId() {
        return inventoryId;
    }

    public void setInventoryId(int inventoryId) {
        this.inventoryId = inventoryId;
    }

    public int getModelId() {
        return modelId;
    }

    public void setModelId(int modelId) {
        this.modelId = modelId;
    }

    public String getQuantity() {
        return quantity;
    }

    public void setQuantity(String quantity) {
        this.quantity = quantity;
    }
}
