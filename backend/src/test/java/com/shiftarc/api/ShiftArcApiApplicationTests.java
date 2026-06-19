package com.shiftarc.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.shiftarc.api.workspace.WorkspaceRepository;
import com.shiftarc.api.workspace.WorkspaceSettingsRepository;
import com.shiftarc.api.category.CategoryRepository;

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

        @Bean
        JdbcClient jdbcClient() {
            return mock(JdbcClient.class);
        }

        @Bean
        WorkspaceRepository workspaceRepository() {
            return mock(WorkspaceRepository.class);
        }

        @Bean
        WorkspaceSettingsRepository workspaceSettingsRepository() {
            return mock(WorkspaceSettingsRepository.class);
        }

        @Bean
        CategoryRepository categoryRepository() {
            return mock(CategoryRepository.class);
        }
    }
}
