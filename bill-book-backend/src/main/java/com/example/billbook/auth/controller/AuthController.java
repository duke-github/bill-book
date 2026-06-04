package com.example.billbook.auth.controller;

import com.example.billbook.auth.dto.LoginResponse;
import com.example.billbook.auth.dto.WechatLoginRequest;
import com.example.billbook.auth.service.AuthService;
import com.example.billbook.common.ApiResponse;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Resource
    private AuthService service;


    @PostMapping("/wechat-login")
    public ApiResponse<LoginResponse> wechatLogin(@Valid @RequestBody WechatLoginRequest request) {
        return ApiResponse.success(service.wechatLogin(request.code()));
    }
}
