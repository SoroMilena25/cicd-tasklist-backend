import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { vi } from "vitest";
import testPrisma from "./setup.js";

// Mock the prisma singleton to use the test client
vi.mock("../../lib/prisma.js", () => ({
	default: testPrisma,
}));

// Import app AFTER mocking prisma
const { default: app } = await import("../../app.js");
import request from "supertest";

describe("Task API E2E Tests", () => {
	beforeEach(async () => {
		// Clean up database between tests
		await testPrisma.task.deleteMany();
	});

	afterAll(async () => {
		await testPrisma.$disconnect();
	});

	describe("POST /api/tasks", () => {
		it("should create a new task", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "E2E Task", description: "E2E Description" });

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.title).toBe("E2E Task");
			expect(res.body.description).toBe("E2E Description");
			expect(res.body.completed).toBe(false);
		});
	});

	describe("GET /api/tasks", () => {
		it("should return all tasks", async () => {
			await testPrisma.task.createMany({
				data: [
					{ title: "Task 1", description: "Description 1" },
					{ title: "Task 2", description: "Description 2" },
				],
			});	

			const res = await request(app).get("/api/tasks");
			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(2);
		});
	});

	describe("PUT /api/tasks/:id", () => {
		it("should update a task", async () => {
			const createdTask = await testPrisma.task.create({
				data: { title: "Original Title", description: "Original Description" },
			});

			const res = await request(app)
				.put(`/api/tasks/${createdTask.id}`)
				.send({ title: "Updated Title", description: "Updated Description" });

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("Updated Title");
			expect(res.body.description).toBe("Updated Description");
		});
	});

	describe("DELETE /api/tasks/:id", () => {
		it("should delete a task", async () => {
			const createdTask = await testPrisma.task.create({
				data: { title: "Task to Delete", description: "Description" },
			});	

			const res = await request(app).delete(`/api/tasks/${createdTask.id}`);
			expect(res.status).toBe(204);
		});
	});
});

	
