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
@WebServlet("/api/EVM/updateDealerAccount")
public class UpdateDealerAccountController extends HttpServlet {

    private final UserAccountService userAccountService = new UserAccountService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            // Extract parameters from request
            Map<String, Object> params = RequestUtils.extractParams(request);

            // Get parameters
            int userId = params.get("userId") != null
                    ? Integer.parseInt(params.get("userId").toString()) : 0;
            String email = params.get("email") != null
                    ? params.get("email").toString() : null;
            String username = params.get("username") != null
                    ? params.get("username").toString() : null;
            String phoneNumber = params.get("phoneNumber") != null
                    ? params.get("phoneNumber").toString() : null;
            String password = params.get("password") != null
                    ? params.get("password").toString() : null;
            int roleId = params.get("roleId") != null
                    ? Integer.parseInt(params.get("roleId").toString()) : null;

            // Update dealer account
            UserAccountDTO updatedUser = userAccountService.updateDealerAccount(
                    userId, email, username, phoneNumber, password, roleId
            );

            if (updatedUser != null) {
                response.setStatus(HttpServletResponse.SC_OK);
                ResponseUtils.success(response, "Dealer account updated successfully", updatedUser);
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                ResponseUtils.error(response, "Failed to update dealer account or user not found");
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
