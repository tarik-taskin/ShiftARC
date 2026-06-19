package com.shiftarc.api.category;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CategoryControllerTest {

    private static final UUID CATEGORY_ID = UUID.fromString(
        "41000000-0000-0000-0000-000000000001"
    );

    private CategoryService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(CategoryService.class);
        mockMvc = MockMvcBuilders
            .standaloneSetup(new CategoryController(service))
            .setControllerAdvice(new CategoryApiExceptionHandler())
            .build();
    }

    @Test
    void listsAndCreatesCategoriesUsingTheContract() throws Exception {
        CategoryResponse response = response(false, 0);
        when(service.list(false, "ders")).thenReturn(List.of(response));
        when(service.create(any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/categories").param("search", "ders"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Ders"))
            .andExpect(jsonPath("$[0].archived").value(false));

        mockMvc.perform(post("/api/v1/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Ders","color":"#3B82F6","icon":"graduation-cap"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(CATEGORY_ID.toString()));
    }

    @Test
    void updatesArchivesAndRestoresCategories() throws Exception {
        when(service.update(eq(CATEGORY_ID), any())).thenReturn(response(false, 1));
        when(service.restore(CATEGORY_ID, 2)).thenReturn(response(false, 3));

        mockMvc.perform(put("/api/v1/categories/{id}", CATEGORY_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Eğitim","color":"#2563EB","icon":"book-open","version":0}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.version").value(1));

        mockMvc.perform(delete("/api/v1/categories/{id}", CATEGORY_ID)
                .param("version", "1"))
            .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/categories/{id}/restore", CATEGORY_ID)
                .param("version", "2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.version").value(3));
    }

    @Test
    void returnsProblemDetailsForDuplicateNames() throws Exception {
        when(service.create(any())).thenThrow(
            new CategoryConflictException("An active category with this name already exists")
        );

        mockMvc.perform(post("/api/v1/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Ders","color":"#3B82F6","icon":null}
                    """))
            .andExpect(status().isConflict())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.type").value("/problems/category-conflict"));
    }

    private CategoryResponse response(boolean archived, long version) {
        return new CategoryResponse(
            CATEGORY_ID,
            "Ders",
            "#3B82F6",
            "graduation-cap",
            archived,
            version
        );
    }
}
