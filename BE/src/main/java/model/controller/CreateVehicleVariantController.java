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
import model.dto.VehicleVariantDTO;
import model.service.VehicleVariantService;
import utils.RequestUtils;
import utils.ResponseUtils;



/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/createVehicleVariant")
public class CreateVehicleVariantController extends HttpServlet {
    private VehicleVariantService vehicleVariantService = new VehicleVariantService();
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(request);
            
            Object modelIdObj = params.get("model_id");
            String versionName = (String) params.get("version_name");
            String color = (String) params.get("color");
            String image = (String) params.get("image");
            Object priceObj = params.get("price");
            
            if (modelIdObj == null || versionName == null || color == null || priceObj == null) {
                ResponseUtils.error(response, "Missing required fields: model_id, version_name, color, and price");
                return;
            }
            
            int modelId = Integer.parseInt(modelIdObj.toString());
            double price = Double.parseDouble(priceObj.toString());
            
            VehicleVariantDTO result = vehicleVariantService.createVehicleVariant(
                modelId, 
                versionName, 
                color, 
                image, 
                price
            );
            
            if (result != null) {
                ResponseUtils.success(response, "Vehicle variant created successfully", result);
            } else {
                ResponseUtils.error(response, "Failed to create vehicle variant");
            }
        } catch (NumberFormatException e) {
            ResponseUtils.error(response, "Invalid number format for model_id or price");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Failed to create vehicle variant: " + e.getMessage());
        }
    }
}
