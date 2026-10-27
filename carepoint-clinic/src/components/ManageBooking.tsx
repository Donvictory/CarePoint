
import { useState, type FormEvent } from "react";
import {
    fetchBookingsByEmail,
    cancelBooking,
    toApiErrorInfo,
} from "../services/api";
import type { ApiErrorInfo, Booking } from "../types/booking";

interface Props {
    onClose: () => void;
    onBookingUpdated: () => void;
}

export default function ManageBooking({
    onClose,
    onBookingUpdated,
}: Props) {
    const [email, setEmail] = useState("");
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);

    async function handleLookup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            setError("Enter your email address to continue.");
            setBookings([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setError(null);
        setCancelError(null);
        setBookings([]);
        setSearched(false);

        try {
            const result = await fetchBookingsByEmail(cleanEmail);

            setBookings(result);
            setSearched(true);

            if (result.length === 0) {
                setError("No bookings found for this email.");
            }
        } catch (err) {
            const info: ApiErrorInfo = toApiErrorInfo(err);
            setError(info.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel(booking: Booking) {
        if (booking.status !== "confirmed") return;

        const shouldCancel = window.confirm(
            "Are you sure you want to cancel this appointment?",
        );

        if (!shouldCancel) return;

        setCancellingId(booking.id);
        setCancelError(null);

        try {
            await cancelBooking(booking.id, booking.email);

            setBookings((current) =>
                current.map((item) =>
                    item.id === booking.id
                        ? { ...item, status: "cancelled" }
                        : item,
                ),
            );

            onBookingUpdated();
        } catch (err) {
            const info = toApiErrorInfo(err);
            setCancelError(info.message);
        } finally {
            setCancellingId(null);
        }
    }

    return (
        <section
            aria-labelledby="manage-booking-heading"
            className="mx-auto max-w-xl rounded-xl border border-border-default bg-surface-raised p-5 sm:p-8"
        >
            <button
                type="button"
                onClick={onClose}
                className="mb-6 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
                ← Back to appointments
            </button>

            <h1
                id="manage-booking-heading"
                className="text-2xl font-semibold text-text-primary sm:text-3xl"
            >
                Manage Bookings
            </h1>

            <p className="mt-2 text-sm leading-6 text-text-secondary">
                Enter the email address you used when booking to view your
                appointments or cancel a confirmed appointment.
            </p>

            <form onSubmit={handleLookup} className="mt-6 space-y-4">
                <div>
                    <label
                        htmlFor="booking-email"
                        className="mb-2 block text-sm font-medium text-text-primary"
                    >
                        Email address
                    </label>

                    <input
                        id="booking-email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Enter your booking email"
                        autoComplete="email"
                        required
                        className="min-h-12 w-full rounded-lg border border-border-default bg-surface-base px-4 text-text-primary outline-none focus:border-text-secondary"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-secondary min-h-12 w-full px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Finding your bookings..." : "Find my bookings"}
                </button>
            </form>

            {error && (
                <p
                    role="alert"
                    className="mt-4 rounded-lg border border-notice-border bg-notice-bg p-3 text-sm text-text-primary"
                >
                    {error}
                </p>
            )}

            {searched && bookings.length > 0 && (
                <div className="mt-6 space-y-4">
                    <h2 className="text-lg font-semibold text-text-primary">
                        Your appointments ({bookings.length})
                    </h2>

                    {bookings.map((booking) => {
                        const isCancelling = cancellingId === booking.id;

                        return (
                            <article
                                key={booking.id}
                                className="rounded-lg border border-border-default p-4 sm:p-5"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-text-secondary">
                                            Patient
                                        </p>
                                        <p className="mt-1 font-medium text-text-primary">
                                            {booking.name}
                                        </p>
                                    </div>

                                    <span className="rounded-full border border-border-default px-3 py-1 text-xs font-medium capitalize text-text-primary">
                                        {booking.status}
                                    </span>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div>
                                        <p className="text-sm text-text-secondary">
                                            Appointment slot
                                        </p>
                                        <p className="mt-1 text-sm text-text-primary">
                                            {booking.slot_id}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-text-secondary">
                                            Booking created
                                        </p>
                                        <p className="mt-1 text-sm text-text-primary">
                                            {Number.isNaN(
                                                Date.parse(booking.created_at),
                                            )
                                                ? booking.created_at
                                                : new Date(
                                                    booking.created_at,
                                                ).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {booking.status === "confirmed" ? (
                                    <div className="mt-5 border-t border-border-default pt-4">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleCancel(booking)
                                            }
                                            disabled={cancellingId !== null}
                                            className="min-h-11 w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isCancelling
                                                ? "Cancelling appointment..."
                                                : "Cancel appointment"}
                                        </button>

                                        <p className="mt-2 text-xs leading-5 text-text-secondary">
                                            Cancelling releases the appointment
                                            slot for other patients.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="mt-4 rounded-lg border border-border-default p-3 text-sm text-text-secondary">
                                        This appointment is cancelled.
                                    </p>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {cancelError && (
                <p
                    role="alert"
                    className="mt-4 rounded-lg border border-notice-border bg-notice-bg p-3 text-sm text-text-primary"
                >
                    {cancelError}
                </p>
            )}
        </section>
    );
}
