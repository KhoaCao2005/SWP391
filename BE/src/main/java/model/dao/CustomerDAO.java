package model.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import model.dto.CustomerDTO;
import utils.DbUtils;

public class CustomerDAO {

    private static final String TABLE_NAME = "Customer";
    private static final String INSERT_CUSTOMER = "INSERT INTO " + TABLE_NAME
            + " (name, address, email, phone_number) VALUES (?, ?, ?, ?)";

    private CustomerDTO mapToCustomer(ResultSet rs) throws SQLException {
        return new CustomerDTO(
                rs.getInt("customer_id"),
                rs.getString("name"),
                rs.getString("address"),
                rs.getString("email"),
                rs.getString("phone_number")
        );
    }

    public List<CustomerDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ResultSet rs = ps.executeQuery();
            List<CustomerDTO> list = new ArrayList<>();
            while (rs.next()) {
                list.add(mapToCustomer(rs));
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public int create(Connection conn, CustomerDTO customer) throws SQLException {
        try ( PreparedStatement ps = conn.prepareStatement(INSERT_CUSTOMER, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, customer.getName());
            ps.setString(2, customer.getAddress());
            ps.setString(3, customer.getEmail());
            ps.setString(4, customer.getPhoneNumber());

            int affectedRows = ps.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Creating customer failed, no rows affected.");
            }

            try ( ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    return generatedKeys.getInt(1); // return generated customer_id
                } else {
                    throw new SQLException("Creating customer failed, no ID obtained.");
                }
            }
        }
    }
public CustomerDTO getCustomerById(int customerId) {
    List<CustomerDTO> customers = findById(customerId);
    if (customers != null && !customers.isEmpty()) {
        return customers.get(0); // return the first (and should be only) match
    }
    return null;
}

    public List<CustomerDTO> findByName(String name) {
        return retrieve("name = ?", name);
    }

    public List<CustomerDTO> findById(int customerId) {
        return retrieve("customer_id = ?", customerId);
    }

    public List<CustomerDTO> getAllCustomer() {
        return retrieve("1 = 1");
    }

    public List<CustomerDTO> getCustomersByDealerId(int dealerId) throws SQLException, ClassNotFoundException {
        String sql = "SELECT DISTINCT c.* "
                + "FROM Customer c "
                + "INNER JOIN [Order] o ON c.customer_id = o.customer_id "
                + "INNER JOIN UserAccount u ON o.dealer_staff_id = u.user_id "
                + "WHERE u.dealer_id = ? AND c.customer_id != 0";

        List<CustomerDTO> customers = new ArrayList<>();

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, dealerId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                customers.add(mapToCustomer(rs));
            }
        }

        return customers;
    }

}
