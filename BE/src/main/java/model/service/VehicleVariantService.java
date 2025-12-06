/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.service;

import java.util.List;
import model.dao.VehicleModelDAO;
import model.dao.VehicleVariantDAO;
import model.dto.VehicleModelDTO;
import model.dto.VehicleVariantDTO;

/**
 *
 * @author Admin
 */
public class VehicleVariantService {
    private final VehicleVariantDAO vehicleVariantDAO = new VehicleVariantDAO();
    private final VehicleModelDAO vehicleModelDAO = new VehicleModelDAO();
    
    public VehicleVariantDTO createVehicleVariant(int modelId, String versionName, String color, String image, double price) {
        // Validate input
        if (modelId <= 0) {
            System.err.println("Invalid model ID");
            return null;
        }
        
        if (versionName == null || versionName.trim().isEmpty()) {
            System.err.println("Version name cannot be empty");
            return null;
        }
        
        if (color == null || color.trim().isEmpty()) {
            System.err.println("Color cannot be empty");
            return null;
        }
        
        if (price < 0) {
            System.err.println("Price cannot be negative");
            return null;
        }
        
        // Check if vehicle model exists and is active
        List<VehicleModelDTO> models = vehicleModelDAO.viewVehicleModelById(modelId);
        if (models == null || models.isEmpty()) {
            System.err.println("Vehicle model with ID " + modelId + " does not exist");
            return null;
        }
        
        VehicleModelDTO model = models.get(0);
        if (!model.isIsActive()) {
            System.err.println("Vehicle model with ID " + modelId + " is not active");
            return null;
        }
        
        // Check if variant with same version name and color already exists for this model
        if (isVariantExists(modelId, versionName.trim(), color.trim())) {
            System.err.println("Variant with version name '" + versionName + "' and color '" + color + "' already exists for this model");
            return null;
        }
        
        // Create the vehicle variant
        VehicleVariantDTO result = vehicleVariantDAO.createVariant(
            modelId, 
            versionName.trim(), 
            color.trim(), 
            image != null ? image.trim() : null, 
            price
        );
        
        if (result != null) {
            System.out.println("Vehicle variant created successfully with ID: " + result.getVariantId());
        } else {
            System.err.println("Failed to create vehicle variant");
        }
        
        return result;
    }
    
    public boolean updateVehicleVariant(int variantId, int modelId, String versionName, String color, String image, double price) {
        // Validate input
        if (variantId <= 0) {
            System.err.println("Invalid variant ID");
            return false;
        }
        
        if (modelId <= 0) {
            System.err.println("Invalid model ID");
            return false;
        }
        
        if (versionName == null || versionName.trim().isEmpty()) {
            System.err.println("Version name cannot be empty");
            return false;
        }
        
        if (color == null || color.trim().isEmpty()) {
            System.err.println("Color cannot be empty");
            return false;
        }
        
        if (price < 0) {
            System.err.println("Price cannot be negative");
            return false;
        }
        
        // Check if variant exists
        VehicleVariantDTO existingVariant = vehicleVariantDAO.getVariantById(variantId);
        if (existingVariant == null) {
            System.err.println("Vehicle variant with ID " + variantId + " does not exist");
            return false;
        }
        
        // Check if vehicle model exists and is active
        List<VehicleModelDTO> models = vehicleModelDAO.viewVehicleModelById(modelId);
        if (models == null || models.isEmpty()) {
            System.err.println("Vehicle model with ID " + modelId + " does not exist");
            return false;
        }
        
        VehicleModelDTO model = models.get(0);
        if (!model.isIsActive()) {
            System.err.println("Vehicle model with ID " + modelId + " is not active");
            return false;
        }
        
        // Check if variant with same version name and color already exists (excluding current variant)
        if (isVariantExistsExcludingId(modelId, versionName.trim(), color.trim(), variantId)) {
            System.err.println("Another variant with version name '" + versionName + "' and color '" + color + "' already exists for this model");
            return false;
        }
        
        // Update the vehicle variant
        boolean result = vehicleVariantDAO.updateVariant(
            variantId, 
            modelId, 
            versionName.trim(), 
            color.trim(), 
            image != null ? image.trim() : null, 
            price
        );
        
        if (result) {
            System.out.println("Vehicle variant updated successfully");
        } else {
            System.err.println("Failed to update vehicle variant");
        }
        
        return result;
    }

    public boolean disableVehicleVariant(int variantId) {
        // Validate input
        if (variantId <= 0) {
            System.err.println("Invalid variant ID");
            return false;
        }
        
        // Check if variant exists
        VehicleVariantDTO variant = vehicleVariantDAO.getVariantById(variantId);
        if (variant == null) {
            System.err.println("Vehicle variant with ID " + variantId + " does not exist");
            return false;
        }
        
        // Check if already disabled
        if (!variant.isIsActive()) {
            System.err.println("Vehicle variant is already disabled");
            return false;
        }
        
        // Disable the vehicle variant
        boolean result = vehicleVariantDAO.disableVariant(variantId);
        
        if (result) {
            System.out.println("Vehicle variant disabled successfully");
        } else {
            System.err.println("Failed to disable vehicle variant");
        }
        
        return result;
    }

    public boolean enableVehicleVariant(int variantId) {
        // Validate input
        if (variantId <= 0) {
            System.err.println("Invalid variant ID");
            return false;
        }
        
        // Check if variant exists
        VehicleVariantDTO variant = vehicleVariantDAO.getVariantById(variantId);
        if (variant == null) {
            System.err.println("Vehicle variant with ID " + variantId + " does not exist");
            return false;
        }
        
        // Check if already enabled
        if (variant.isIsActive()) {
            System.err.println("Vehicle variant is already enabled");
            return false;
        }
        
        // Check if the parent model is active
        List<VehicleModelDTO> models = vehicleModelDAO.viewVehicleModelById(variant.getModelId());
        if (models == null || models.isEmpty()) {
            System.err.println("Parent vehicle model does not exist");
            return false;
        }
        
        VehicleModelDTO model = models.get(0);
        if (!model.isIsActive()) {
            System.err.println("Cannot enable variant because parent vehicle model is not active");
            return false;
        }
        
        // Enable the vehicle variant
        boolean result = vehicleVariantDAO.enableVariant(variantId);
        
        if (result) {
            System.out.println("Vehicle variant enabled successfully");
        } else {
            System.err.println("Failed to enable vehicle variant");
        }
        
        return result;
    }
    
    // Helper methods
    

    private boolean isVariantExists(int modelId, String versionName, String color) {
        List<VehicleVariantDTO> variants = vehicleVariantDAO.viewVehicleVariant(modelId);
        if (variants == null || variants.isEmpty()) {
            return false;
        }
        
        return variants.stream().anyMatch(v -> 
            v.getVersionName().equalsIgnoreCase(versionName) && 
            v.getColor().equalsIgnoreCase(color)
        );
    }
    
    private boolean isVariantExistsExcludingId(int modelId, String versionName, String color, int excludeVariantId) {
        List<VehicleVariantDTO> variants = vehicleVariantDAO.viewVehicleVariant(modelId);
        if (variants == null || variants.isEmpty()) {
            return false;
        }
        
        return variants.stream().anyMatch(v -> 
            v.getVariantId() != excludeVariantId &&
            v.getVersionName().equalsIgnoreCase(versionName) && 
            v.getColor().equalsIgnoreCase(color)
        );
    }
    
    public List<VehicleVariantDTO> HandlingViewVehicleVariant(int modelId) {
        List<VehicleVariantDTO> variants = vehicleVariantDAO.viewVehicleVariant(modelId);
        return variants;
    }
}
