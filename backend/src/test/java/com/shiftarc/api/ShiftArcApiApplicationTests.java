package com.shiftarc.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.mockito.Mockito.mock;

@ActiveProfiles("test")
@SpringBootTest
@Import(ShiftArcApiApplicationTests.TestDatabaseConfiguration.class)
class ShiftArcApiApplicationTests {

    @Test
    void contextLoads() {
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestDatabaseConfiguration {

        @Bean
        JdbcTemplate jdbcTemplate() {
            return mock(JdbcTemplate.class);
        }
    }
}
