package utils;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AuthRules {
    //Public endPoint
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
            "/api/login",
            "/api/public"
    );
    //Private endPoint (rememeber to map this)
    private static final Map<String, List<String>> ROLE_PATHS;

    static {
        Map<String, List<String>> map = new HashMap<>();

        map.put("/api/manager", Arrays.asList("MANAGER")); 
        map.put("/api/staff", Arrays.asList("MANAGER", "STAFF")); 
        map.put("/api/admin", Arrays.asList("ADMIN"));     
        map.put("/api/EVM", Arrays.asList("EVM","ADMIN"));
        ROLE_PATHS = Collections.unmodifiableMap(map);
    }

    public static boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    public static boolean hasRequiredRole(String path, List<String> roles) {
       return ROLE_PATHS.entrySet().stream()
        .filter(entry -> path.startsWith(entry.getKey()))
        .anyMatch(entry -> roles.stream().anyMatch(entry.getValue()::contains));
    }
}
