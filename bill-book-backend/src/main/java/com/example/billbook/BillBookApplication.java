package com.example.billbook;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan("com.example.billbook.*.mapper")
@SpringBootApplication
public class BillBookApplication {

    public static void main(String[] args) {
        SpringApplication.run(BillBookApplication.class, args);
    }
}
