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
import java.sql.SQLException;
import java.util.Map;
import model.dto.PromotionDTO;
import model.service.PromotionForDealerService;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/createPromotion")
public class CreatePromotionController extends HttpServlet {

    private final PromotionForDealerService service = new PromotionForDealerService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(req);

            String description = params.get("description").toString();
            String startDate = params.get("startDate").toString();
            String endDate = params.get("endDate").toString();
            String discountRate = params.get("discountRate").toString();
            String type = params.get("type").toString();

            PromotionDTO promotion = new PromotionDTO();
            promotion.setDescription(description);
            promotion.setStartDate(startDate);
            promotion.setEndDate(endDate);
            promotion.setDiscountRate(discountRate);
            promotion.setType(type);

            PromotionDTO createdPromotion = service.createPromotion(promotion);

            if (createdPromotion != null) {
                ResponseUtils.success(resp, "Promotion created successfully", createdPromotion);
            } else {
                ResponseUtils.error(resp, "Failed to create promotion (invalid or duplicate)");
            }

        } catch (SQLException | ClassNotFoundException e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Database error while creating promotion");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Invalid data or server error");
        }
    }
}
