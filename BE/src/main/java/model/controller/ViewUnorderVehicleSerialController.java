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
import java.util.List;
import java.util.Map;
import model.dto.UserAccountDTO;
import model.dto.VehicleSerialDTO;
import model.service.UserAccountService;
import model.service.VehicleService;
import utils.JwtUtil;
import utils.RequestUtils;
import utils.ResponseUtils;


/**
 *
 * @author Admin
 */
@WebServlet("/api/staff/getUnorderedSerials")
public class ViewUnorderVehicleSerialController extends HttpServlet {
    
    private final VehicleService vehicleSerialService = new VehicleService();
    private final UserAccountService userAccountService = new UserAccountService();
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            // Extract token and get dealer staff ID from JWT
            String token = JwtUtil.extractToken(req);
            int dealerStaffId = JwtUtil.extractUserId(token);
            
            // Get dealer staff user account using service layer
            UserAccountDTO staff = userAccountService.getDealerStaffById(dealerStaffId);
            
            if (staff == null) {
                ResponseUtils.error(resp, "Staff account not found");
                return;
            }
            
            // Get dealer ID from staff account
            int dealerId = staff.getDealerId();
            
            if (dealerId <= 0) {
                ResponseUtils.error(resp, "No dealer associated with this staff account");
                return;
            }
            
            // Extract parameters from request
            Map<String, Object> params = RequestUtils.extractParams(req);
            
            // Get variant ID from parameters
            Object variantIdObj = params.get("variant_id");
            String variantIdParam = (variantIdObj == null) ? null : variantIdObj.toString();
            
            if (variantIdParam == null || variantIdParam.trim().isEmpty()) {
                ResponseUtils.error(resp, "Variant ID is required");
                return;
            }
            
            int variantId = Integer.parseInt(variantIdParam);
            
            if (variantId <= 0) {
                ResponseUtils.error(resp, "Invalid variant ID");
                return;
            }
            
            // Get unordered serials for the variant
            List<VehicleSerialDTO> serials = vehicleSerialService
                    .getAvailableSerialsByVariantAndDealer(variantId, dealerId);
            
            int count = serials.size();
            
            if (count > 0) {
                ResponseUtils.success(resp, 
                    "Found " + count + " unordered serial(s) for variant ID " + variantId, 
                    serials);
            } else {
                ResponseUtils.success(resp, 
                    "No unordered serials found for variant ID " + variantId, 
                    serials);
            }
            
        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid variant ID format");
        } catch (IllegalArgumentException e) {
            ResponseUtils.error(resp, e.getMessage());
        } catch (utils.AuthException e) {
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error retrieving unordered serials: " + e.getMessage());
        }
    }
}