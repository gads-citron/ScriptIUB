import * as yup from "yup";
import { Asserts } from "yup";

export const rowSchema = yup.array().of(yup.string().defined()).defined();
export type Row = Asserts<typeof rowSchema>;
