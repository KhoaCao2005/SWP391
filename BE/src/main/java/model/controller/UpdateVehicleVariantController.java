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
import model.service.VehicleVariantService;
import utils.RequestUtils;
import utils.ResponseUtils;


/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/updateVehicleVariant")
public class UpdateVehicleVariantController extends HttpServlet {
    private VehicleVariantService vehicleVariantService = new VehicleVariantService();
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(request);
            
            Object variantIdObj = params.get("variant_id");
            Object modelIdObj = params.get("model_id");
            String versionName = (String) params.get("version_name");
            String color = (String) params.get("color");
            String image = (String) params.get("image");
            Object priceObj = params.get("price");
            
            if (variantIdObj == null || modelIdObj == null || versionName == null || 
                color == null || priceObj == null) {
                ResponseUtils.error(response, "Missing required fields: variant_id, model_id, version_name, color, and price");
                return;
            }
            
            int variantId = Integer.parseInt(variantIdObj.toString());
            int modelId = Integer.parseInt(modelIdObj.toString());
            double price = Double.parseDouble(priceObj.toString());
            
            boolean result = vehicleVariantService.updateVehicleVariant(
                variantId, 
                modelId, 
                versionName, 
                color, 
                image, 
                price
            );
            
            if (result) {
                ResponseUtils.success(response, "Vehicle variant updated successfully", null);
            } else {
                ResponseUtils.error(response, "Failed to update vehicle variant");
            }
        } catch (NumberFormatException e) {
            ResponseUtils.error(response, "Invalid number format for variant_id, model_id, or price");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Failed to update vehicle variant: " + e.getMessage());
        }
    }
}
