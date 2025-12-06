package model.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import model.dto.TestDriveScheduleDTO;
import utils.DbUtils;

public class TestDriveScheduleDAO {

    private static final String TABLE_NAME = "TestDriveSchedule";

    private TestDriveScheduleDTO mapToTestDriveSchedule(ResultSet rs) throws SQLException {
        return new TestDriveScheduleDTO(
                rs.getInt("appointment_id"),
                rs.getInt("customer_id"),
                rs.getString("serial_id"),
                rs.getString("schedule_at"),
                rs.getString("status")
        );
    }

    public List<TestDriveScheduleDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        List<TestDriveScheduleDTO> list = new ArrayList<>();
        try (Connection conn = DbUtils.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapToTestDriveSchedule(rs));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public TestDriveScheduleDTO create(int customer_id, String serial_id, String scheduleAt, String status) throws ClassNotFoundException {
        int dealerId = utils.JwtUtil.extractDealerIdFromStatus(status);
        
        if (dealerId == -1) {
            System.err.println("Invalid encoded status format: " + status);
            return null;
        }
        
        String checkSql = "SELECT COUNT(*) FROM " + TABLE_NAME 
                        + " WHERE serial_id = ? AND schedule_at = ? AND status = ?";
        
        try (Connection conn = DbUtils.getConnection(); 
             PreparedStatement checkPs = conn.prepareStatement(checkSql)) {
            
            checkPs.setString(1, serial_id);
            checkPs.setString(2, scheduleAt);
            checkPs.setString(3, status);
            
            try (ResultSet rs = checkPs.executeQuery()) {
                if (rs.next() && rs.getInt(1) > 0) {
                    System.out.println("Conflict: Vehicle " + serial_id 
                                     + " already booked at " + scheduleAt 
                                     + " for dealer " + dealerId);
                    return null;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
        
        String insertSql = "INSERT INTO " + TABLE_NAME
                         + " (customer_id, serial_id, schedule_at, status) VALUES (?, ?, ?, ?)";
        
        try (Connection conn = DbUtils.getConnection(); 
             PreparedStatement insertPs = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
            
            insertPs.setInt(1, customer_id);
            insertPs.setString(2, serial_id);
            insertPs.setString(3, scheduleAt);
            insertPs.setString(4, status);
            
            int affectedRows = insertPs.executeUpdate();
            if (affectedRows > 0) {
                try (ResultSet rs = insertPs.getGeneratedKeys()) {
                    if (rs.next()) {
                        return new TestDriveScheduleDTO(
                            rs.getInt(1), 
                            customer_id, 
                            serial_id, 
                            scheduleAt, 
                            status
                        );
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return null;
    }

    public TestDriveScheduleDTO getTestDriveScheduleByCustomerId(int customer_id) {
        List<TestDriveScheduleDTO> results = retrieve("customer_id=?", customer_id);
        return (results != null && !results.isEmpty()) ? results.get(0) : null;
    }

    public List<TestDriveScheduleDTO> getTestDriveSchedulesByDealerId(int dealerId) throws ClassNotFoundException {
        String query = "SELECT * FROM " + TABLE_NAME 
                     + " WHERE status LIKE '%\\_' + ? ESCAPE '\\'";
        
        List<TestDriveScheduleDTO> list = new ArrayList<>();
        
        try (Connection conn = DbUtils.getConnection(); 
             PreparedStatement ps = conn.prepareStatement(query)) {
            
            ps.setString(1, String.valueOf(dealerId));
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapToTestDriveSchedule(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return list;
    }

    public List<TestDriveScheduleDTO> getTestDriveSchedulesByDealerAndStatus(int dealerId, String baseStatus) throws ClassNotFoundException {
        String query = "SELECT * FROM " + TABLE_NAME + " WHERE status = ?";
        
        List<TestDriveScheduleDTO> list = new ArrayList<>();
        
        try (Connection conn = DbUtils.getConnection(); 
             PreparedStatement ps = conn.prepareStatement(query)) {
            
            String encodedStatus = baseStatus + "_" + dealerId;
            ps.setString(1, encodedStatus);
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapToTestDriveSchedule(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return list;
    }

    public List<TestDriveScheduleDTO> getTestDriveSchedulesByDealerAndDateRange(
            int dealerId, String startDate, String endDate) throws ClassNotFoundException {
        
        String query = "SELECT * FROM " + TABLE_NAME 
                     + " WHERE status LIKE '%\\_' + ? ESCAPE '\\'"
                     + " AND schedule_at >= ? AND schedule_at <= ?";
        
        List<TestDriveScheduleDTO> list = new ArrayList<>();
        
        try (Connection conn = DbUtils.getConnection(); 
             PreparedStatement ps = conn.prepareStatement(query)) {
            
            ps.setString(1, String.valueOf(dealerId));
            ps.setString(2, startDate);
            ps.setString(3, endDate);
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapToTestDriveSchedule(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return list;
    }

    public TestDriveScheduleDTO updateStatus(int appointment_id, String status) {
        String updateSql = "UPDATE " + TABLE_NAME + " SET status=? WHERE appointment_id=?";
        try (Connection conn = DbUtils.getConnection(); PreparedStatement ps = conn.prepareStatement(updateSql)) {
            ps.setString(1, status);
            ps.setInt(2, appointment_id);

            if (ps.executeUpdate() > 0) {
                List<TestDriveScheduleDTO> results = retrieve("appointment_id=?", appointment_id);
                if (results != null && !results.isEmpty()) {
                    return results.get(0);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
     public List<TestDriveScheduleDTO> getByDealerId(int dealerId) throws ClassNotFoundException {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE status LIKE ?";
        List<TestDriveScheduleDTO> list = new ArrayList<>();
        try (Connection conn = DbUtils.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, "%_" + dealerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapToTestDriveSchedule(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}