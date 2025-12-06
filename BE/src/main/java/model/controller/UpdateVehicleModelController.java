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
import model.service.VehicleModelService;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/updateVehicleModel")
public class UpdateVehicleModelController extends HttpServlet {
    private VehicleModelService vehicleModelService = new VehicleModelService();
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(request);
            
            Object modelIdObj = params.get("model_id");
            String modelName = (String) params.get("model_name");
            String description = (String) params.get("description");
            
            if (modelIdObj == null || modelName == null || description == null) {
                ResponseUtils.error(response, "Missing required fields: model_id, model_name, and description");
                return;
            }
            
            int modelId = Integer.parseInt(modelIdObj.toString());
            
            boolean result = vehicleModelService.updateVehicleModel(modelId, modelName, description);
            
            if (result) {
                ResponseUtils.success(response, "Vehicle model updated successfully", null);
            } else {
                ResponseUtils.error(response, "Failed to update vehicle model");
            }
        } catch (NumberFormatException e) {
            ResponseUtils.error(response, "Invalid model_id format");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Failed to update vehicle model: " + e.getMessage());
        }
    }
}