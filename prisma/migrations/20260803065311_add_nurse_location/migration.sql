/*
  Warnings:

  - Added the required column `location_text` to the `nurse_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "nurse_profiles" ADD COLUMN     "location_text" TEXT NOT NULL;
