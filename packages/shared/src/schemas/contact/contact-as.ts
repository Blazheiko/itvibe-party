import { type } from "@arktype/type";
import { NonEmptyStringSchema, TimestampSchema } from "../../brands/index.js";

// Схема для валидации телефона (строка от 10 до 20 символов)
const PhoneSchema = type(/^.{10,20}$/).brand("Phone");
const MessageSchema = type("string >= 1");

// Полная схема Contact As (для типов и валидации полных объектов)
export const ContactAsSchema = type({
  id: "number.integer > 0",
  name: NonEmptyStringSchema,
  phone: PhoneSchema,
  message: MessageSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export type ContactAs = typeof ContactAsSchema.infer;

// Схема для входных данных при создании Contact As
export const CreateContactAsInputSchema = type({
  name: NonEmptyStringSchema,
  phone: PhoneSchema,
  message: MessageSchema,
  "+": "reject",
});

export type CreateContactAsInput = typeof CreateContactAsInputSchema.infer;

// Схема для обновления Contact As (все поля опциональны, кроме id)
export const UpdateContactAsInputSchema = type({
  "name?": NonEmptyStringSchema,
  "phone?": PhoneSchema,
  "message?": MessageSchema,
  "+": "reject",
});

export type UpdateContactAsInput = typeof UpdateContactAsInputSchema.infer;
