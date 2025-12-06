package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import model.dto.TestDriveScheduleDTO;
import model.dto.UserAccountDTO;
import model.service.TestDriveScheduleService;
import model.service.UserAccountService;
import utils.JwtUtil;
import utils.RequestUtils;
import utils.ResponseUtils;

@WebServlet("/api/staff/updateScheduleStatus")
public class UpdateScheduleController extends HttpServlet {
    private final TestDriveScheduleService scheduleService = new TestDriveScheduleService();
    private final UserAccountService userService = new UserAccountService();
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            String token = JwtUtil.extractToken(req);
            int userId = JwtUtil.extractUserId(token);
            
            UserAccountDTO user = userService.getDealerStaffById(userId);
            
            if (user == null) {
                ResponseUtils.error(resp, "User not found");
                return;
            }
            
            Integer dealerId = user.getDealerId();
            if (dealerId == null) {
                ResponseUtils.error(resp, "Dealer ID not found for user");
                return;
            }
            
            Map<String, Object> params = RequestUtils.extractParams(req);
            
            Object appointmentIdObj = params.get("appointment_id");
            String appointmentIdParam = (appointmentIdObj == null) ? null : appointmentIdObj.toString();
            
            Object newStatusObj = params.get("new_status");
            String newBaseStatus = (newStatusObj == null) ? null : newStatusObj.toString();
            
            if (appointmentIdParam == null || appointmentIdParam.trim().isEmpty() || 
                newBaseStatus == null || newBaseStatus.trim().isEmpty()) {
                ResponseUtils.error(resp, "Missing required fields: appointment_id and new_status");
                return;
            }
            
            int appointmentId = Integer.parseInt(appointmentIdParam);
            
            TestDriveScheduleDTO currentSchedule = scheduleService.getTestDriveScheduleById(appointmentId);
            
            if (currentSchedule == null) {
                ResponseUtils.error(resp, "Schedule not found with appointment_id: " + appointmentId);
                return;
            }
            
            String currentEncodedStatus = currentSchedule.getStatus();
            int scheduleDealerId = JwtUtil.extractDealerIdFromStatus(currentEncodedStatus);
            
            if (scheduleDealerId != dealerId) {
                ResponseUtils.error(resp, "You are not authorized to update this schedule");
                return;
            }
            
            String newEncodedStatus = JwtUtil.updateStatus(currentEncodedStatus, newBaseStatus);
            
            if (newEncodedStatus == null) {
                ResponseUtils.error(resp, "Failed to encode new status");
                return;
            }
            
            TestDriveScheduleDTO updatedSchedule = scheduleService.updateTestDriveSchedule(appointmentId, newEncodedStatus);
            
            if (updatedSchedule == null) {
                ResponseUtils.error(resp, "Failed to update status. Please try again.");
            } else {
                ResponseUtils.success(resp, "Schedule status updated successfully", updatedSchedule);
            }
        } catch (utils.AuthException e) {
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid format for appointment_id.");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error during status update: " + e.getMessage());
        }
    }
}