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
import model.service.UserAccountService;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/enableDealerAccount")
public class EnableDealerAccountController extends HttpServlet {

    private final UserAccountService userAccountService = new UserAccountService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            // Extract parameters from request
            Map<String, Object> params = RequestUtils.extractParams(request);

            // Get user ID
            int userId = params.get("userId") != null
                    ? Integer.parseInt(params.get("userId").toString()) : null;

            // Enable dealer account
            boolean success = userAccountService.enableDealerAccount(userId);

            if (success) {
                response.setStatus(HttpServletResponse.SC_OK);
                Map<String, Object> data = new HashMap<>();
                data.put("userId", userId);
                data.put("isActive", true);
                ResponseUtils.success(response, "Dealer account enabled successfully", data);
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                ResponseUtils.error(response, "Failed to enable dealer account or user not found");
            }

        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            ResponseUtils.error(response, e.getMessage());

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            ResponseUtils.error(response, "Internal server error: " + e.getMessage());
        }
    }
}
