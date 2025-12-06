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
import model.dao.UserAccountDAO;
import model.dto.UserAccountDTO;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/staff/searchDealerStaff")
public class DealerStaffSearchController extends HttpServlet {

    private final UserAccountDAO userDAO = new UserAccountDAO();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(req);

            Object nameObj = params.get("username");
            String name = (nameObj == null) ? null : nameObj.toString();

            if (name == null || name.trim().isEmpty()) {
                ResponseUtils.error(resp, "Dealer staff username is required");
                return;
            }

            List<UserAccountDTO> users = userDAO.searchDealerStaffAndManagerByName(name.trim());

            if (users != null && !users.isEmpty()) {
                ResponseUtils.success(resp, "DealerStaff found", users);
            } else {
                ResponseUtils.error(resp, "No DealerStaff found with username: " + name);
            }

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error searching DealerStaff: " + e.getMessage());
        }
    }
}