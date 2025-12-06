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
import model.dao.DealerDAO;
import model.dto.DealerDTO;
import utils.RequestUtils;
import utils.ResponseUtils;


/**
 *
 * @author Admin
 */
@WebServlet("/api/staff/searchDealer")
public class DealerSearchController extends HttpServlet {

    private final DealerDAO dealerDAO = new DealerDAO();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(req);
            
            Object nameObj = params.get("name");
            String name = (nameObj == null) ? null : nameObj.toString();

            if (name == null || name.trim().isEmpty()) {
                ResponseUtils.error(resp, "Dealer name is required");
                return;
            }

            List<DealerDTO> dealers = dealerDAO.findByName(name.trim());
            
            if (dealers != null && !dealers.isEmpty()) {
                ResponseUtils.success(resp, "Dealers found", dealers);
            } else {
                // Return success with empty list if not found, or an error message.
                // Sticking closer to the original's success/error pattern for consistency.
                ResponseUtils.error(resp, "Dealer not found with name: " + name); 
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error searching for dealer: " + e.getMessage());
        }
    }
}