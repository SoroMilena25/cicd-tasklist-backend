import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import type { Task } from "@prisma/client";

// Mock the service module so the real Express app/routes can be exercised
// end-to-end (HTTP -> routes -> controller) without touching the database.
vi.mock("../../services/task.service.js", () => ({
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
}));

import * as taskService from "../../services/task.service.js";
import app from "../../app.js";

const mockService = vi.mocked(taskService);

const mockTask: Task = {
    id: 1,
    title: "Test Task",
    description: "Test description",
    completed: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("App & routes wiring", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("GET /api/tasks returns the list of tasks", async () => {
        mockService.findAll.mockResolvedValue([mockTask]);

        const res = await request(app).get("/api/tasks");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });

    it("GET /api/tasks/:id returns a single task", async () => {
        mockService.findById.mockResolvedValue(mockTask);

        const res = await request(app).get("/api/tasks/1");

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(1);
    });

    it("POST /api/tasks creates a task using JSON body parsing", async () => {
        mockService.create.mockResolvedValue(mockTask);

        const res = await request(app)
            .post("/api/tasks")
            .send({ title: "New Task" });

        expect(res.status).toBe(201);
        expect(mockService.create).toHaveBeenCalledWith({
            title: "New Task",
            description: undefined,
        });
    });

    it("PUT /api/tasks/:id updates a task", async () => {
        mockService.update.mockResolvedValue({ ...mockTask, title: "Updated" });

        const res = await request(app)
            .put("/api/tasks/1")
            .send({ title: "Updated" });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe("Updated");
    });

    it("DELETE /api/tasks/:id removes a task", async () => {
        mockService.remove.mockResolvedValue(mockTask);

        const res = await request(app).delete("/api/tasks/1");

        expect(res.status).toBe(204);
    });

    it("responds with CORS headers thanks to the cors middleware", async () => {
        mockService.findAll.mockResolvedValue([]);

        const res = await request(app).get("/api/tasks");

        expect(res.headers["access-control-allow-origin"]).toBe("*");
    });
});