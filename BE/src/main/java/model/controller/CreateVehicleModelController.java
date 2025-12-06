/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import model.dto.VehicleModelDTO;
import model.service.VehicleModelService;
import utils.RequestUtils;
import utils.ResponseUtils;


/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/createVehicleModel")
public class CreateVehicleModelController extends HttpServlet {
    private VehicleModelService vehicleModelService = new VehicleModelService();
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(request);
            
            String modelName = (String) params.get("model_name");
            String description = (String) params.get("description");
            
            if (modelName == null || description == null) {
                ResponseUtils.error(response, "Missing required fields: model_name and description");
                return;
            }
            
            VehicleModelDTO result = vehicleModelService.createVehicleModel(modelName, description);
            
            if (result != null) {
                ResponseUtils.success(response, "Vehicle model created successfully", result);
            } else {
                ResponseUtils.error(response, "Failed to create vehicle model");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Failed to create vehicle model: " + e.getMessage());
        }
    }
}
