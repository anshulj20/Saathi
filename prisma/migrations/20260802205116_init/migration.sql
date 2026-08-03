-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'nurse', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending_vetting', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('available', 'blocked');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('awaiting_confirmation', 'confirmed');

-- CreateEnum
CREATE TYPE "SosTriggeredBy" AS ENUM ('nurse', 'customer');

-- CreateEnum
CREATE TYPE "SosRoute" AS ENUM ('emergency_services', 'caregiver_emergency_contact');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'pending_vetting',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurse_profiles" (
    "user_id" UUID NOT NULL,
    "specializations" TEXT[],
    "experience_years" INTEGER NOT NULL,
    "price_per_day" DECIMAL(10,2) NOT NULL,
    "gender" "Gender" NOT NULL,
    "bio" TEXT,
    "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "nurse_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "customer_profiles" (
    "user_id" UUID NOT NULL,
    "location_text" TEXT NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" UUID NOT NULL,
    "customer_user_id" UUID NOT NULL,
    "patient_name" TEXT NOT NULL,
    "condition_summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" UUID NOT NULL,
    "customer_user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_slots" (
    "id" UUID NOT NULL,
    "nurse_user_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'available',

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "customer_user_id" UUID NOT NULL,
    "nurse_user_id" UUID NOT NULL,
    "patient_profile_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending_payment',
    "care_instructions" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actual_start_at" TIMESTAMP(3),
    "actual_end_at" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_references" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "qr_reference_code" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'awaiting_confirmation',
    "confirmed_by_admin_id" UUID,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "payment_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_events" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "triggered_by" "SosTriggeredBy" NOT NULL,
    "route" "SosRoute" NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sos_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "nurse_user_id" UUID NOT NULL,
    "stars" INTEGER NOT NULL,
    "feedback_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications_log" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "booking_id" UUID,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_customer_user_id_key" ON "patient_profiles"("customer_user_id");

-- CreateIndex
CREATE INDEX "emergency_contacts_customer_user_id_idx" ON "emergency_contacts"("customer_user_id");

-- CreateIndex
CREATE INDEX "availability_slots_nurse_user_id_status_idx" ON "availability_slots"("nurse_user_id", "status");

-- CreateIndex
CREATE INDEX "bookings_customer_user_id_idx" ON "bookings"("customer_user_id");

-- CreateIndex
CREATE INDEX "bookings_nurse_user_id_idx" ON "bookings"("nurse_user_id");

-- CreateIndex
CREATE INDEX "bookings_nurse_user_id_status_idx" ON "bookings"("nurse_user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_references_booking_id_key" ON "payment_references"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_references_qr_reference_code_key" ON "payment_references"("qr_reference_code");

-- CreateIndex
CREATE INDEX "sos_events_booking_id_idx" ON "sos_events"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_booking_id_key" ON "ratings"("booking_id");

-- CreateIndex
CREATE INDEX "ratings_nurse_user_id_idx" ON "ratings"("nurse_user_id");

-- AddForeignKey
ALTER TABLE "nurse_profiles" ADD CONSTRAINT "nurse_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_nurse_user_id_fkey" FOREIGN KEY ("nurse_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_nurse_user_id_fkey" FOREIGN KEY ("nurse_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_references" ADD CONSTRAINT "payment_references_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_references" ADD CONSTRAINT "payment_references_confirmed_by_admin_id_fkey" FOREIGN KEY ("confirmed_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_events" ADD CONSTRAINT "sos_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_nurse_user_id_fkey" FOREIGN KEY ("nurse_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications_log" ADD CONSTRAINT "notifications_log_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
