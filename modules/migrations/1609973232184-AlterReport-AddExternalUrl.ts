import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterReportAddExternalUrl1609973232184 implements MigrationInterface {
    name = 'AlterReportAddExternalUrl1609973232184'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" ADD "url" text NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "reports"."createdAt" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "reports"."createdAt" IS NULL`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "url"`);
    }

}
