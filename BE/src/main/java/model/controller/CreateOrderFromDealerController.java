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
import model.dao.VehicleVariantDAO;
import model.dto.VehicleVariantDTO;
import model.service.OrderService;
import utils.JwtUtil;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/staff/createOrderFromDealer")
public class CreateOrderFromDealerController extends HttpServlet {

    private final OrderService service = new OrderService();
    private final VehicleVariantDAO variantDAO = new VehicleVariantDAO();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            String token = JwtUtil.extractToken(req);
            int dealerstaffId = JwtUtil.extractUserId(token);
            Map<String, Object> params = RequestUtils.extractParams(req);

            // Validate required fields
            if (!params.containsKey("modelId") 
                    || !params.containsKey("quantity")) {
                ResponseUtils.error(resp, "Missing required parameters: dealerstaffId, modelId, quantity");
                return;
            }

            // Parse required parameters
            int modelId = Integer.parseInt(params.get("modelId").toString());
            int quantity = Integer.parseInt(params.get("quantity").toString());

            // Validate quantity
            if (quantity <= 0) {
                ResponseUtils.error(resp, "Quantity must be greater than 0");
                return;
            }

            // Handle variantId - optional
            Integer variantId = null;
            double unitPrice = 0.0;

            if (params.containsKey("variantId") && params.get("variantId") != null
                    && !params.get("variantId").toString().trim().isEmpty()) {
                variantId = Integer.parseInt(params.get("variantId").toString());

                if (variantId > 0) {
                    VehicleVariantDTO variant = variantDAO.findUnitPriceByVariantId(variantId);
                    if (variant == null) {
                        ResponseUtils.error(resp, "Variant not found with ID: " + variantId);
                        return;
                    }
                    unitPrice = variant.getPrice();
                }
            }

            // Handle status - optional, defaults to "Pending"
            String status = "Pending";
            if (params.containsKey("status") && params.get("status") != null
                    && !params.get("status").toString().trim().isEmpty()) {
                status = params.get("status").toString();
            }

            // Handle isCustom - optional, defaults to true
            boolean isCustom = true;
            if (params.containsKey("isCustom") && params.get("isCustom") != null
                    && !params.get("isCustom").toString().trim().isEmpty()) {
                isCustom = Boolean.parseBoolean(params.get("isCustom").toString());
            }
            
            // Create order via service
            int orderId = service.HandlingCreateOrder(0, dealerstaffId, modelId,
                    status, variantId, quantity, unitPrice, isCustom);

            // Return response
            if (orderId > 0) {
                String message = String.format(
                        "Order ID: %d | Variant: %s | Unit Price: %.2f%s",
                        orderId,
                        variantId != null && variantId > 0 ? variantId : "Auto-Generated",
                        unitPrice,
                        isCustom ? " | Status: Custom (Pending Confirmation)" : ""
                );
                ResponseUtils.success(resp, "Order created successfully", message);
            } else {
                ResponseUtils.error(resp, "Failed to create order");
            }

        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid number format: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error creating order: " + e.getMessage());
        }
    }
}
