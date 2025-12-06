package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import model.dto.SaleRecordDTO;
import model.dto.UserAccountDTO;
import model.service.SaleRecordService;
import model.service.UserAccountService;
import utils.JwtUtil;
import utils.RequestUtils;
import utils.ResponseUtils;

@WebServlet("/api/staff/salesRecords")
public class SaleRecordController extends HttpServlet {

    private final SaleRecordService service = new SaleRecordService();
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
            
            // Extract date parameters from request
            Map<String, Object> params = RequestUtils.extractParams(req);
            
            Object startDateObj = params.get("startDate");
            String startDate = (startDateObj == null) ? null : startDateObj.toString();
            
            Object endDateObj = params.get("endDate");
            String endDate = (endDateObj == null) ? null : endDateObj.toString();

            if (startDate == null || startDate.trim().isEmpty() || endDate == null || endDate.trim().isEmpty()) {
                ResponseUtils.error(resp, "Both 'startDate' and 'endDate' are required.");
                return;
            }

            // Get sales records for the authenticated staff
            List<SaleRecordDTO> sales = service.getCombinedSaleRecordsForStaffByDateRange(
                    dealerStaffId,
                    startDate,
                    endDate
            );

            if (sales == null || sales.isEmpty()) {
                ResponseUtils.success(resp, "No sales records found for this period.", Collections.emptyList());
            } else {
                ResponseUtils.success(resp, "Successfully retrieved summarized sales records.", sales);
            }

        } catch (utils.AuthException e) {
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error fetching sales records: " + e.getMessage());
        }
    }
}