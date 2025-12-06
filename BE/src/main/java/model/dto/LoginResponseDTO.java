/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.dto;

/**
 *
 * @author ACER
 */
public class LoginResponseDTO {
      private UserAccountDTO user;
    private String token;

    public LoginResponseDTO(UserAccountDTO user, String token) {
        this.user = user;
        this.token = token;
    }

    public UserAccountDTO getUser() {
        return user;
    }

    public void setUser(UserAccountDTO user) {
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
    
}
