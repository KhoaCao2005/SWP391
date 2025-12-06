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

/**
 * Controller for creating test drive schedules with dealer ID encoded in status
 * 
 * @author ACER
 */
@WebServlet("/api/staff/createSchedule")
public class CreateScheduleController extends HttpServlet {
    private final TestDriveScheduleService CTDService = new TestDriveScheduleService();
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
            String customerIdStr = params.get("customer_id").toString();
            String serialId = params.get("serial_id").toString(); 
            String date = params.get("date").toString();
            
            
            if (customerIdStr == null || customerIdStr.trim().isEmpty() ||
                serialId == null || serialId.trim().isEmpty() ||
                date == null || date.trim().isEmpty()) {
                ResponseUtils.error(resp, "Customer ID, Serial ID, and Date are required");
                return;
            }
            
            int customerId = Integer.parseInt(customerIdStr);
            
      
            String encodedStatus = JwtUtil.encodeStatus("PENDING", dealerId);
            
        
            TestDriveScheduleDTO schedule = CTDService.createTestDriveSchedule(customerId, serialId, date, encodedStatus);
            
            if (schedule != null) {
                ResponseUtils.success(resp, "Test Drive Schedule created successfully", schedule);
            } else {
                ResponseUtils.error(resp, "Failed to create test drive schedule. Time slot may already be booked.");
            }
        } catch (utils.AuthException e) {
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid format for Customer ID");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "An unexpected error occurred: " + e.getMessage());
        }
    }
}