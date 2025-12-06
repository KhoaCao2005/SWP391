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
import model.dto.TestDriveScheduleDTO;
import model.dto.UserAccountDTO;
import model.service.TestDriveScheduleService;
import model.service.UserAccountService;
import utils.JwtUtil;
import utils.RequestUtils;
import utils.ResponseUtils;

@WebServlet("/api/staff/getTestDriveScheduleByCustomer")
public class GetTestDriveScheduleByCustomerAndDealerController extends HttpServlet {
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

            int dealerId = staff.getDealerId();
            if (dealerId <= 0) {
                ResponseUtils.error(resp, "No dealer associated with this staff account");
                return;
            }

          
            Map<String, Object> params = RequestUtils.extractParams(req);
            Object customerIdObj = params.get("customer_id");

            if (customerIdObj == null) {
                ResponseUtils.error(resp, "Customer ID is required");
                return;
            }

            int customerId;
            try {
                customerId = Integer.parseInt(customerIdObj.toString());
            } catch (NumberFormatException e) {
                ResponseUtils.error(resp, "Invalid customer ID format");
                return;
            }

            if (customerId <= 0) {
                ResponseUtils.error(resp, "Invalid customer ID");
                return;
            }

            List<TestDriveScheduleDTO> customerSchedules =
                    testDriveScheduleService.getSchedulesByCustomer(customerId);

            if (customerSchedules == null || customerSchedules.isEmpty()) {
                ResponseUtils.error(resp, "No test drive schedules found for this customer");
                return;
            }

          
            List<TestDriveScheduleDTO> dealerSchedules = new ArrayList<>();
            for (TestDriveScheduleDTO s : customerSchedules) {
                String status = s.getStatus();
                if (status == null || !status.contains("_")) continue;
                try {
                    int encodedDealer = Integer.parseInt(status.substring(status.lastIndexOf("_") + 1));
                    if (encodedDealer == dealerId) {
                        dealerSchedules.add(s);
                    }
                } catch (NumberFormatException e) {
                   
                }
            }

            if (dealerSchedules.isEmpty()) {
                ResponseUtils.error(resp, "No schedules found for this customer under your dealership");
                return;
            }

           
            ResponseUtils.success(resp, "Test drive schedules retrieved successfully", dealerSchedules);

        } catch (utils.AuthException e) {
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "An error occurred while retrieving test drive schedules: " + e.getMessage());
        }
    }
}
