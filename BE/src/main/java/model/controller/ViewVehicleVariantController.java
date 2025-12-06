/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package model.controller;

import static com.sun.corba.se.spi.presentation.rmi.StubAdapter.request;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import model.dto.VehicleVariantDTO;
import model.service.VehicleVariantService;
import utils.RequestUtils;
import utils.ResponseUtils;


/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/viewVehicleVariant")
public class ViewVehicleVariantController extends HttpServlet {
    private final VehicleVariantService service = new VehicleVariantService();
   
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(req);
            
            // Get model_id from request, default to 0 if not provided (0 = all variants)
            int modelId = 0;
            Object modelIdObj = params.get("model_id");
            if (modelIdObj != null) {
                modelId = Integer.parseInt(modelIdObj.toString());
            }
            
            List<VehicleVariantDTO> variants = service.HandlingViewVehicleVariant(modelId);
            
            if (variants != null && !variants.isEmpty()) {
                ResponseUtils.success(resp, "Vehicle variants retrieved successfully", variants);
            } else {
                ResponseUtils.success(resp, "No vehicle variants found", variants);
            }
        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid model_id format");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "An error occurred while retrieving vehicle variants: " + e.getMessage());
        }
    }
 
}
