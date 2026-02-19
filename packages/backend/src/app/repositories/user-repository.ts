import { db } from "#database/db.js";
import { users } from "#database/schema.js";
import { and, eq, ne } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type UserRow = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;
export type UserUpdate = Partial<
  Pick<UserInsert, "name" | "email" | "password" | "phone">
>;

export interface IUserRepository {
  create(data: UserInsert): Promise<UserRow>;
  findById(id: bigint): Promise<UserRow | undefined>;
  findByEmail(email: string): Promise<UserRow | undefined>;
  findByPhone(phone: string): Promise<UserRow | undefined>;
  phoneExistsForOtherUser(phone: string, excludeId: bigint): Promise<boolean>;
  update(id: bigint, data: UserUpdate): Promise<UserRow | undefined>;
  delete(id: bigint): Promise<boolean>;
}

export const userRepository: IUserRepository = {
  async create(data) {
    const now = new Date();
    const [result] = await db.insert(users).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    const created = await db
      .select()
      .from(users)
      .where(eq(users.id, BigInt(result.insertId)))
      .limit(1)
      .then((rows) => rows.at(0));
    if (created === undefined) {
      throw new Error("Failed to create user");
    }
    return created;
  },

  async findById(id) {
    return await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .then((rows) => rows.at(0));
  },

  async findByEmail(email) {
    return await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows.at(0));
  },

  async findByPhone(phone) {
    return await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1)
      .then((rows) => rows.at(0));
  },

  async phoneExistsForOtherUser(phone, excludeId) {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.phone, phone), ne(users.id, excludeId)))
      .limit(1);
    return result.length > 0;
  },

  async update(id, data) {
    await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id));
    return userRepository.findById(id);
  },

  async delete(id) {
    const result = await db.delete(users).where(eq(users.id, id));
    return result[0].affectedRows > 0;
  },
};
