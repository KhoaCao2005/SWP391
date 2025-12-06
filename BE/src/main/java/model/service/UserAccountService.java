/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import model.dao.DealerDAO;
import model.dao.UserAccountDAO;
import model.dto.DealerDTO;
import model.dto.RoleDTO;
import model.dto.UserAccountDTO;

/**
 *
 * @author ACER
 */
public class UserAccountService {

    private final UserAccountDAO UDao = new UserAccountDAO();
    private final DealerDAO dealerDAO = new DealerDAO();

    public UserAccountDTO HandlingLogin(String email, String password) {
        UserAccountDTO user = UDao.login(email, password);

        // FIX: Check for null user immediately after the login attempt.
        if (user == null) {
            return null;
        }

        // Line 21 is now safe because user is guaranteed not to be null
        List<RoleDTO> roles = UDao.getUserRoles(user.getUserId());
        user.setRoles(roles);

        return user;
    }

    public List<String> getAllRoles(UserAccountDTO user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return Collections.singletonList("USER");
        }

        return user.getRoles().stream()
                .map(r -> r.getRoleName())
                .collect(Collectors.toList());
    }

    public UserAccountDTO createDealerAccount(int dealerId, String email, String username, String password, String phoneNumber, int roleId) {
        // Validation
        if (dealerId <= 0) {
            throw new IllegalArgumentException("Invalid dealer ID");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (roleId != 3 && roleId != 2) {
            throw new IllegalArgumentException("Invalid role ID. Use 2 for Manager or 3 for Staff");
        }

        return UDao.createDealerAccount(
                dealerId,
                email.trim(),
                username.trim(),
                password,
                phoneNumber != null ? phoneNumber.trim() : null,
                roleId
        );
    }

    public UserAccountDTO updateDealerAccount(int userId, String email, String username, String phoneNumber, String password, int roleId) {
        if (userId <= 0) {
            throw new IllegalArgumentException("Invalid user ID");
        }

        // Trim non-null values
        String trimmedEmail = email != null ? email.trim() : null;
        String trimmedUsername = username != null ? username.trim() : null;
        String trimmedPhoneNumber = phoneNumber != null ? phoneNumber.trim() : null;

        // Validate that at least one field is being updated
        if (trimmedEmail == null && trimmedUsername == null
                && trimmedPhoneNumber == null && password == null) {
            throw new IllegalArgumentException("At least one field must be provided for update");
        }

        if (roleId != 2 && roleId != 3) {
            throw new IllegalArgumentException("Invalid role ID. Only Manager (2) or Staff (3) are allowed.");
        }

        return UDao.updateDealerAccount(
                userId,
                trimmedEmail,
                trimmedUsername,
                trimmedPhoneNumber,
                password,
                roleId
        );
    }

    public boolean disableDealerAccount(int userId) {
        if (userId <= 0) {
            throw new IllegalArgumentException("Invalid user ID");
        }
        try {
            UserAccountDTO user = UDao.getUserById(userId);
            if (user == null) {
                throw new IllegalArgumentException("User not found");
            }
            if (user.getRoleId() != 2 && user.getRoleId() != 3) {
                throw new IllegalArgumentException("Only dealer accounts (roleId 2 or 3) can be disabled");
            }

            return UDao.setAccountStatus(userId, false);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean enableDealerAccount(int userId) {
        if (userId <= 0) {
            throw new IllegalArgumentException("Invalid user ID");
        }
        try {
            UserAccountDTO user = UDao.getUserById(userId);
            if (user == null) {
                throw new IllegalArgumentException("User not found");
            }
            if (user.getRoleId() != 2 && user.getRoleId() != 3) {
                throw new IllegalArgumentException("Only dealer accounts (roleId 2 or 3) can be enabled");
            }

            return UDao.setAccountStatus(userId, true);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Map<String, Object>> getAllDealerAccounts() {
        List<UserAccountDTO> accounts = UDao.getAllDealerAccounts();
        List<Map<String, Object>> enrichedList = new ArrayList<>();

        if (accounts == null || accounts.isEmpty()) {
            return enrichedList;
        }

        for (UserAccountDTO account : accounts) {
            String dealerName = "Unknown";

            if (account.getDealerId() > 0) {
                DealerDTO dealer = dealerDAO.GetDealerById(account.getDealerId());
                if (dealer != null) {
                    dealerName = dealer.getDealerName();
                }
            }

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("userId", account.getUserId());
            map.put("username", account.getUsername());
            map.put("email", account.getEmail());
            map.put("phoneNumber", account.getPhoneNumber());
            map.put("roleId", account.getRoleId());
            map.put("dealerId", account.getDealerId());
            map.put("dealerName", dealerName);
            map.put("isActive", account.isIsActive());

            enrichedList.add(map);
        }

        return enrichedList;
    }

    public List<UserAccountDTO> getDealerStaffByName(String name) {
        return UDao.searchDealerStaffAndManagerByName(name);
    }

    public UserAccountDTO getDealerStaffById(int id) {
        return UDao.getUserById(id);
    }
}
