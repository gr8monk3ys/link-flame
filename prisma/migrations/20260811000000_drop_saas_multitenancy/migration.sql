-- DropForeignKey
ALTER TABLE "BillingEvent" DROP CONSTRAINT "BillingEvent_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationInvitation" DROP CONSTRAINT "OrganizationInvitation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationSubscription" DROP CONSTRAINT "OrganizationSubscription_organizationId_fkey";

-- DropTable
DROP TABLE "ApiKey";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "BillingEvent";

-- DropTable
DROP TABLE "Organization";

-- DropTable
DROP TABLE "OrganizationInvitation";

-- DropTable
DROP TABLE "OrganizationMember";

-- DropTable
DROP TABLE "OrganizationSubscription";

