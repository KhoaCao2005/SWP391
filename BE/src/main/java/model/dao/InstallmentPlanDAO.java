package model.dao;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import model.dto.InstallmentPlanDTO;
import utils.DbUtils;

public class InstallmentPlanDAO {

    private static final String TABLE_NAME = "InstallmentPlan";

    private InstallmentPlanDTO mapToInstallmentPlan(ResultSet rs) throws SQLException {
        return new InstallmentPlanDTO(
                rs.getInt("plan_id"),
                rs.getInt("payment_id"),
                rs.getString("interest_rate"),
                rs.getString("term_month"),
                rs.getString("monthly_pay"),
                rs.getString("status")
        );
    }

    public List<InstallmentPlanDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ResultSet rs = ps.executeQuery();
            List<InstallmentPlanDTO> list = new ArrayList<>();
            while (rs.next()) {
                list.add(mapToInstallmentPlan(rs));
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public InstallmentPlanDTO create(InstallmentPlanDTO plan) throws ClassNotFoundException {
        String sql = "INSERT INTO " + TABLE_NAME
                + " (payment_id, interest_rate, term_month, monthly_pay, status) VALUES (?, ?, ?, ?, ?)";
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, plan.getPaymentId());
            ps.setDouble(2, Double.parseDouble(plan.getInterestRate()));
            ps.setInt(3, Integer.parseInt(plan.getTermMonth()));
            ps.setDouble(4, Double.parseDouble(plan.getMonthlyPay()));
            ps.setString(5, plan.getStatus());

            int affectedRows = ps.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Creating installment plan failed, no rows affected.");
            }

            try ( ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    plan.setPlanId(rs.getInt(1));
                }
            }

            return plan;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean updateStatus(InstallmentPlanDTO plan) throws ClassNotFoundException {
        String sql = "UPDATE " + TABLE_NAME + " SET status = ?, term_month = ? WHERE plan_id = ?";
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, plan.getStatus());
            ps.setString(2, plan.getTermMonth());
            ps.setInt(3, plan.getPlanId());

            int affected = ps.executeUpdate();
            return affected > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<InstallmentPlanDTO> getInstallmentPlansListByPayMentId(int paymentId) {
        return retrieve("payment_id=?", paymentId);
    }

    public List<InstallmentPlanDTO> getAllInstallmentPlans() {
        return retrieve("1 = 1");
    }

    public InstallmentPlanDTO findByPaymentId(int paymentId) {
        List<InstallmentPlanDTO> list = retrieve("payment_id = ?", paymentId);
        return list.get(0);
    }

    public List<InstallmentPlanDTO> getActiveOrOverduePlans() {
        return retrieve("status IN (?, ?)", "ACTIVE", "OVERDUE");
    }

    public InstallmentPlanDTO findById(int planId) {
        List<InstallmentPlanDTO> list = retrieve("plan_id = ?", planId);
        return list.get(0);
    }

}
