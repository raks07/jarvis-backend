import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSetup1652345678901 implements MigrationInterface {
  name = "InitialSetup1652345678901";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This is a placeholder migration that doesn't do anything
    // You can replace this with actual schema changes when needed
    await queryRunner.query(`SELECT 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes made in the up method if needed
  }
}
