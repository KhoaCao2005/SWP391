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
@WebServlet("/api/EVM/enableVehicleModel")
public class EnableVehicleModelController extends HttpServlet {
    private VehicleModelService vehicleModelService = new VehicleModelService();
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(request);
            
            Object modelIdObj = params.get("model_id");
            
            if (modelIdObj == null) {
                ResponseUtils.error(response, "Missing required field: model_id");
                return;
            }
            
            int modelId = Integer.parseInt(modelIdObj.toString());
            
            boolean result = vehicleModelService.enableVehicleModel(modelId);
            
            if (result) {
                ResponseUtils.success(response, "Vehicle model enabled successfully", null);
            } else {
                ResponseUtils.error(response, "Failed to enable vehicle model");
            }
        } catch (NumberFormatException e) {
            ResponseUtils.error(response, "Invalid model_id format");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Failed to enable vehicle model: " + e.getMessage());
        }
    }
}
