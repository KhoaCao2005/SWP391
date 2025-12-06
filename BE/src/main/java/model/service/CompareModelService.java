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
 * @author ACER
 */
public class CompareModelService {
     private VehicleModelDAO modelDAO = new VehicleModelDAO();
     private VehicleVariantDAO variantDAO = new VehicleVariantDAO();
    public List<VehicleModelDTO> HandlingSearchVehicleByVehicleName(String VehicleName){
        List<VehicleModelDTO> models=modelDAO.SearchVehicleModel(VehicleName);
     if (models != null) {
            for (VehicleModelDTO model : models) {
                List<VehicleVariantDTO> variants = variantDAO.viewVehicleVariantIsActive(model.getModelId());
                model.setLists(variants);
            }
        }
     return models;
    }
    
}
