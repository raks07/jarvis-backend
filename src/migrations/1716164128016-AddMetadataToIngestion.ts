import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMetadataToIngestion1716164128016 implements MigrationInterface {
  name = "AddMetadataToIngestion1716164128016";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ingestions"
      ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ingestions"
      DROP COLUMN IF EXISTS "metadata"
    `);
  }
}
