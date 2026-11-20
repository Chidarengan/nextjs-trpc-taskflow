import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import { z } from 'zod';
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from '@/server/db/tasks';

export const createTRPCContext = cache(async () => {
  return {};
});

const t = initTRPC.create();

const taskPayloadSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, 'Task title is required and cannot be blank.')
    .max(120, 'Task title must be 120 characters or fewer.'),
  descricao: z
    .string()
    .trim()
    .max(1000, 'Description must be 1,000 characters or fewer.')
    .optional(),
});

export const appRouter = t.router({
  task: t.router({
    list: t.procedure
      .input(
        z
          .object({
            limit: z.number().int().min(1).max(50).default(8),
            cursor: z.string().optional(),
          })
          .optional()
      )
      .query(({ input }) => {
        return listTasks({
          limit: input?.limit ?? 8,
          cursor: input?.cursor,
        });
      }),

    getById: t.procedure
      .input(
        z.object({
          id: z.string().trim().min(1, 'Task ID is required.'),
        })
      )
      .query(({ input }) => {
        const task = getTaskById(input.id);
        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Task with ID "${input.id}" was not found.`,
          });
        }
        return task;
      }),

    create: t.procedure.input(taskPayloadSchema).mutation(({ input }) => {
      return createTask({
        titulo: input.titulo,
        descricao: input.descricao,
      });
    }),

    update: t.procedure
      .input(
        taskPayloadSchema.extend({
          id: z.string().trim().min(1, 'Task ID is required.'),
        })
      )
      .mutation(({ input }) => {
        const updated = updateTask(input.id, {
          titulo: input.titulo,
          descricao: input.descricao,
        });

        if (!updated) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Cannot update: task not found or already deleted.',
          });
        }

        return updated;
      }),

    delete: t.procedure
      .input(
        z.object({
          id: z.string().trim().min(1, 'Task ID is required.'),
        })
      )
      .mutation(({ input }) => {
        const removed = deleteTask(input.id);

        if (!removed) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Cannot delete: task not found or already deleted.',
          });
        }

        return { id: input.id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
export const createCaller = t.createCallerFactory(appRouter);