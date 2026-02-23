-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "kpi" DROP NOT NULL,
ALTER COLUMN "attendanceRate" DROP NOT NULL,
ALTER COLUMN "teamId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isOnBoarded" BOOLEAN NOT NULL DEFAULT false;
