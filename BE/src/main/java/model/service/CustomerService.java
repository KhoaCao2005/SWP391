/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.service;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import model.dao.CustomerDAO;
import model.dto.CustomerDTO;
import utils.DbUtils;

/**
 *
 * @author Admin
 */
public class CustomerService {

    private CustomerDAO customerDAO = new CustomerDAO();

    public int HandlingCreateCustomer(String name, String address, String email, String phoneNumber) {
        Connection conn = null;
        try {
            conn = DbUtils.getConnection();
            conn.setAutoCommit(false);

            // Validate inputs
            if (name == null || name.trim().isEmpty()) {
                throw new IllegalArgumentException("Name is required");
            }
            if (email == null || email.trim().isEmpty()) {
                throw new IllegalArgumentException("Email is required");
            }

            CustomerDTO customer = new CustomerDTO();
            customer.setName(name);
            customer.setAddress(address);
            customer.setEmail(email);
            customer.setPhoneNumber(phoneNumber);

            int customerId = customerDAO.create(conn, customer);
            if (customerId <= 0) {
                throw new SQLException("Failed to create customer");
            }

            conn.commit();
            return customerId;

        } catch (Exception e) {
            e.printStackTrace();
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException ex) {
                    ex.printStackTrace();
                }
            }
            return -1;
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public List<CustomerDTO> getAll() {
        return customerDAO.getAllCustomer();
    }

    // In CustomerService.java
    public List<CustomerDTO> getCustomersByDealer(int dealerId) {
        try {
            // Validate dealer ID
            if (dealerId <= 0) {
                throw new IllegalArgumentException("Invalid dealer ID: " + dealerId);
            }

            // Call DAO method
            List<CustomerDTO> customers = customerDAO.getCustomersByDealerId(dealerId);

            // Optional: Add business logic here
            // For example, sort customers by name
            customers.sort((c1, c2) -> c1.getName().compareTo(c2.getName()));

            return customers;

        } catch (SQLException e) {
            // Log the error
            System.err.println("Database error while fetching customers for dealer " + dealerId);
            e.printStackTrace();
            throw new RuntimeException("Failed to retrieve customers", e);

        } catch (ClassNotFoundException e) {
            System.err.println("Database driver not found");
            e.printStackTrace();
            throw new RuntimeException("Database configuration error", e);
        }
    }
}
