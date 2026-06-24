import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Task } from "@prisma/client";

// Mock the prisma module before importing the service
vi.mock("../../lib/prisma.js", () => {
	return {
		default: {
			task: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
			},
		},
	};
});

import prisma from "../../lib/prisma.js";
import * as taskService from "../../services/task.service.js";

const mockPrisma = vi.mocked(prisma);

const mockTask: Task = {
	id: 1,
	title: "Test Task",
	description: "A test task description",
	completed: false,
	createdAt: new Date("2026-01-01T00:00:00.000Z"),
	updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("TaskService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findAll", () => {
		it("should return all tasks ordered by createdAt desc", async () => {
			const tasks = [mockTask];
			(mockPrisma.task.findMany as any).mockResolvedValue(tasks);

			const result = await taskService.findAll();

			expect(result).toEqual(tasks);
			expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
				orderBy: { createdAt: "desc" },
			});
		});
	});

	describe("findById", () => {
		it("should return a task by its ID", async () => {
			(mockPrisma.task.findUnique as any).mockResolvedValue(mockTask);

			const result = await taskService.findById(1);

			expect(result).toEqual(mockTask);
			expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
			});
		});
	});

	describe("create", () => {
    it("should create a new task", async () => {
      const newTaskData = {
        title: "New Task",
        description: "New Description",
      };

      (mockPrisma.task.create as any).mockResolvedValue(mockTask);

      const result = await taskService.create(newTaskData);

      expect(result).toEqual(mockTask);
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: newTaskData,
      });
    });
  });
  
  describe("update", () => {
  it("should update an existing task", async () => {
    const updatedData = {
      title: "Updated Task",
      description: "Updated Description",
    };

    (mockPrisma.task.findUnique as any).mockResolvedValue(mockTask);
    (mockPrisma.task.update as any).mockResolvedValue({
      ...mockTask,
      ...updatedData,
    });

    const result = await taskService.update(1, updatedData);

    expect(result).toEqual({
      ...mockTask,
      ...updatedData,
    });
    expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: updatedData,
    });
  });
});
	
	describe("remove", () => {
    it("should delete an existing task", async () => {
      (mockPrisma.task.findUnique as any).mockResolvedValue(mockTask);
      (mockPrisma.task.delete as any).mockResolvedValue(mockTask);

      const result = await taskService.remove(1);

      expect(result).toEqual(mockTask);
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
			

});
