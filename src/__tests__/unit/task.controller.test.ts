import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import type { Task } from "@prisma/client";

// Mock the service module
vi.mock("../../services/task.service.js", () => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

import * as taskService from "../../services/task.service.js";
import * as taskController from "../../controllers/task.controller.js";

const mockService = vi.mocked(taskService);

const mockTask: Task = {
  id: 1,
  title: "Test Task",
  description: "Test description",
  completed: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createMockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    body: {},
    query: {},
    ...overrides,
  } as unknown as Request;
}

describe("TaskController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllTasks", () => {
    it("should return 200 with all tasks", async () => {
      const tasks = [mockTask];
      mockService.findAll.mockResolvedValue(tasks);
      const req = createMockRequest();
      const res = createMockResponse();

      await taskController.getAllTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(tasks);
    });

    it("should return 500 if the service throws", async () => {
      mockService.findAll.mockRejectedValue(new Error("DB error"));
      const req = createMockRequest();
      const res = createMockResponse();

      await taskController.getAllTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch tasks" });
    });
  });

  describe("getTaskById", () => {
    it("should return 200 with a task Id", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      const res = createMockResponse();

      mockService.findById.mockResolvedValue(mockTask);

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    it("should return 404 if not found", async () => {
      const req = createMockRequest({ params: { id: "999" } });
      const res = createMockResponse();

      mockService.findById.mockResolvedValue(null);

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Task not found" });
    });

    it("should return 400 if the id is not a number", async () => {
      const req = createMockRequest({ params: { id: "abc" } });
      const res = createMockResponse();

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid task ID" });
      expect(mockService.findById).not.toHaveBeenCalled();
    });

    it("should return 500 if the service throws", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      const res = createMockResponse();

      mockService.findById.mockRejectedValue(new Error("DB error"));

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch task" });
    });
  });

  describe("createTask", () => {
    it("should return 200 with a creation task", async () => {
      const req = createMockRequest({
        body: { title: "New Task", description: "New description" },
      });
      const res = createMockResponse();

      mockService.create.mockResolvedValue(mockTask);

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    it("should return 400 if title is missing", async () => {
      const req = createMockRequest({ body: { description: "No title" } });
      const res = createMockResponse();

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Title is required and must be a non-empty string",
      });
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it("should return 400 if title is an empty string", async () => {
      const req = createMockRequest({ body: { title: "   " } });
      const res = createMockResponse();

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it("should return 500 if the service throws", async () => {
      const req = createMockRequest({ body: { title: "New Task" } });
      const res = createMockResponse();

      mockService.create.mockRejectedValue(new Error("DB error"));

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to create task" });
    });
  });

  describe("updateTask", () => {
    it("should return 200 with the updated task", async () => {
      const req = createMockRequest({
        params: { id: "1" },
        body: { title: "Updated title" },
      });
      const res = createMockResponse();

      mockService.update.mockResolvedValue({ ...mockTask, title: "Updated title" });

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ...mockTask, title: "Updated title" });
    });

    it("should return 400 if the id is not a number", async () => {
      const req = createMockRequest({ params: { id: "abc" }, body: {} });
      const res = createMockResponse();

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid task ID" });
      expect(mockService.update).not.toHaveBeenCalled();
    });

    it("should return 404 if the task does not exist", async () => {
      const req = createMockRequest({ params: { id: "999" }, body: {} });
      const res = createMockResponse();

      mockService.update.mockRejectedValue(new Error("Task not found"));

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Task not found" });
    });

    it("should return 500 if the service throws an unexpected error", async () => {
      const req = createMockRequest({ params: { id: "1" }, body: {} });
      const res = createMockResponse();

      mockService.update.mockRejectedValue(new Error("DB error"));

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to update task" });
    });
  });

  describe("deleteTask", () => {
    it("should return 200 with a deleted task", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      const res = createMockResponse();

      mockService.remove.mockResolvedValue(mockTask);

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 400 if the id is not a number", async () => {
      const req = createMockRequest({ params: { id: "abc" } });
      const res = createMockResponse();

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid task ID" });
      expect(mockService.remove).not.toHaveBeenCalled();
    });

    it("should return 404 if the task does not exist", async () => {
      const req = createMockRequest({ params: { id: "999" } });
      const res = createMockResponse();

      mockService.remove.mockRejectedValue(new Error("Task not found"));

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Task not found" });
    });

    it("should return 500 if the service throws an unexpected error", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      const res = createMockResponse();

      mockService.remove.mockRejectedValue(new Error("DB error"));

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to delete task" });
    });
  });
});