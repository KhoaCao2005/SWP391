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
import java.util.HashMap;
import java.util.Map;
import model.service.OrderService;
import utils.JwtUtil;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/approveCustomOrder")
public class ApproveCustomOrderController extends HttpServlet {

    private final OrderService service = new OrderService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            // Extract token from header
            String token = JwtUtil.extractToken(req);
            int staffAdminId = JwtUtil.extractUserId(token);

            // Extract parameters from frontend
            Map<String, Object> params = RequestUtils.extractParams(req);
            
            // Debug: Print received parameters
            System.out.println("DEBUG: Received params: " + params);

            // Parse orderId with better error handling
            Object orderIdObj = params.get("orderId");
            if (orderIdObj == null) {
                ResponseUtils.error(resp, "Missing required parameter: orderId");
                return;
            }
            
            int orderId;
            try {
                orderId = Integer.parseInt(orderIdObj.toString());
            } catch (NumberFormatException e) {
                ResponseUtils.error(resp, "Invalid orderId format: " + orderIdObj);
                return;
            }

            String decision = params.get("decision") != null ? params.get("decision").toString() : "Pending";
            
            // Get current variant data from database
            Map<String, Object> variantData = service.getOrderDataForApproval(orderId);
            if (variantData == null) {
                ResponseUtils.error(resp, "Order not found or invalid order ID: " + orderId);
                return;
            }
            
            // Extract current values from variant with null checks
            String currentVersionName = variantData.get("versionName") != null ? (String) variantData.get("versionName") : "Auto-Generated Version";
            String currentColor = variantData.get("color") != null ? (String) variantData.get("color") : "Default Color";
            
            double currentPrice = 0.0;
            if (variantData.get("price") != null) {
                Object priceObj = variantData.get("price");
                currentPrice = (priceObj instanceof Integer) ? ((Integer) priceObj).doubleValue() : (double) priceObj;
            }
            
            double currentUnitPrice = 0.0;
            if (variantData.get("unitPrice") != null) {
                Object unitPriceObj = variantData.get("unitPrice");
                currentUnitPrice = (unitPriceObj instanceof Integer) ? ((Integer) unitPriceObj).doubleValue() : (double) unitPriceObj;
            }
            
            // Check if this is an auto-generated variant (custom order)
            boolean isCustomVariant = "Auto-Generated Version".equals(currentVersionName) 
                                   || "Default Color".equals(currentColor)
                                   || currentPrice == 0.0;
            
            // Get user input
            String versionNameInput = params.get("versionName") != null ? params.get("versionName").toString() : null;
            String colorInput = params.get("color") != null ? params.get("color").toString() : null;
            
            // Parse unitPrice with better error handling
            Double unitPriceInput = null;
            if (params.get("unitPrice") != null) {
                try {
                    Object unitPriceObj = params.get("unitPrice");
                    if (unitPriceObj instanceof Integer) {
                        unitPriceInput = ((Integer) unitPriceObj).doubleValue();
                    } else if (unitPriceObj instanceof Double) {
                        unitPriceInput = (Double) unitPriceObj;
                    } else {
                        unitPriceInput = Double.parseDouble(unitPriceObj.toString());
                    }
                } catch (NumberFormatException e) {
                    ResponseUtils.error(resp, "Invalid unitPrice format: " + params.get("unitPrice"));
                    return;
                }
            }
            
            // Determine final values based on variant type
            String finalVersionName;
            String finalColor;
            double finalUnitPrice;
            
            if (isCustomVariant) {
                // CUSTOM VARIANT: All fields are REQUIRED if approving
                if ("Agree".equalsIgnoreCase(decision)) {
                    // Version Name - required
                    if (versionNameInput == null || versionNameInput.trim().isEmpty()) {
                        ResponseUtils.error(resp, "Version name is required for custom order approval");
                        return;
                    }
                    finalVersionName = versionNameInput;
                    
                    // Color - required
                    if (colorInput == null || colorInput.trim().isEmpty()) {
                        ResponseUtils.error(resp, "Color is required for custom order approval");
                        return;
                    }
                    finalColor = colorInput;
                    
                    // Unit Price - required and must be > 0
                    if (unitPriceInput == null || unitPriceInput <= 0) {
                        ResponseUtils.error(resp, "Unit price is required for custom order approval and must be greater than 0");
                        return;
                    }
                    finalUnitPrice = unitPriceInput;
                } else {
                    // For Disagree/Pending, use default values (will be deleted anyway)
                    finalVersionName = currentVersionName;
                    finalColor = currentColor;
                    finalUnitPrice = currentUnitPrice;
                }
                
            } else {
                // EXISTING VARIANT: All fields are OPTIONAL (use current values if not provided)
                finalVersionName = (versionNameInput != null && !versionNameInput.trim().isEmpty()) 
                                 ? versionNameInput 
                                 : currentVersionName;
                
                finalColor = (colorInput != null && !colorInput.trim().isEmpty()) 
                           ? colorInput 
                           : currentColor;
                
                finalUnitPrice = (unitPriceInput != null && unitPriceInput > 0) 
                               ? unitPriceInput 
                               : (currentUnitPrice > 0 ? currentUnitPrice : currentPrice);
            }

            // Call service with staffAdminId
            boolean result = service.approveCustomOrderByOrderId(orderId, decision, finalVersionName, finalColor, finalUnitPrice, staffAdminId);

            // Send response
            if (result) {
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("decision", decision);
                responseData.put("versionName", finalVersionName);
                responseData.put("color", finalColor);
                responseData.put("unitPrice", finalUnitPrice);
                responseData.put("isCustomVariant", isCustomVariant);
                
                ResponseUtils.success(resp, "Custom order processed successfully", responseData);
            } else {
                ResponseUtils.error(resp, "Failed to process custom order");
            }

        } catch (NumberFormatException e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Invalid number format in parameters: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error processing custom order: " + e.getMessage());
        }
    }
}
