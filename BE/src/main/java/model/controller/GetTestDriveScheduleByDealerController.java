package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import model.dto.TestDriveScheduleDTO;
import model.dto.UserAccountDTO;
import model.service.TestDriveScheduleService;
import model.service.UserAccountService;
import utils.JwtUtil;
import utils.ResponseUtils;

@WebServlet("/api/staff/getTestDriveScheduleByDealerId")
public class GetTestDriveScheduleByDealerController extends HttpServlet {
    private final TestDriveScheduleService testDriveScheduleService = new TestDriveScheduleService();
    private final UserAccountService userAccountService = new UserAccountService();
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            String token = JwtUtil.extractToken(req);
            int dealerStaffId = JwtUtil.extractUserId(token);
            
            UserAccountDTO staff = userAccountService.getDealerStaffById(dealerStaffId);
            if (staff == null) {
                ResponseUtils.error(resp, "Staff account not found");
                return;
            }
            
            Integer dealerId = staff.getDealerId();
            if (dealerId == null || dealerId <= 0) {
                ResponseUtils.error(resp, "No dealer associated with this staff account");
                return;
            }
            
            List<TestDriveScheduleDTO> schedules = testDriveScheduleService.getSchedulesByDealer(dealerId);
            
            if (schedules != null && !schedules.isEmpty()) {
                ResponseUtils.success(resp, "Test drive schedules retrieved successfully", schedules);
            } else {
                ResponseUtils.success(resp, "No test drive schedules found for your dealership", new ArrayList<>());
            }
        } catch (utils.AuthException e) {
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "An error occurred while retrieving test drive schedules: " + e.getMessage());
        }
    }
}