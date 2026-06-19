package com.shiftarc.api.dailyplan;

import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/daily-plan/today")
public class DailyPlanController {
    private final DailyPlanService service;

    DailyPlanController(DailyPlanService service) {
        this.service = service;
    }

    @GetMapping
    DailyPlanResponse today() {
        return service.today();
    }

    @PostMapping("/regenerate")
    DailyPlanResponse regenerate(@RequestParam @PositiveOrZero long version) {
        return service.regenerate(version);
    }
}
