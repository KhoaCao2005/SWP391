/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.function.Consumer;

import json.ApiResponse;

/**
 *
 * @author ACER
 */
public class ResponseUtils {

    private static final ObjectMapper mapper = new ObjectMapper();

    public static <T> void success(HttpServletResponse resp, String message, T data) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        ApiResponse<T> response = new ApiResponse<>("success", message, data);
        mapper.writeValue(resp.getWriter(), response);
    }

    public static void error(HttpServletResponse resp, String message) throws IOException {
        resp.setStatus(HttpServletResponse.SC_BAD_REQUEST); // optional
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        ApiResponse<Object> response = new ApiResponse<>("error", message, null);
        mapper.writeValue(resp.getWriter(), response);
    }

    //Helper For Update
    public <T> void updateIfNotNull(Consumer<T> setter, T newValue) {
        if (newValue != null) {
            setter.accept(newValue);
        }
    }

    public void updateIfNotBlank(Consumer<String> setter, String newValue) {
        if (newValue != null && !newValue.trim().isEmpty()) {
            setter.accept(newValue);
        }
    }

    public static boolean isNullOrEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }
}
