/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.service;

import java.util.List;
import model.dao.VehicleModelDAO;
import model.dto.VehicleModelDTO;

/**
 *
 * @author Admin
 */
public class VehicleModelService {
    private final VehicleModelDAO vehicleModelDAO = new VehicleModelDAO();

    public VehicleModelDTO createVehicleModel(String modelName, String description) {
        // Validate input
        if (modelName == null || modelName.trim().isEmpty()) {
            System.err.println("Model name cannot be empty");
            return null;
        }
        
        if (description == null || description.trim().isEmpty()) {
            System.err.println("Description cannot be empty");
            return null;
        }
        
        // Check if model name already exists
        if (isModelNameExists(modelName.trim())) {
            System.err.println("Vehicle model with name '" + modelName + "' already exists");
            return null;
        }
        
        // Create the vehicle model
        VehicleModelDTO result = vehicleModelDAO.create(modelName.trim(), description.trim());
        
        if (result != null) {
            System.out.println("Vehicle model created successfully with ID: " + result.getModelId());
        } else {
            System.err.println("Failed to create vehicle model");
        }
        
        return result;
    }
    
    public boolean updateVehicleModel(int modelId, String modelName, String description) {
        // Validate input
        if (modelId <= 0) {
            System.err.println("Invalid model ID");
            return false;
        }
        
        if (modelName == null || modelName.trim().isEmpty()) {
            System.err.println("Model name cannot be empty");
            return false;
        }
        
        if (description == null || description.trim().isEmpty()) {
            System.err.println("Description cannot be empty");
            return false;
        }
        
        // Check if vehicle model exists
        if (!isModelIdExists(modelId)) {
            System.err.println("Vehicle model with ID " + modelId + " does not exist");
            return false;
        }
        
        // Check if new model name already exists (excluding current model)
        if (isModelNameExistsExcludingId(modelName.trim(), modelId)) {
            System.err.println("Another vehicle model with name '" + modelName + "' already exists");
            return false;
        }
        
        // Update the vehicle model
        boolean result = vehicleModelDAO.update(modelId, modelName.trim(), description.trim());
        
        if (result) {
            System.out.println("Vehicle model updated successfully");
        } else {
            System.err.println("Failed to update vehicle model");
        }
        
        return result;
    }
    
    public boolean disableVehicleModel(int modelId) {
        // Validate input
        if (modelId <= 0) {
            System.err.println("Invalid model ID");
            return false;
        }
        
        // Check if vehicle model exists
        if (!isModelIdExists(modelId)) {
            System.err.println("Vehicle model with ID " + modelId + " does not exist");
            return false;
        }
        
        // Check if already disabled
        VehicleModelDTO model = getVehicleModelById(modelId);
        if (model != null && !model.isIsActive()) {
            System.err.println("Vehicle model is already disabled");
            return false;
        }
        
        // Disable the vehicle model
        boolean result = vehicleModelDAO.disable(modelId);
        
        if (result) {
            System.out.println("Vehicle model disabled successfully");
        } else {
            System.err.println("Failed to disable vehicle model");
        }
        
        return result;
    }
    
    public boolean enableVehicleModel(int modelId) {
        // Validate input
        if (modelId <= 0) {
            System.err.println("Invalid model ID");
            return false;
        }
        
        // Check if vehicle model exists
        if (!isModelIdExists(modelId)) {
            System.err.println("Vehicle model with ID " + modelId + " does not exist");
            return false;
        }
        
        // Check if already enabled
        VehicleModelDTO model = getVehicleModelById(modelId);
        if (model != null && model.isIsActive()) {
            System.err.println("Vehicle model is already enabled");
            return false;
        }
        
        // Enable the vehicle model
        boolean result = vehicleModelDAO.enable(modelId);
        
        if (result) {
            System.out.println("Vehicle model enabled successfully");
        } else {
            System.err.println("Failed to enable vehicle model");
        }
        
        return result;
    }
    
    // Helper methods
    
    private boolean isModelNameExists(String modelName) {
        List<VehicleModelDTO> models = vehicleModelDAO.SearchVehicleModel(modelName);
        return models != null && !models.isEmpty();
    }
    
    private boolean isModelIdExists(int modelId) {
        List<VehicleModelDTO> models = vehicleModelDAO.viewVehicleModelById(modelId);
        return models != null && !models.isEmpty();
    }
    
    private boolean isModelNameExistsExcludingId(String modelName, int excludeModelId) {
        List<VehicleModelDTO> models = vehicleModelDAO.SearchVehicleModel(modelName);
        if (models == null || models.isEmpty()) {
            return false;
        }
        
        // Check if any model with this name has a different ID
        return models.stream().anyMatch(m -> m.getModelId() != excludeModelId);
    }
    
    private VehicleModelDTO getVehicleModelById(int modelId) {
        List<VehicleModelDTO> models = vehicleModelDAO.viewVehicleModelById(modelId);
        if (models != null && !models.isEmpty()) {
            return models.get(0);
        }
        return null;
    }
}
