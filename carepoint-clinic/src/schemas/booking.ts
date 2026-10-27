import { z } from "zod";

export const SlotSchema = z.object({
    id: z.string(),
    provider: z.string(),
    start: z.string(),
    end: z.string(),
    available: z.boolean(),
});

export const BookingSchema = z.object({
    id: z.string(),
    slot_id: z.string(),
    name: z.string(),
    email: z.string().email(),
    status: z.enum(["confirmed", "cancelled"]),
    created_at: z.string(),
});

export type Slot = z.infer<typeof SlotSchema>;
export type Booking = z.infer<typeof BookingSchema>;