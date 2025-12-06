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
import model.dto.PromotionDTO;
import model.service.PromotionForDealerService;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/getAllPromotion")
public class GetAllPromotionController extends HttpServlet {

    private final PromotionForDealerService service = new PromotionForDealerService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            List<PromotionDTO> promotions = service.getAllPromotion();

            if (promotions == null || promotions.isEmpty()) {
                ResponseUtils.error(resp, "No promotions found");
            } else {
                ResponseUtils.success(resp, "Retrieved all promotions successfully", promotions);
            }

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Server error while retrieving promotions");
        }
    }
}
