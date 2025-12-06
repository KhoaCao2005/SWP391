package model.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import model.dto.ConfirmationDTO;
import utils.DbUtils;

public class ConfirmationDAO {

    private static final String TABLE_NAME = "Confirmation";

    private ConfirmationDTO mapToConfirmation(ResultSet rs) throws SQLException {
        return new ConfirmationDTO(
                rs.getInt("confirmation_id"),
                rs.getInt("staff_admin_id"),
                rs.getInt("order_detail_id"),
                rs.getString("agreement"),
                rs.getString("date_time")
        );
    }

    public List<ConfirmationDTO> retrieve(String condition, Object... params) throws SQLException, ClassNotFoundException {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ResultSet rs = ps.executeQuery();
            List<ConfirmationDTO> list = new ArrayList<>();
            while (rs.next()) {
                list.add(mapToConfirmation(rs));
            }
            return list;
        }
    }

    public List<ConfirmationDTO> viewConfirmations() throws SQLException, ClassNotFoundException {
        return retrieve("1 = 1");
    }

    public List<ConfirmationDTO> viewConfirmationsByOrderDetailId(int orderDetailId) throws SQLException, ClassNotFoundException {
        return retrieve("order_detail_id = ?", orderDetailId);
    }

    public ConfirmationDTO insert(Connection conn, Integer staff_admin_id, int order_detail_id, String agreement, String date) {
        String sql = "INSERT INTO " + TABLE_NAME + " (staff_admin_id, order_detail_id, agreement, date_time) VALUES(?, ?, ?, ?)";

        try {
            // If connection is null, handle it or throw (depends on your app logic)
            if (conn == null) {
                throw new SQLException("Connection cannot be null");
            }

            try ( PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                if (staff_admin_id == null) {
                    ps.setNull(1, java.sql.Types.INTEGER); // Insert NULL if staff_admin_id is not provided
                } else {
                    ps.setInt(1, staff_admin_id);
                }

                ps.setInt(2, order_detail_id);
                ps.setString(3, agreement);
                ps.setString(4, date);

                int rowsInserted = ps.executeUpdate();
                System.out.println("DEBUG DAO: Rows inserted: " + rowsInserted);

                if (rowsInserted > 0) {
                    try ( ResultSet rs = ps.getGeneratedKeys()) {
                        if (rs.next()) {
                            int confId = rs.getInt(1);
                            ConfirmationDTO confirmation = new ConfirmationDTO(
                                    confId,
                                    staff_admin_id != null ? staff_admin_id : 0, // default 0 if null
                                    order_detail_id,
                                    agreement,
                                    date
                            );
                            System.out.println("DEBUG DAO: Confirmation inserted with ID: " + confId);
                            return confirmation;
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("DEBUG DAO ERROR: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    public ConfirmationDTO insert(Connection conn, int order_detail_id, String agreement, String date) {
        return insert(conn, null, order_detail_id, agreement, date);
    }

    public ConfirmationDTO getConfirmationByOrderDetailId(int id) throws SQLException, ClassNotFoundException {
        List<ConfirmationDTO> results = retrieve("order_detail_id =?", id);
        return results.get(0);
    }

    public ConfirmationDTO updateStatus(int confirmationId, String agreement, int staffAdminId) {
        String updateSql = "UPDATE " + TABLE_NAME + " SET agreement = ?, date_time = ?, staff_admin_id = ? WHERE confirmation_id = ?";

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(updateSql)) {

            String currentDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

            ps.setString(1, agreement);          // Agree / Disagree
            ps.setString(2, currentDate);        // current datetime
            ps.setInt(3, staffAdminId);
            ps.setInt(4, confirmationId);

            if (ps.executeUpdate() > 0) {
                // return updated object
                List<ConfirmationDTO> results = retrieve("confirmation_id = ?", confirmationId);
                if (results != null && !results.isEmpty()) {
                    return results.get(0);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    public int batchInsert(Connection conn, List<ConfirmationDTO> confirmations) throws SQLException {
        if (confirmations == null || confirmations.isEmpty()) {
            return 0;
        }
        String sql = "INSERT INTO Confirmation (staff_admin_id, order_detail_id, agreement, date_time) VALUES (?, ?, ?, ?)";
        try ( PreparedStatement ps = conn.prepareStatement(sql)) {
            for (ConfirmationDTO c : confirmations) {
                ps.setInt(1, c.getUserId());
                ps.setInt(2, c.getOrderDetailId());
                ps.setString(3, c.getAgreement());
                ps.setString(4, c.getDate());
                ps.addBatch();
            }
            int[] results = ps.executeBatch();
            return results.length;
        }
    }

}
