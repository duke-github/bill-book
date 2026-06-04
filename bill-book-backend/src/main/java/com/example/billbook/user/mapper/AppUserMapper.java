package com.example.billbook.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.billbook.user.entity.AppUserEntity;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

@Component
public interface AppUserMapper extends BaseMapper<AppUserEntity> {
}
