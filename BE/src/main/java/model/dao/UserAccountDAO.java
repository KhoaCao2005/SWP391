package model.dao;

import java.sql.*;
import java.util.*;
import model.dto.RoleDTO;
import model.dto.UserAccountDTO;
import utils.DbUtils;

public class UserAccountDAO {

    private static final String TABLE_NAME = "[UserAccount]";
    private static final String USER_ROLE_TABLE = "[UserRole]";
    private static final String SEARCH_SQL
            = "SELECT u.user_id, u.dealer_id, u.username, u.email, u.phone_number "
            + "FROM UserAccount u JOIN UserRole ur ON u.user_id = ur.user_id "
            + "WHERE ur.role_id in (1,2) AND u.username LIKE ?";

    private UserAccountDTO mapToUser(ResultSet rs) throws SQLException {
        return new UserAccountDTO(
                rs.getInt("user_id"),
                rs.getInt("role_id"),
                rs.getInt("dealer_id"),
                rs.getString("email"),
                rs.getString("username"),
                rs.getString("phone_number"),
                rs.getBoolean("is_active")
        );
    }

    public List<UserAccountDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ResultSet rs = ps.executeQuery();
            List<UserAccountDTO> list = new ArrayList<>();
            while (rs.next()) {
                list.add(mapToUser(rs));
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public UserAccountDTO getUserById(int userId) {
        List<UserAccountDTO> users = retrieve("user_id=?", userId);
        return (users != null && !users.isEmpty()) ? users.get(0) : null;
    }

    public List<UserAccountDTO> getAllDealerAccounts() {
        List<UserAccountDTO> list = retrieve("dealer_id IS NOT NULL AND dealer_id > 0");
        return list != null ? list : new ArrayList<>();
    }

    public List<UserAccountDTO> findUserByDealerId(int dealerId) {
        return retrieve("dealer_id = ?", dealerId);
    }

    public List<RoleDTO> getUserRoles(int userId) {
        List<RoleDTO> roles = new ArrayList<>();
        String sql = "SELECT r.role_id, r.role_name FROM Role r "
                + "JOIN UserRole ur ON r.role_id = ur.role_id WHERE ur.user_id = ?";
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                roles.add(new RoleDTO(rs.getInt("role_id"), rs.getString("role_name")));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return roles;
    }

    public UserAccountDTO login(String email, String password) {
        List<UserAccountDTO> users = retrieve("email = ? AND password = ? AND is_active = 1", email, password);
        return (users != null && !users.isEmpty()) ? users.get(0) : null;
    }

    public List<UserAccountDTO> searchDealerStaffAndManagerByName(String name) {
        List<UserAccountDTO> list = new ArrayList<>();
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(SEARCH_SQL)) {
            ps.setString(1, "%" + name.trim() + "%");
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(mapToUser(rs));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Integer> getStaffIdsByDealer(int dealerId) throws ClassNotFoundException, SQLException {
        List<Integer> staffIds = new ArrayList<>();
        String sql = "SELECT user_id FROM UserAccount WHERE dealer_id = ?";
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, dealerId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                staffIds.add(rs.getInt("user_id"));
            }
        }
        return staffIds;
    }

    public UserAccountDTO createDealerAccount(int dealerId, String email, String username,
            String password, String phoneNumber, int roleId) {
        String insertUserSql = "INSERT INTO " + TABLE_NAME
                + " (role_id, dealer_id, email, username, password, phone_number, is_active) "
                + "VALUES (?, ?, ?, ?, ?, ?, 1)";
        String insertRoleSql = "INSERT INTO " + USER_ROLE_TABLE
                + " (user_id, role_id) VALUES (?, ?)";

        Connection conn = null;
        PreparedStatement psUser = null;
        PreparedStatement psRole = null;
        ResultSet generatedKeys = null;
        int userId = -1;

        try {
            conn = DbUtils.getConnection();
            conn.setAutoCommit(false); // Start transaction

            // Insert user account
            psUser = conn.prepareStatement(insertUserSql, PreparedStatement.RETURN_GENERATED_KEYS);
            psUser.setInt(1, roleId);      // ✅ FIXED: role_id first
            psUser.setInt(2, dealerId);
            psUser.setString(3, email);
            psUser.setString(4, username);
            psUser.setString(5, password);
            psUser.setString(6, phoneNumber);

            int affectedRows = psUser.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Creating user failed, no rows affected.");
            }

            // Get generated user_id
            generatedKeys = psUser.getGeneratedKeys();
            if (generatedKeys.next()) {
                userId = generatedKeys.getInt(1);
            } else {
                throw new SQLException("Creating user failed, no ID obtained.");
            }

            // Insert user role (optional, if you also store mapping in UserRole)
            psRole = conn.prepareStatement(insertRoleSql);
            psRole.setInt(1, userId);
            psRole.setInt(2, roleId);
            psRole.executeUpdate();

            conn.commit(); // Commit transaction

            UserAccountDTO createdUser = new UserAccountDTO();
            createdUser.setUserId(userId);
            createdUser.setDealerId(dealerId);
            createdUser.setEmail(email);
            createdUser.setUsername(username);
            createdUser.setPhoneNumber(phoneNumber);
            createdUser.setRoleId(roleId);
            return createdUser;

        } catch (Exception e) {
            if (conn != null) {
                try {
                    conn.rollback(); // Rollback on error
                } catch (SQLException ex) {
                    ex.printStackTrace();
                }
            }
            e.printStackTrace();
            return null;
        } finally {
            try {
                if (generatedKeys != null) {
                    generatedKeys.close();
                }
                if (psRole != null) {
                    psRole.close();
                }
                if (psUser != null) {
                    psUser.close();
                }
                if (conn != null) {
                    conn.setAutoCommit(true);
                    conn.close();
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    public UserAccountDTO updateDealerAccount(int userId, String email, String username,
            String phoneNumber, String password, int roleId) {

        String updateUserSql = "UPDATE " + TABLE_NAME
                + " SET email = ?, username = ?, phone_number = ?, password = ?, role_id = ? "
                + "WHERE user_id = ?";
        String updateRoleSql = "UPDATE " + USER_ROLE_TABLE + " SET role_id = ? WHERE user_id = ?";

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement psUser = conn.prepareStatement(updateUserSql);  PreparedStatement psRole = conn.prepareStatement(updateRoleSql)) {

            conn.setAutoCommit(false);

            // Update user info
            psUser.setString(1, email);
            psUser.setString(2, username);
            psUser.setString(3, phoneNumber);
            psUser.setString(4, password);
            psUser.setInt(5, roleId);
            psUser.setInt(6, userId);
            psUser.executeUpdate();

            // Update role
            psRole.setInt(1, roleId);
            psRole.setInt(2, userId);
            psRole.executeUpdate();

            conn.commit();
            return getUserById(userId);

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public boolean setAccountStatus(int userId, boolean isActive) {
        String sql = "UPDATE " + TABLE_NAME + " SET is_active = ? WHERE user_id = ?";

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setBoolean(1, isActive);
            ps.setInt(2, userId);

            int rowsAffected = ps.executeUpdate();
            return rowsAffected > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

}
