/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.service;

import java.util.ArrayList;
import java.util.List;
import model.dao.VehicleModelDAO;
import model.dao.VehicleSerialDAO;
import model.dao.VehicleVariantDAO;
import model.dto.VehicleModelDTO;
import model.dto.VehicleSerialDTO;
import model.dto.VehicleVariantDTO;

/**
 *
 * @author Admin
 */
public class VehicleService {

    private VehicleModelDAO modelDAO = new VehicleModelDAO();
    private VehicleVariantDAO variantDAO = new VehicleVariantDAO();
    private VehicleSerialDAO serialDAO = new VehicleSerialDAO();

    public List<VehicleModelDTO> HandlingViewAllVehicle() {
        List<VehicleModelDTO> models = modelDAO.viewVehicleModelIsActive();
        if (models != null) {
            for (VehicleModelDTO model : models) {
                List<VehicleVariantDTO> variants = variantDAO.viewVehicleVariantIsActive(model.getModelId());
                model.setLists(variants);
            }
        }
        return models;
    }

    public List<VehicleModelDTO> HandlingViewVehicle() {
        List<VehicleModelDTO> models = modelDAO.viewAllVehicleModel();
        if (models != null) {
            for (VehicleModelDTO model : models) {
                List<VehicleVariantDTO> variants = variantDAO.viewVehicleVariantIsActive(model.getModelId());
                model.setLists(variants);
            }
        }
        return models;
    }

    public List<VehicleSerialDTO> getAvailableSerialsByVariantAndDealer(int variantId, int dealerId) {
        if (variantId <= 0) {
            throw new IllegalArgumentException("Variant ID must be a positive number");
        }

        if (dealerId <= 0) {
            throw new IllegalArgumentException("Dealer ID must be a positive number");
        }

        List<VehicleSerialDTO> serials = serialDAO
                .getUnorderedOrDealerOrderedSerialsByVariantIdAndDealer(variantId, dealerId);

        if (serials == null || serials.isEmpty()) {
            System.out.println("No available serials found for variant ID: " + variantId + " and dealer ID: " + dealerId);
            return new ArrayList<>();
        }

        return serials;
    }

}
