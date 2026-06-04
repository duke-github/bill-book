package com.example.billbook.auth.dto;

public record LoginResponse(
        Long userId,
        String openid,
        String token
) {
}
