package model.service;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import model.dao.CustomerDAO;
import model.dao.TestDriveScheduleDAO;
import model.dto.CustomerDTO;
import model.dto.TestDriveScheduleDTO;

public class TestDriveScheduleService {

    private final TestDriveScheduleDAO testDriveScheduleDAO = new TestDriveScheduleDAO();
    private final CustomerDAO customerDAO = new CustomerDAO();

    public TestDriveScheduleDTO createTestDriveSchedule(int customerId, String serialId, String date, String encodedStatus) throws ClassNotFoundException {
        if (customerId <= 0 || serialId == null || serialId.trim().isEmpty()
                || date == null || date.trim().isEmpty() || encodedStatus == null || encodedStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid input parameters for creating test drive schedule.");
        }

        int dealerId = utils.JwtUtil.extractDealerIdFromStatus(encodedStatus);
        if (dealerId == -1) {
            throw new IllegalArgumentException("Status must be encoded with dealer ID (format: STATUS_dealerId)");
        }

        return testDriveScheduleDAO.create(customerId, serialId, date, encodedStatus);
    }

    public List<TestDriveScheduleDTO> getSchedulesByCustomer(int customerId) throws ClassNotFoundException {
        if (customerId <= 0) {
            return new ArrayList<>();
        }
        return testDriveScheduleDAO.retrieve("customer_id = ?", customerId);
    }


    public List<TestDriveScheduleDTO> getTestDriveScheduleByCustomerAndDealer(int customerId, int dealerId) throws ClassNotFoundException {
        if (customerId <= 0 || dealerId <= 0) {
            throw new IllegalArgumentException("Customer ID and Dealer ID must be positive numbers");
        }

        List<TestDriveScheduleDTO> allCustomerSchedules = getSchedulesByCustomer(customerId);
        List<TestDriveScheduleDTO> filteredSchedules = new ArrayList<>();

        for (TestDriveScheduleDTO schedule : allCustomerSchedules) {
            String status = schedule.getStatus();
            if (status != null && status.contains("_")) {
                try {
                    int encodedDealer = Integer.parseInt(status.substring(status.lastIndexOf("_") + 1));
                    if (encodedDealer == dealerId) {
                        filteredSchedules.add(schedule);
                    }
                } catch (NumberFormatException e) {
                    // Skip invalid status format
                }
            }
        }
        return filteredSchedules;
    }


    public TestDriveScheduleDTO updateTestDriveSchedule(int appointmentId, String newStatus) {
        if (appointmentId <= 0 || newStatus == null || newStatus.trim().isEmpty()) {
            return null;
        }
        return testDriveScheduleDAO.updateStatus(appointmentId, newStatus);
    }


    public TestDriveScheduleDTO getTestDriveScheduleById(int appointmentId) {
        if (appointmentId <= 0) {
            throw new IllegalArgumentException("Invalid appointment ID");
        }

        List<TestDriveScheduleDTO> results = testDriveScheduleDAO.retrieve("appointment_id=?", appointmentId);
        return (results != null && !results.isEmpty()) ? results.get(0) : null;
    }


    public List<TestDriveScheduleDTO> getSchedulesByDealer(int dealerId) throws ClassNotFoundException {
        if (dealerId <= 0) return new ArrayList<>();
        return testDriveScheduleDAO.getByDealerId(dealerId);
    }

    public List<TestDriveScheduleDTO> getSchedulesByDealerAndStatus(int dealerId, String baseStatus) throws ClassNotFoundException {
        if (dealerId <= 0 || baseStatus == null || baseStatus.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return testDriveScheduleDAO.getTestDriveSchedulesByDealerAndStatus(dealerId, baseStatus);
    }

    public List<TestDriveScheduleDTO> getSchedulesByDealerAndDateRange(int dealerId, String startDate, String endDate) throws ClassNotFoundException {
        if (dealerId <= 0 || startDate == null || endDate == null) {
            return new ArrayList<>();
        }
        return testDriveScheduleDAO.getTestDriveSchedulesByDealerAndDateRange(dealerId, startDate, endDate);
    }


    public List<CustomerDTO> getAllSchedulesWithCustomers(int dealerId) throws SQLException, ClassNotFoundException {
        List<TestDriveScheduleDTO> schedules = testDriveScheduleDAO.getByDealerId(dealerId);
        List<CustomerDTO> customers = new ArrayList<>();
        for (TestDriveScheduleDTO s : schedules) {
            CustomerDTO c = customerDAO.getCustomerById(s.getCustomerId());
            if (c != null) {
                c.setTestDriveSchedule(s);
                customers.add(c);
            }
        }
        return customers;
    }
}
