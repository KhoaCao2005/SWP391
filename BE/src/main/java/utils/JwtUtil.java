package utils;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import java.security.Key;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import model.dto.UserAccountDTO;
import model.dto.RoleDTO;

/**
 * Utility class for generating and validating JWT tokens.
 */
public class JwtUtil {

    private static final String SECRET_KEY =
            "DEVKEYWILLCHANGELATERIMTOOLAZYTODOANOTHERFILEREADIMPORTBECAUSEWEDONTHAVETHEDAMNFRAMEWORKFORIT";

    private static final Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

    // Token validity = 1 hour
    private static final long EXPIRATION_MS = 1000 * 60 * 60;

    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_ROLES = "roles";

    /**
     * Generate token directly from UserAccountDTO
     */
    public static String generateToken(UserAccountDTO user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        List<String> roles = new ArrayList<>();
        if (user.getRoles() != null) {
            for (RoleDTO role : user.getRoles()) {
                roles.add(role.getRoleName());
            }
        }

        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim(CLAIM_USER_ID, user.getUserId()) // always include userId
                .claim(CLAIM_ROLES, roles)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Allow manual username + roles + user input
     */
    public static String generateToken(String username, List<String> roles, UserAccountDTO user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        if (roles == null) {
            roles = new ArrayList<>();
        }

        return Jwts.builder()
                .setSubject(username)
                .claim(CLAIM_USER_ID, user.getUserId())
                .claim(CLAIM_ROLES, roles)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Validate and parse token
     */
    public static Jws<Claims> validateToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
        } catch (JwtException e) {
            throw new AuthException("Invalid or expired token");
        }
    }

    public static String extractUsername(String token) {
        return validateToken(token).getBody().getSubject();
    }

    @SuppressWarnings("unchecked")
    public static List<String> extractRoles(String token) {
        return validateToken(token).getBody().get(CLAIM_ROLES, List.class);
    }

    public static int extractUserId(String token) {
        Integer userId = validateToken(token).getBody().get(CLAIM_USER_ID, Integer.class);
        if (userId == null) {
            throw new AuthException("Token does not contain userId");
        }
        return userId;
    }

    public static String extractToken(jakarta.servlet.http.HttpServletRequest req) {
        String authHeader = req.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new AuthException("Missing or invalid Authorization header");
        }
        return authHeader.substring(7);
    }
   public static int extractDealerIdFromDate(String encodedDate) {
        if (encodedDate == null || !encodedDate.contains("_")) {
            return -1;
        }
        
        try {
            String[] parts = encodedDate.split("_");
            return Integer.parseInt(parts[parts.length - 1]);
        } catch (Exception e) {
            return -1;
        }
    }
    

    
    // ========================================================================
    // STATUS ENCODING/DECODING UTILITIES
    // ========================================================================
    
    /**
     * Extract dealer ID from encoded status
     * Format: STATUS_dealerId (e.g., "PENDING_3", "CONFIRMED_5")
     * 
     * @param encodedStatus The encoded status string
     * @return The dealer ID, or -1 if parsing fails
     */
    public static int extractDealerIdFromStatus(String encodedStatus) {
        if (encodedStatus == null || !encodedStatus.contains("_")) {
            return -1;
        }
        
        try {
            String[] parts = encodedStatus.split("_");
            return Integer.parseInt(parts[parts.length - 1]);
        } catch (Exception e) {
            return -1;
        }
    }
    
    /**
     * Extract base status from encoded status
     * Format: STATUS_dealerId (e.g., "PENDING_3" -> "PENDING")
     * 
     * @param encodedStatus The encoded status string
     * @return The base status, or null if parsing fails
     */
    public static String extractBaseStatus(String encodedStatus) {
        if (encodedStatus == null || !encodedStatus.contains("_")) {
            return encodedStatus; // Return as-is if no encoding
        }
        
        try {
            int lastUnderscoreIndex = encodedStatus.lastIndexOf("_");
            return encodedStatus.substring(0, lastUnderscoreIndex);
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Encode status with dealer ID
     * Format: STATUS_dealerId (e.g., "PENDING" + 3 -> "PENDING_3")
     * 
     * @param baseStatus The base status (e.g., "PENDING", "CONFIRMED", "CANCELLED")
     * @param dealerId The dealer ID
     * @return The encoded status string
     */
    public static String encodeStatus(String baseStatus, int dealerId) {
        if (baseStatus == null || baseStatus.trim().isEmpty()) {
            return null;
        }
        return baseStatus + "_" + dealerId;
    }
    
    /**
     * Update status while preserving dealer ID
     * Example: "PENDING_3" with newStatus "CONFIRMED" -> "CONFIRMED_3"
     * 
     * @param currentEncodedStatus Current encoded status
     * @param newBaseStatus New base status to apply
     * @return New encoded status with same dealer ID
     */
    public static String updateStatus(String currentEncodedStatus, String newBaseStatus) {
        int dealerId = extractDealerIdFromStatus(currentEncodedStatus);
        if (dealerId == -1) {
            return newBaseStatus; // No dealer ID found, return base status
        }
        return encodeStatus(newBaseStatus, dealerId);
    }
}
