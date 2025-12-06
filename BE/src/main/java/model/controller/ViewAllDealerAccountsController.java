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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import model.service.UserAccountService;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/viewAllDealerAccounts")
public class ViewAllDealerAccountsController extends HttpServlet {

    private final UserAccountService userAccountService = new UserAccountService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            // Get all dealer accounts with dealer name
            List<Map<String, Object>> dealerAccounts = userAccountService
                    .getAllDealerAccounts();

            if (dealerAccounts != null && !dealerAccounts.isEmpty()) {
                ResponseUtils.success(resp,
                        "Retrieved " + dealerAccounts.size() + " dealer account(s)",
                        dealerAccounts);
            } else {
                ResponseUtils.success(resp, "No dealer accounts found", new ArrayList<>());
            }

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error retrieving dealer accounts: " + e.getMessage());
        }
    }
}
