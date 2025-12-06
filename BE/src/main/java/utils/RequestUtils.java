package utils;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Part;
import java.io.*;
import java.util.*;
import org.json.JSONObject;

public class RequestUtils {

    public static Map<String, Object> extractParams(HttpServletRequest request)
            throws IOException, ServletException {

        Map<String, Object> params = new HashMap<>();
        String contentType = request.getContentType();

        if (contentType == null) {
            return params; // No content type, empty map
        }

        // 🟢 Case 1: JSON input
        if (contentType.contains("application/json")) {
            BufferedReader reader = request.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }

            JSONObject json = new JSONObject(sb.toString());
            for (String key : json.keySet()) {
                params.put(key, json.get(key));
            }
        }

        // 🟡 Case 2: Form fields (URL encoded)
        else if (contentType.contains("application/x-www-form-urlencoded")) {
            Enumeration<String> names = request.getParameterNames();
            while (names.hasMoreElements()) {
                String name = names.nextElement();
                params.put(name, request.getParameter(name));
            }
        }

        // 🔵 Case 3: Multipart (file upload + fields)
        else if (contentType.contains("multipart/form-data")) {
            // Get text fields
            for (Part part : request.getParts()) {
                if (part.getContentType() == null) {
                    // regular form field
                    String value = new BufferedReader(new InputStreamReader(part.getInputStream()))
                            .lines().reduce("", (acc, curr) -> acc + curr);
                    params.put(part.getName(), value);
                } else {
                    // file part
                    params.put(part.getName(), part); // store the Part itself
                }
            }
        }

        return params;
    }
}
