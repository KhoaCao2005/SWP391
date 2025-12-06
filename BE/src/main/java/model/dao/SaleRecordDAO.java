package model.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.text.SimpleDateFormat;
import java.text.ParseException;
import java.math.BigDecimal;

import model.dto.SaleRecordDTO;
import utils.DbUtils;

public class SaleRecordDAO {

    private static final String TABLE_NAME = "SaleRecord";
    private static final String DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

    private static final String CREATE_SQL
            = "INSERT INTO " + TABLE_NAME
            + " (customer_id, dealer_id, dealer_staff_id, sale_date, sale_amount) "
            + " VALUES (?, ?, ?, ?, ?)";

    private SaleRecordDTO mapToSaleRecord(ResultSet rs) throws SQLException {
        String saleDateString = null;
        Timestamp dbTimestamp = rs.getTimestamp("sale_date");

        if (dbTimestamp != null) {
            saleDateString = new SimpleDateFormat(DATE_FORMAT).format(dbTimestamp);
        }

        return new SaleRecordDTO(
                rs.getInt("sale_id"),
                rs.getInt("dealer_staff_id"),
                saleDateString,
                rs.getBigDecimal("sale_amount") // BigDecimal here
        );
    }

    public SaleRecordDTO create(int dealerId, int dealerStaffId, String saleDate, BigDecimal saleAmount) throws ClassNotFoundException {
        Timestamp saleTimestamp = null;

        try {
            java.util.Date utilDate = new SimpleDateFormat(DATE_FORMAT).parse(saleDate);
            saleTimestamp = new Timestamp(utilDate.getTime());

            try (Connection conn = DbUtils.getConnection();
                 PreparedStatement ps = conn.prepareStatement(CREATE_SQL, Statement.RETURN_GENERATED_KEYS)) {

                ps.setInt(1, dealerId);
                ps.setInt(2, dealerStaffId);
                ps.setTimestamp(3, saleTimestamp);
                ps.setBigDecimal(4, saleAmount); // Use setBigDecimal

                int affectedRows = ps.executeUpdate();

                if (affectedRows > 0) {
                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (rs.next()) {
                            int generatedId = rs.getInt(1);
                            return new SaleRecordDTO(
                                    generatedId,
                                    dealerStaffId,
                                    saleDate,
                                    saleAmount
                            );
                        }
                    }
                }
            }
        } catch (ParseException | SQLException e) {
            e.printStackTrace();
        }

        return null;
    }

    public List<SaleRecordDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        List<SaleRecordDTO> list = new ArrayList<>();
        try (Connection conn = DbUtils.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapToSaleRecord(rs));
                }
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<SaleRecordDTO> findSaleRecordByDealerStaffId(int dealerStaffId) {
        return retrieve("dealer_staff_id = ?", dealerStaffId);
    }
}
