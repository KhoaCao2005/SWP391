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
import model.dto.UserAccountDTO;
import model.service.UserAccountService;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/createDealerAccount")
public class CreateDealerAccountController extends HttpServlet {

    private final UserAccountService userAccountService = new UserAccountService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        System.out.println("=== DEBUG SESSION INFO ===");
        System.out.println("Session ID: " + request.getSession().getId());
        System.out.println("User in session: " + request.getSession().getAttribute("user"));
        System.out.println("Roles in session: " + request.getSession().getAttribute("roles"));
        System.out.println("========================");
        try {
            // Extract parameters from request
            Map<String, Object> params = RequestUtils.extractParams(request);

            // Get required parameters
            int dealerId = params.get("dealerId") != null
                    ? Integer.parseInt(params.get("dealerId").toString()) : 0;
            String email = params.get("email") != null
                    ? params.get("email").toString() : null;
            String username = params.get("username") != null
                    ? params.get("username").toString() : null;
            String password = params.get("password") != null
                    ? params.get("password").toString() : null;
            String phoneNumber = params.get("phoneNumber") != null
                    ? params.get("phoneNumber").toString() : null;
            int roleId = params.get("roleId") != null
                    ? Integer.parseInt(params.get("roleId").toString()) : 0;

            // Create dealer account
            UserAccountDTO createdUser = userAccountService.createDealerAccount(
                    dealerId, email, username, password, phoneNumber, roleId
            );

            if (createdUser != null) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                ResponseUtils.success(response, "Dealer account created successfully", createdUser);
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                ResponseUtils.error(response, "Failed to create dealer account");
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
