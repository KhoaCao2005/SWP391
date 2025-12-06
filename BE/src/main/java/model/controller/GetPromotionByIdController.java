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
import model.dto.PromotionDTO;
import model.service.PromotionForDealerService;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/getPromotionById")
public class GetPromotionByIdController extends HttpServlet {

    private final PromotionForDealerService service = new PromotionForDealerService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(req);
            int promoId = Integer.parseInt(params.get("promoId").toString());

            List<PromotionDTO> promotionList = service.getPromotionById(promoId);
            if (promotionList == null || promotionList.isEmpty()) {
                ResponseUtils.error(resp, "Promotion not found");
            } else {
                ResponseUtils.success(resp, "Promotion retrieved successfully", promotionList);
            }

        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid promoId format");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Server error while retrieving promotion");
        }
    }
}
