/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.service;

import java.util.ArrayList;
import java.util.List;
import model.dao.InventoryDAO;
import model.dao.VehicleModelDAO;
import model.dto.InventoryDTO;
import model.dto.VehicleModelDTO;

/**
 *
 * @author khoac
 */
public class ViewInventoryService {

    private VehicleModelDAO modelDAO = new VehicleModelDAO();
    private InventoryDAO inventoryDAO = new InventoryDAO();

    public List<InventoryDTO> handleViewActiveInventory() {
        List<InventoryDTO> inventories = inventoryDAO.viewAllInventory();
        List<InventoryDTO> activeInventories = new ArrayList<>();

        if (inventories != null) {
            for (InventoryDTO inventory : inventories) {
                List<VehicleModelDTO> modelList = modelDAO.viewVehicleModelById(inventory.getModelId());

                if (modelList != null && !modelList.isEmpty()) {
                    VehicleModelDTO model = modelList.get(0);

                    if (model.isIsActive()) {
                        int availableCount = inventoryDAO.getAvailableSerialCountByModelId(inventory.getModelId());
                        inventory.setQuantity(String.valueOf(availableCount));

                        inventory.setList(modelList);
                        activeInventories.add(inventory);
                    }
                }
            }
        }

        return activeInventories;
    }

    public List<VehicleModelDTO> getInventoryByModelName(String name) {
        List<VehicleModelDTO> models = modelDAO.SearchVehicleModel(name);
        if (models == null || models.isEmpty()) {
            return new ArrayList<>();
        }
        for (VehicleModelDTO tmp : models) {
            int modelId = tmp.getModelId();
            List<InventoryDTO> inventory = inventoryDAO.getInventoryByModelId(modelId);
            if (inventory != null) {
                tmp.setInventoryList(inventory);
            }
        }
        return models;
    }
}
