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
@WebServlet("/api/EVM/enableVehicleVariant")
public class EnableVehicleVariantController extends HttpServlet {
    private VehicleVariantService vehicleVariantService = new VehicleVariantService();
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(request);
            
            Object variantIdObj = params.get("variant_id");
            
            if (variantIdObj == null) {
                ResponseUtils.error(response, "Missing required field: variant_id");
                return;
            }
            
            int variantId = Integer.parseInt(variantIdObj.toString());
            
            boolean result = vehicleVariantService.enableVehicleVariant(variantId);
            
            if (result) {
                ResponseUtils.success(response, "Vehicle variant enabled successfully", null);
            } else {
                ResponseUtils.error(response, "Failed to enable vehicle variant");
            }
        } catch (NumberFormatException e) {
            ResponseUtils.error(response, "Invalid variant_id format");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Failed to enable vehicle variant: " + e.getMessage());
        }
    }
}
