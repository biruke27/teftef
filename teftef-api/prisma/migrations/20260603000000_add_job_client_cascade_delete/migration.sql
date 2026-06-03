-- AlterTable: Add ON DELETE CASCADE to Job.client foreign key
ALTER TABLE "Job" DROP CONSTRAINT "Job_clientId_fkey";
ALTER TABLE "Job" ADD CONSTRAINT "Job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
